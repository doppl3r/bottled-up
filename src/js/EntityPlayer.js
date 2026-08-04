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
        class: 'EntityModel',
        url: 'glb/ball.glb',
        scale: {
          x: 0.5,
          y: 0.5,
          z: 0.5
        },
        children: [
          {
            class: 'EntityMixer',
          },
          {
            class: 'EntityDecal',
            url: 'png/smile.png',
            position: { x: 0, y: 0, z: 0.25 },
            normal: { x: 0, y: 0, z: 1 },
            scale: { x: 0.9, y: 0.9, z: 0.9 }
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