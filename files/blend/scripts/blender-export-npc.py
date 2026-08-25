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
armature_name = "Armature"

# Function to export each collection containing NPCs to GLB format
def export_collection(collection, armature, export_path):
    # Define the full export path for the collection
    full_export_path = os.path.join(export_path, f"{collection.name}.glb")

    # Deselect all objects to start fresh
    bpy.ops.object.select_all(action='DESELECT')
    armature.select_set(True)

    # Select all objects in the collection
    for obj in collection.objects:
        obj.select_set(True)

    # Export the collection to GLB format
    bpy.context.view_layer.objects.active = armature
    restore_spritesheets = prepare_spritesheets_for_export()
    try:
        bpy.ops.export_scene.gltf(
            filepath=full_export_path,
            export_format='GLB',
            use_selection=True,
            use_visible=False,
            export_animations=True,
            export_animation_mode='ACTIONS',
            export_skins=True,
            export_cameras=False,
            export_lights=False,
            export_apply=True
        )
    finally:
        restore_spritesheets()
    print(f"Successfully exported to: {full_export_path}")

# Script execution starts here
export_path = bpy.path.abspath(relative_path)
os.makedirs(export_path, exist_ok=True)

# Check if the armature exists before proceeding
armature = bpy.data.objects.get(armature_name)
if not armature:
    print(f"Error: Could not find an object named '{armature_name}'")
else:
    # Get all collections that do not contain the armature itself
    armature_collections = set(armature.users_collection)

    # Iterate over all collections in the Blender file
    for collection in bpy.data.collections:
        if collection in armature_collections:
            continue
        try:
            export_collection(collection, armature, export_path)
            print(f"Successfully exported collection '{collection.name}'")
        except Exception as error:
            print(f"Failed to export collection '{collection.name}': {error}")

    print("--- Bulk Relative Export Complete! ---")

shutil.rmtree(cache_path, ignore_errors=True)