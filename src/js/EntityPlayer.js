import { Entity } from './core/Entity.js';

class EntityPlayer extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);
  }

  static template = {
    children: [
      {
        class: 'EntityBallController'
      },
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
        },
        children: [
          {
            class: 'EntityDecal',
            url: 'png/smile.png',
            position: { x: 0, y: 0, z: 0.25 },
            normal: { x: 0, y: 0, z: 1 },
            scale: { x: 0.5, y: 0.5, z: 0.5 }
          }
        ]
      },
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 0,
          softCcdPrediction: 1.0,
          colliders: [
            {
              shapeDesc: {
                type: 'ball',
                arguments: [0.25]
              }
            }
          ]
        }
      },
      {
        class: 'EntityShadow',
        distance: 64,
        scale: { x: 0.5, y: 0.5, z: 0.5 }
      }
    ]
  }
}

export { EntityPlayer }