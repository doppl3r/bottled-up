import bpy
import os


# Set the relative export destination.
relative_path = "//../../public/glb/"

# Require a saved Blender file for path resolution.
if not bpy.data.filepath:
    raise RuntimeError("Save the Blender file before exporting collections")

# Create the export directory if needed.
export_path = bpy.path.abspath(relative_path)
os.makedirs(export_path, exist_ok=True)

# Gather top-level collections to export.
collections = [
    (collection, collection.name)
    for collection in bpy.context.scene.collection.children
]
if not collections:
    blend_name = os.path.splitext(os.path.basename(bpy.data.filepath))[0]
    collections.append((bpy.context.scene.collection, blend_name))

# Save the current selection for restoration.
selected_objects = list(bpy.context.selected_objects)
active_object = bpy.context.view_layer.objects.active

try:
    for collection, export_name in collections:
        # Exclude cameras and lights from the export selection.
        exportable_objects = [
            obj for obj in collection.objects
            if obj.type not in {'CAMERA', 'LIGHT'}
        ]

        # Gather armatures for export.
        armatures = [obj for obj in exportable_objects if obj.type == 'ARMATURE']

        # Include armatures referenced by collection objects.
        for obj in collection.objects:
            for modifier in obj.modifiers:
                if modifier.type != 'ARMATURE':
                    continue

                armature = modifier.object
                if armature and armature not in exportable_objects:
                    exportable_objects.append(armature)
                    armatures.append(armature)

        # Skip collections with no exportable objects.
        if not exportable_objects:
            print(f"Skipping collection '{collection.name}': no exportable objects")
            continue

        # Define the full export path for the GLB file.
        full_export_path = os.path.join(export_path, f"{export_name}.glb")

        try:
            # Select only the objects for this collection.
            bpy.ops.object.select_all(action='DESELECT')
            for obj in exportable_objects:
                obj.select_set(True)

            # Set the active object to the first armature if available
            bpy.context.view_layer.objects.active = armatures[0] if armatures else exportable_objects[0]
            
            # Export the selected collection as a GLB.
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
finally:
    # Reselect the objects from before the export.
    bpy.ops.object.select_all(action='DESELECT')
    for obj in selected_objects:
        if obj.name in bpy.data.objects:
            obj.select_set(True)

    if active_object and active_object.name in bpy.data.objects:
        bpy.context.view_layer.objects.active = active_object

# Define the completion popup.
def show_export_complete(self, context):
    self.layout.label(text="Collection GLB export complete.")

# Report completion in the console and Blender UI.
print("--- Collection GLB Export Complete! ---")
bpy.context.window_manager.popup_menu(show_export_complete, title="GLB Export", icon='INFO')