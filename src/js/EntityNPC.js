import { Entity } from './core/Entity.js';

class EntityNPC extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // TODO: Remove URL selection logic
    options.children[0].url = EntityNPC.urls[0];
    EntityNPC.urls.splice(0, 1);

    this.time = 0;
    this.state = 'wounded';

    // Update entity state
    this.ready();
  }

  render(loop) {
    const status = this.get('EntityModel').get('EntityModel');
    
    // Update status model properties
    this.time += loop.delta;
    const duration = 2500;
    const alpha = (Math.sin(this.time * 2 * Math.PI / duration) + 1) / 2;
    status.position.y = 1 + (alpha * 0.25);
    status.scale.setScalar(0.5 + (alpha * 0.25));

    super.render(loop);
  }

  revive = event => {
    // Check if collision is with player
    if (event.pair.parent.class === 'EntityPlayer') {
      if (this.state === 'wounded') {
        // Update model mixer
        const entityModelBody = this.get('EntityModel');
        const entityModelStatus = entityModelBody.get('EntityModel');
        const entityMixer = entityModelBody.get('EntityMixer');
        
        // Update NPC state
        this.state = 'revived';
        entityMixer.play(event.value);
        entityModelStatus.visible = false;
      }
    }
  }

  updateDialog = event => {
    // Check if collision is with player
    if (event.pair.parent.class === 'EntityPlayer') {
      // Show or hide dialog based on event type
      
    }
  }

  static urls = [
    'glb/npc-warrior.glb',
    'glb/npc-priest.glb',
    'glb/npc-rogue.glb',
    'glb/npc-mage.glb',
  ]

  static npcs = {
    mage: {
      modelBody: 'glb/npc-mage.glb',
      modelStatus: 'glb/potion-ball.glb',
    }
  }

  static template = {
    children: [
      {
        name: 'ModelBody',
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
          },
          {
            name: 'ModelStatus',
            class: 'EntityModel',
            url: 'glb/quest.glb',
          },
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
              shape: {
                type: 'ball',
                arguments: [0.5]
              },
              enter: {
                name: 'revive',
                value: '_IdleStanding'
              }
            },
            {
              isSensor: true,
              shape: {
                type: 'ball',
                arguments: [5]
              },
              enter: {
                name: 'updateDialog',
              },
              exit: {
                name: 'updateDialog',
              },
            }
          ]
        }
      }
    ]
  }
}

export { EntityNPC }