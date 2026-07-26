import { Entity } from './Entity.js';

class EntityBall extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);
  }

  static template = {
    name: 'ball',
    label: 'Ball',
    class: 'Entity',
    children: [
      {
        class: 'EntityMesh',
        castShadow: false,
        receiveShadow: true,
        geometry: {
          type: 'SphereGeometry',
          arguments: [0.25, 16, 16]
        },
        material: {
          type: 'MeshStandardMaterial',
          arguments: [{ color: '#42bfe8' }],
        }
      },
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 1,
          colliders: [
            {
              shapeDesc: {
                type: 'ball',
                arguments: [0.25]
              }
            }
          ]
        }
      }
    ]
  }
}

export { EntityBall }