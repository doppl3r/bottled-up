# Blender Spritesheet Extrusion Plan

## Goal

When an existing Blender export script runs, spritesheet textures with recognized filename metadata should be padded in memory, their mesh UVs should be updated, and the resulting texture should be embedded in the exported GLB.

Source image files must never be modified.

The solution should require only Blender's built-in `bpy` API and Python's standard library. No Blender addon, Pillow, NumPy, or external Python module is required.

## Filename Convention

The image filename is the only configuration surface. Supported forms are:

```text
forge_tile16.png
forge_grid25.png
forge_grid25x25.png
```

Meanings:

- `tile16`: every square tile is 16 by 16 pixels; derive the square grid from the image dimensions.
- `grid25`: the image contains a 25 by 25 square grid; derive the tile size from the image dimensions.
- `grid25x25`: same as `grid25`, written explicitly.

All forms resolve to:

```python
{
    "tile_size": ...,
    "rows": ...,
    "columns": ...,
}
```

The parser should reject non-square forms such as `grid25x24` and reject dimensions that do not divide evenly.

If an image filename has no recognized suffix, print a warning containing the image name and skip it. Do not assume unmarked images are `1x1` spritesheets. Ordinary level textures, icons, and skyboxes must remain unchanged.

## Export Flow

Existing export scripts should need one call immediately before `bpy.ops.export_scene.gltf(...)`:

```python
from blender_spritesheet import prepare_spritesheets_for_export

prepare_spritesheets_for_export()
```

The function should:

1. Scan Blender image datablocks.
2. Parse recognized filename metadata.
3. Read source pixels using Blender's image API.
4. Create a new expanded `bpy.data.images` image in memory.
5. Duplicate each tile's edge texels into a one-pixel gutter.
6. Rebind relevant material image texture nodes to the generated image.
7. Remap mesh UVs per loop into the non-gutter interior of each expanded tile.
8. Leave the original image datablock and source PNG untouched.

Generated image names should be deterministic, for example:

```text
forge_tile16__extruded_1px_4x4
```

A generated image must not be processed again during repeated exports in the same Blender session.

## Example Dimensions

For a 64 by 64 image with a 4 by 4 grid and one pixel of extrusion:

```text
source tile:   16 by 16 pixels
expanded tile: 18 by 18 pixels
output image:  72 by 72 pixels
```

General output dimensions:

```text
output_width  = source_width  + 2 * extrusion_size * columns
output_height = source_height + 2 * extrusion_size * rows
```

The default extrusion size is `1` pixel. The public function may accept an override for testing or future use.

## Current Implementation

The implementation is in:

```text
blender_spritesheet.py
```

It is currently integrated into:

```text
blender-export-level.py
blender-export-npc.py
blender-export-potions.py
```

The module currently includes:

- Filename parsing for `_tile<size>`, `_grid<size>`, and `_grid<size>x<size>`.
- Square image and divisibility validation.
- In-memory image creation with `bpy.data.images`.
- Per-tile edge pixel duplication.
- Material node rebinding.
- Per-loop UV remapping.
- Repeated-processing protection.
- Warning-and-skip behavior for ordinary image names.

## Validation Needed Inside Blender

Blender is required for these checks:

1. Create or use a 64 by 64 test image named `test_grid4x4.png`.
2. Run the export script and verify the generated image is 72 by 72.
3. Inspect corner, edge, and interior pixels in the generated image.
4. Confirm UVs at all four corners and the center select the correct tile interiors.
5. Confirm the V-axis orientation matches the model artwork.
6. Export a representative GLB and verify it references the generated image.
7. Confirm the source PNG file remains unchanged.
8. Run the preprocessing twice and confirm it does not add another padding layer.
9. Test nearest and linear texture filtering. If mipmapped minification is used, verify whether a one-pixel gutter is sufficient.
10. Test transparent sprite edges for halo or light-pixel artifacts.

## Known Considerations

- Edge extrusion helps prevent neighboring atlas tiles from bleeding under texture filtering, but UV inset/remapping is also required.
- One pixel is generally suitable for nearest or basic linear filtering. Mipmap levels may require a larger gutter.
- Transparent textures may need special handling if RGB values in transparent pixels cause mipmap halos. The current intended default is to duplicate full RGBA edge pixels.
- Runtime particle atlases in `src/js/core/Particles.js` use a separate horizontal-strip layout and should not automatically be treated as Blender spritesheets.
