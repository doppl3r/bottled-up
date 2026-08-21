import { Entity } from './Entity.js';

class EntityBall extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);
  }

  static template = {
    children: [
      {
        class: 'EntityMesh',
        castShadow: false,
        receiveShadow: true,
        geometry: {
          type: 'SphereGeometry',
          arguments: [0.5, 16, 16]
        },
        material: {
          type: 'MeshStandardMaterial',
          arguments: [{ color: '#ffffff' }],
        }
      },
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 0,
          colliders: [
            {
              shapeDesc: {
                type: 'ball',
                arguments: [0.5]
              }
            }
          ]
        }
      }
    ]
  }
}

export { EntityBall }