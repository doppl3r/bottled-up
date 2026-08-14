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
        url: 'glb/npc-warrior.glb',
        position: { x: 0, y: 0, z: 0 },
      },
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 0,
          softCcdPrediction: 1.0,
          sleeping: true,
          colliders: [
            {
              translation: { x: 0, y: 1, z: 0 },
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