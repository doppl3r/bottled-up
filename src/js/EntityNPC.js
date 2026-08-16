import { Entity } from './core/Entity.js';

class EntityNPC extends Entity {
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
        class: 'EntityModel',
        url: 'glb/npc-rogue.glb',
        position: { x: 0, y: -0.25, z: 0 },
        children: [
          {
            class: 'EntityMixer',
            actions: {
              _IdleStanding: {
                crossFadeDuration: 0.25,
                default: true,
                loop: true
              },
              _IdleWounded: {
                crossFadeDuration: 0.25,
                loop: true
              }
            }
          }
        ]
      },
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 2,
          softCcdPrediction: 1.0,
          sleeping: true,
          colliders: [
            {
              isSensor: true,
              shapeDesc: {
                shapes: [
                  {
                    type: 'capsule',
                    arguments: [0.5, 0.5]
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }
}

export { EntityNPC }