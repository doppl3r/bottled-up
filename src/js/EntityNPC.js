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
    const potion = this.get('EntityModel').get('EntityModel');
    this.time += loop.delta;
    potion.position.y = 0.5 + Math.cos(this.time * 0.0025) * 0.125;
    potion.rotation.y += loop.delta * 0.0025;

    super.render(loop);
  }

  revive = event => {
    // Check if collision is with player
    if (event.pair.parent.class === 'EntityPlayer') {
      if (this.state === 'wounded') {
        // Update model mixer
        const entityModelBody = this.get('EntityModel');
        const entityModelPotion = entityModelBody.get('EntityModel');
        const entityMixer = entityModelBody.get('EntityMixer');
        
        // Update NPC state
        this.state = 'revived';
        entityMixer.play(event.value);
        entityModelPotion.visible = false;
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
      modelPotion: 'glb/potion-ball.glb',
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
            name: 'ModelPotion',
            class: 'EntityModel',
            url: 'glb/potion-ball.glb',
            position: { x: 0, y: 0.5, z: 0 },
            rotation: { x: 0, y: 0, z: Math.PI / 8 },
            scale: { x: 0.5, y: 0.5, z: 0.5 },
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