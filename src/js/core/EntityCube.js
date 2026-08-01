import { Box3, Vector3 } from 'three';
import { Entity } from './Entity.js';

/*
  EntityCube is a specialized entity that represents a cube-shaped object
  with a corresponding physics collider. It automatically adjusts its scale
  based on the size of the associated model.
*/

// Initialize module-scoped variables
const _v = new Vector3();

class EntityCube extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);
  }

  init(options, core) {
    // Update template for child entities
    for (let i = 0; i < options.children.length; i++) {
      // Update child entity options
      let child = options.children[i];

      // Update model properties
      if (child.class === 'EntityModel') {
        const model = core.assets.get(options.url);

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
        // Update transformations
        child.rigidBody.position = options.position;
        child.rigidBody.rotation = options.rotation;

        // Update scale based on model size
        const model = core.assets.get(options.url);
        if (model) {
          model.rotation.set(0, 0, 0);
          const size = new Box3().setFromObject(model).getSize(_v);
          options.scale.x = size.x;
          options.scale.y = size.y;
          options.scale.z = size.z;
        }
        
        // Update shape scale
        const colliders = child.rigidBody.colliders;
        colliders.forEach(colliderOptions => {
          const args = [ options.scale.x / 2, options.scale.y / 2, options.scale.z / 2];
          colliderOptions.shapeDesc.arguments = args;
        });
      }
    }

    // Resume base entity initialization
    super.init(options, core);
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