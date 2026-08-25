import math
import os
import re

import bpy


_TILE_PATTERN = re.compile(r"_tile(?P<tile>\d+)$", re.IGNORECASE)
_GRID_PATTERN = re.compile(
    r"_grid(?P<columns>\d+)(?:x(?P<rows>\d+))?$", re.IGNORECASE
)
_GENERATED_MARKER = "__extruded_"


def _parse_layout(image_name):
    stem = os.path.splitext(image_name)[0]

    tile_match = _TILE_PATTERN.search(stem)
    if tile_match:
        tile_size = int(tile_match.group("tile"))
        if tile_size < 1:
            raise ValueError(f"Invalid tile size in image name '{image_name}'")
        return tile_size, None

    grid_match = _GRID_PATTERN.search(stem)
    if grid_match:
        columns = int(grid_match.group("columns"))
        rows = int(grid_match.group("rows") or columns)
        if columns < 1 or rows != columns:
            raise ValueError(
                f"Spritesheet grid must be a positive square in '{image_name}'"
            )
        return None, columns

    return None


def _resolve_layout(image):
    parsed = _parse_layout(image.name)
    if parsed is None:
        print(
            f"WARNING: Skipping image '{image.name}': "
            "expected _tile<size> or _grid<size>[x<size>] suffix"
        )
        return None

    tile_size, grid_size = parsed
    width, height = image.size[:]
    if width != height:
        raise ValueError(f"Spritesheet '{image.name}' must have square dimensions")

    if tile_size is not None:
        if width % tile_size != 0:
            raise ValueError(
                f"Spritesheet '{image.name}' dimensions {width}x{height} "
                f"are not divisible by tile size {tile_size}"
            )
        columns = rows = width // tile_size
    else:
        if width % grid_size != 0:
            raise ValueError(
                f"Spritesheet '{image.name}' dimensions {width}x{height} "
                f"are not divisible by grid size {grid_size}"
            )
        tile_size = width // grid_size
        columns = rows = grid_size

    return tile_size, rows, columns


def _pixel(pixels, width, x, y):
    index = (y * width + x) * 4
    return pixels[index:index + 4]


def _create_extruded_image(image, tile_size, rows, columns, extrusion_size):
    source_width, source_height = image.size[:]
    output_width = source_width + (extrusion_size * 2 * columns)
    output_height = source_height + (extrusion_size * 2 * rows)
    output_name = (
        f"{image.name}{_GENERATED_MARKER}{extrusion_size}px_"
        f"{rows}x{columns}"
    )

    existing = bpy.data.images.get(output_name)
    if existing:
        return existing

    source_pixels = [0.0] * (source_width * source_height * 4)
    image.pixels.foreach_get(source_pixels)
    output_pixels = [0.0] * (output_width * output_height * 4)

    expanded_tile_size = tile_size + extrusion_size * 2
    for row in range(rows):
        for column in range(columns):
            source_origin_x = column * tile_size
            source_origin_y = row * tile_size
            output_origin_x = column * expanded_tile_size
            output_origin_y = row * expanded_tile_size
            for output_y in range(expanded_tile_size):
                source_y = source_origin_y + max(
                    0, min(tile_size - 1, output_y - extrusion_size)
                )
                for output_x in range(expanded_tile_size):
                    source_x = source_origin_x + max(
                        0, min(tile_size - 1, output_x - extrusion_size)
                    )
                    color = _pixel(source_pixels, source_width, source_x, source_y)
                    target_index = (
                        (output_origin_y + output_y) * output_width
                        + output_origin_x
                        + output_x
                    ) * 4
                    output_pixels[target_index:target_index + 4] = color

    output = bpy.data.images.new(
        output_name,
        width=output_width,
        height=output_height,
        alpha=True,
        float_buffer=image.is_float,
    )
    output.file_format = image.file_format
    output.colorspace_settings.name = image.colorspace_settings.name
    output.pixels.foreach_set(output_pixels)
    output.pack()
    return output


def _remap_uvs(mesh, tile_size, rows, columns, extrusion_size):
    if not mesh.uv_layers:
        return

    source_size = tile_size * columns
    output_size = source_size + (extrusion_size * 2 * columns)

    for uv_layer in mesh.uv_layers:
        for polygon in mesh.polygons:
            polygon_coordinates = [
                uv_layer.data[loop_index].uv
                for loop_index in polygon.loop_indices
            ]
            normalized_coordinates = [
                (
                    coordinate.x if 0.0 <= coordinate.x <= 1.0
                    else coordinate.x % 1.0,
                    coordinate.y if 0.0 <= coordinate.y <= 1.0
                    else coordinate.y % 1.0,
                )
                for coordinate in polygon_coordinates
            ]
            center_u = sum(coordinate[0] for coordinate in normalized_coordinates)
            center_u /= len(normalized_coordinates)
            center_v = sum(coordinate[1] for coordinate in normalized_coordinates)
            center_v /= len(normalized_coordinates)
            column = min(columns - 1, max(0, int(center_u * columns)))
            row = min(rows - 1, max(0, int(center_v * rows)))

            for loop_index, (normalized_u, normalized_v) in zip(
                polygon.loop_indices, normalized_coordinates
            ):
                source_u = normalized_u * source_size
                source_v = normalized_v * source_size
                local_u = source_u - column * tile_size
                local_v = source_v - row * tile_size
                uv = uv_layer.data[loop_index].uv
                uv.x = (
                    column * (tile_size + extrusion_size * 2)
                    + extrusion_size
                    + local_u
                ) / output_size
                uv.y = (
                    row * (tile_size + extrusion_size * 2)
                    + extrusion_size
                    + local_v
                ) / output_size


def _image_nodes(image):
    for material in bpy.data.materials:
        if not material.use_nodes:
            continue
        for node in material.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image == image:
                yield material, node


def prepare_spritesheets_for_export(extrusion_size=1):
    if not isinstance(extrusion_size, int) or extrusion_size < 1:
        raise ValueError("extrusion_size must be a positive integer")

    processed = set()
    node_restorations = []
    uv_restorations = []
    restored_meshes = set()
    created_images = []

    # Prepare only temporary Blender state; the caller restores it after export.
    for image in list(bpy.data.images):
        if image.name in processed or _GENERATED_MARKER in image.name:
            continue

        layout = _resolve_layout(image)
        if layout is None:
            continue

        tile_size, rows, columns = layout
        generated_name = (
            f"{image.name}{_GENERATED_MARKER}{extrusion_size}px_"
            f"{rows}x{columns}"
        )
        generated_existed = bpy.data.images.get(generated_name) is not None
        generated = _create_extruded_image(
            image, tile_size, rows, columns, extrusion_size
        )
        if not generated_existed:
            created_images.append(generated)
        users = list(_image_nodes(image))
        remapped_meshes = set()
        for material, node in users:
            node_restorations.append((node, image))
            node.image = generated
            for obj in bpy.data.objects:
                if (
                    obj.type == 'MESH'
                    and obj.data.materials.get(material.name) is not None
                    and obj.data.name not in remapped_meshes
                ):
                    if obj.data.name not in restored_meshes:
                        uv_layers = [
                            (uv_layer, [data.uv.copy() for data in uv_layer.data])
                            for uv_layer in obj.data.uv_layers
                        ]
                        uv_restorations.append((obj.data, uv_layers))
                        restored_meshes.add(obj.data.name)
                    _remap_uvs(obj.data, tile_size, rows, columns, extrusion_size)
                    remapped_meshes.add(obj.data.name)
        processed.add(image.name)
        print(f"Extruded '{image.name}' -> '{generated.name}'")

    restored = False

    def restore_originals():
        nonlocal restored
        if restored:
            return

        # Restore every changed datablock before Blender can save the scene.
        for node, image in node_restorations:
            node.image = image
        for mesh, uv_layers in uv_restorations:
            for uv_layer, coordinates in uv_layers:
                for index, coordinate in enumerate(coordinates):
                    uv_layer.data[index].uv = coordinate
        for image in created_images:
            if bpy.data.images.get(image.name) is image:
                bpy.data.images.remove(image)
        restored = True

    return restore_originals
