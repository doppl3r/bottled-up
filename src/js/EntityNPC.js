import { Entity } from './core/Entity.js';

class EntityNPC extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);

    // Get physics entity after it gets added
    this.get('EntityPhysics', entity => {
      entity.addEventListener('collision', this.onCollision);
    });
  }

  load(options, core) {
    // TODO: Remove URL selection logic
    options.children[0].url = EntityNPC.urls[0];
    EntityNPC.urls.splice(0, 1);

    super.load(options, core);
  }

  render(loop) {
    super.render(loop);
  }

  onCollision = event => {
    // Check if collision is with player
    if (event.pair.parent.class === 'EntityPlayer' && event.started) {
      // Update model mixer
      const entityModel = this.get('EntityModel');
      const entityMixer = entityModel.get('EntityMixer');
      entityMixer.play('_IdleStanding');
    }
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
        children: [
          {
            class: 'EntityMixer',
            actions: {
              _IdleStanding: {
                crossFadeDuration: 0.25,
                loop: true
              },
              _IdleWounded: {
                crossFadeDuration: 0.25,
                default: true,
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
                    type: 'ball',
                    arguments: [0.5]
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