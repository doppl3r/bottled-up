import { Box3, Box3Helper, Vector3 } from 'three';
import { Entity } from './Entity.js';

/*
  EntityCube is a specialized entity that represents a cube-shaped object
  with a corresponding physics collider. It automatically adjusts its scale
  based on the size of the associated model.
*/

// Initialize module-scoped variables
const _box3 = new Box3();
const _size = new Vector3(1, 1, 1);
const _center = new Vector3(0, 0, 0);

class EntityCube extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Update model properties
    const model = core.assets.get(options.url);
    if (model) {
      // Clear model transforms
      const scale = model.scale.clone();
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);

      // Update bounding box
      _box3.setFromObject(model);
      _box3.getSize(_size);
      _box3.getCenter(_center);

      // Translate mesh geometries (single or multiple) to center of bounding box
      model.traverse(child => {
        if (child.isMesh) {
          child.geometry.translate(-_center.x, -_center.y, -_center.z);
        }
      });

      // Multiply bounding box by original model scale
      _size.multiply(scale);
      _center.multiply(scale);

      // Revert model scale to original value
      model.scale.copy(scale);
    }
    else {
      // Set default size and center for non-mesh objects
      _size.set(options.scale.x, options.scale.y, options.scale.z);
      _center.set(0, 0, 0);
    }

    // Update template for child entities
    for (let i = 0; i < options.children.length; i++) {
      // Update child entity options
      let child = options.children[i];
      if (child.class === 'EntityModel') {
        // Check if model exists
        if (model) {
          child.url = options.url;
        }
        else {
          // Fallback: Replace EntityModel with EntityMesh
          options.children[i] = {
            class: 'EntityMesh',
            geometry: {
              type: 'BoxGeometry',
              arguments: [1, 1, 1]
            },
            material: {
              type: 'MeshStandardMaterial',
              arguments: [{ color: options.color }],
            }
          };
        }
      }
      else if (child.class === 'EntityPhysics') {
        // Update position from model center
        this.position.add(_center);

        // Update scale from model box
        options.scale.x = _size.x;
        options.scale.y = _size.y;
        options.scale.z = _size.z;
        
        // Update shape scale
        const colliders = child.rigidBody.colliders;
        colliders.forEach(colliderOptions => {
          const args = [ options.scale.x / 2, options.scale.y / 2, options.scale.z / 2];
          colliderOptions.shapeDesc.arguments = args;
        });
      }
    }

    // Resume base entity load
    this.isLoaded = true;
  }

  static template = {
    color: '#ff00ff',
    url: '',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    children: [
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 0,
          colliders: [
            {
              shapeDesc: {
                type: 'cuboid',
                arguments: [0.5, 0.5, 0.5]
              }
            }
          ]
        }
      },
      {
        class: 'EntityModel'
      }
    ]
  }
}

export { EntityCube }