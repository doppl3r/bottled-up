import bpy
import os
import shutil
import sys
import importlib

scripts_path = bpy.path.abspath("//scripts")
cache_path = os.path.join(scripts_path, "__pycache__")
if scripts_path not in sys.path:
    sys.path.insert(0, scripts_path)
import utilities

importlib.reload(utilities)
prepare_spritesheets_for_export = utilities.prepare_spritesheets_for_export


relative_path = "//../../public/glb/"


def export_collection(collection, export_path):
    exportable_objects = [
        obj for obj in collection.objects
        if obj.type not in {'ARMATURE', 'CAMERA', 'LIGHT'}
    ]

    if not exportable_objects:
        print(f"Skipping collection '{collection.name}': no exportable objects")
        return

    full_export_path = os.path.join(export_path, f"{collection.name}.glb")

    bpy.ops.object.select_all(action='DESELECT')
    for obj in exportable_objects:
        obj.select_set(True)

    bpy.context.view_layer.objects.active = exportable_objects[0]
    restore_spritesheets = prepare_spritesheets_for_export()
    try:
        bpy.ops.export_scene.gltf(
            filepath=full_export_path,
            export_format='GLB',
            use_selection=True,
            use_visible=False,
            export_animations=False,
            export_skins=False,
            export_cameras=False,
            export_lights=False,
            export_apply=True
        )
    finally:
        restore_spritesheets()
    print(f"Successfully exported collection '{collection.name}' to: {full_export_path}")


export_path = bpy.path.abspath(relative_path)
os.makedirs(export_path, exist_ok=True)

for collection in bpy.data.collections:
    try:
        export_collection(collection, export_path)
    except Exception as error:
        print(f"Failed to export collection '{collection.name}': {error}")

print("--- Potion Collection Export Complete! ---")
shutil.rmtree(cache_path, ignore_errors=True)