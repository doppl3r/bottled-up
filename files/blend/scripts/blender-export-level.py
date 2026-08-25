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


blend_path = bpy.data.filepath
if not blend_path:
    raise RuntimeError("Save the Blender file before exporting a level")

export_path = bpy.path.abspath(relative_path)
level_name = os.path.splitext(os.path.basename(blend_path))[0]
full_export_path = os.path.join(export_path, f"{level_name}.glb")

os.makedirs(export_path, exist_ok=True)

restore_spritesheets = prepare_spritesheets_for_export()
try:
    bpy.ops.export_scene.gltf(
        filepath=full_export_path,
        export_format='GLB',
        use_selection=False,
        use_visible=True,
        export_animations=False,
        export_skins=False,
        export_extras=True,
        export_cameras=False,
        export_lights=False,
        export_apply=True
    )
finally:
    restore_spritesheets()
    shutil.rmtree(cache_path, ignore_errors=True)

print(f"Successfully exported level to: {full_export_path}")