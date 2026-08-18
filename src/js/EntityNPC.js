import { Entity } from './core/Entity.js';

class EntityNPC extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);

    // TODO: Remove frame logic
    this.frame = Math.random() * 500;
  }

  load(options, core) {
    // TODO: Remove URL selection logic
    const index = Math.floor(Math.random() * EntityNPC.urls.length);
    options.children[0].url = EntityNPC.urls[0];
    EntityNPC.urls.splice(0, 1);

    super.load(options, core);
  }

  render(loop) {
    // TODO: Remove frame logic
    if (loop.frame < this.frame) return;

    super.render(loop);
  }

  static urls = [
    'glb/npc-warrior.glb',
    'glb/npc-priest.glb',
    'glb/npc-rogue.glb',
    'glb/npc-mage.glb',
  ]

  static template = {
    children: [
      {
        class: 'EntityModel',
        url: 'glb/npc-mage.glb',
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