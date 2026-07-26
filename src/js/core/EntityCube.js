import { Entity } from './Entity.js';

class EntityCube extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);
  }

  static template = {
    name: 'cube',
    label: 'Cube',
    children: [
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 1,
          colliders: [
            {
              shapeDesc: {
                type: 'cuboid',
                arguments: [1, 1, 1]
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