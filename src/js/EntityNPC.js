import { Entity } from './core/Entity.js';

class EntityNPC extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // TODO: Remove URL selection logic
    options.children[0].url = EntityNPC.urls[0];
    EntityNPC.urls.splice(0, 1);

    // Update entity state
    this.ready();
  }

  render(loop) {
    super.render(loop);
  }

  updateMixer = event => {
    // Check if collision is with player
    if (event.pair.parent.class === 'EntityPlayer') {
      // Update model mixer
      const entityModel = this.get('EntityModel');
      const entityMixer = entityModel.get('EntityMixer');
      entityMixer.play(event.value);
    }
  }

  updateDialog = event => {
    // Check if collision is with player
    if (event.pair.parent.class === 'EntityPlayer') {
      // Show or hide dialog based on event type
      console.log('updateDialog', this.name, event.started);
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
              events: [
                {
                  name: 'updateMixer',
                  value: '_IdleStanding',
                  started: true
                }
              ],
              shape: {
                type: 'ball',
                arguments: [0.5]
              }
            },
            {
              isSensor: true,
              events: [
                {
                  name: 'updateDialog',
                  started: true
                },
                {
                  name: 'updateDialog',
                  started: false
                }
              ],
              shape: {
                type: 'ball',
                arguments: [5]
              }
            }
          ]
        }
      }
    ]
  }
}

export { EntityNPC }