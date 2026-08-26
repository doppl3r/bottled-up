import bpy
import os


relative_path = "//../../public/glb/"


if not bpy.data.filepath:
    raise RuntimeError("Save the Blender file before exporting collections")

export_path = bpy.path.abspath(relative_path)
os.makedirs(export_path, exist_ok=True)

collections = [
    (collection, collection.name)
    for collection in bpy.context.scene.collection.children
]
if not collections:
    blend_name = os.path.splitext(os.path.basename(bpy.data.filepath))[0]
    collections.append((bpy.context.scene.collection, blend_name))

for collection, export_name in collections:
    exportable_objects = [
        obj for obj in collection.objects
        if obj.type not in {'CAMERA', 'LIGHT'}
    ]

    armatures = [obj for obj in exportable_objects if obj.type == 'ARMATURE']
    for obj in collection.objects:
        for modifier in obj.modifiers:
            if modifier.type != 'ARMATURE':
                continue

            armature = modifier.object
            if armature and armature not in exportable_objects:
                exportable_objects.append(armature)
                armatures.append(armature)

    if not exportable_objects:
        print(f"Skipping collection '{collection.name}': no exportable objects")
        continue

    full_export_path = os.path.join(export_path, f"{export_name}.glb")

    try:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in exportable_objects:
            obj.select_set(True)

        bpy.context.view_layer.objects.active = armatures[0] if armatures else exportable_objects[0]
        bpy.ops.export_scene.gltf(
            filepath=full_export_path,
            export_format='GLB',
            use_selection=True,
            use_visible=False,
            export_animations=True,
            export_animation_mode='ACTIONS',
            export_skins=True,
            export_extras=True,
            export_cameras=False,
            export_lights=False,
            export_apply=True
        )
        print(f"Successfully exported collection '{collection.name}' to: {full_export_path}")
    except Exception as error:
        print(f"Failed to export collection '{collection.name}': {error}")

print("--- Collection GLB Export Complete! ---")