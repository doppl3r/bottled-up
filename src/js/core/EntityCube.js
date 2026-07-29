import { Entity } from './Entity.js';

class EntityCube extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);
  }

  init(options, core) {
    // Update cube options
    options.children.forEach(child => {
      if (child.class === 'EntityPhysics') {
        // Update transformations
        child.rigidBody.position = options.position;
        child.rigidBody.rotation = options.rotation;

        // Update shape scale
        const colliders = child.rigidBody.colliders;
        colliders.forEach(colliderOptions => {
          const args = [ options.scale.x / 2, options.scale.y / 2, options.scale.z / 2];
          colliderOptions.shapeDesc.arguments = args;
        });
      }
      else if (child.class === 'EntityMesh') {
        // Update material color
        child.material.arguments[0].color = options.color;
      }
    });

    super.init(options, core);
  }

  static template = {
    color: '#ffffff',
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
        class: 'EntityMesh',
        geometry: {
          type: 'BoxGeometry',
          arguments: [1, 1, 1]
        },
        material: {
          type: 'MeshStandardMaterial',
          arguments: [{ color: '#ffffff' }],
        }
      }
    ]
  }
}

export { EntityCube }