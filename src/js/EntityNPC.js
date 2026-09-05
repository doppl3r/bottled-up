import { onUpdated } from 'vue';
import { Entity } from './core/Entity.js';
import { Tweens } from './core/Tweens.js';

class EntityNPC extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Initialize NPC state
    this.time = 0;
    this.state = 'wounded';

    // Assign model and shift to the back
    options.children[0].url = EntityNPC.urls[0];
    EntityNPC.urls.push(EntityNPC.urls.shift());

    // Update particle rendering
    this.addParticles();

    // Animations
    this.tweens = new Tweens();

    // Update entity state
    this.ready();
  }

  render(loop) {
    // Update animations
    this.tweens.update(loop.delta);

    // Update status model properties
    if (this.state === 'wounded') {
      // Animate status "!" model
      const status = this.get('EntityModel').get('EntityModel');
      this.time += loop.delta;
      const duration = 2500;
      const alpha = (Math.sin(this.time * 2 * Math.PI / duration) + 1) / 2;
      status.position.y = 0.5 + (alpha * 0.25);
    }
    else {
      // Animate particles
      const entityParticles = this.get('EntityParticles');
      const speed = 0.00025;
      const range = 1;
      const delta = loop.delta;

      // Move all particles down by speed
      for (let i = 0; i < entityParticles.count; i++) {
        // Get alpha by current height of particle (0.0 to 1.0)
        const position = entityParticles.points.geometry.getAttribute('position');

        // Update position (wrapped)
        const x = position.getX(i) - 0 * speed * delta;
        const y = position.getY(i) - 0.75 * speed * delta;
        const z = position.getZ(i) - 0 * speed * delta;
        entityParticles.positionPoint(i, [
          x < -range / 2 ? x + range : x,
          y < -range / 2 ? y + range : y,
          z < -range / 2 ? z + range : z
        ]);

        // Update color alpha based on height
        const alpha = (position.getY(i) + (range / 2)) / range;
        const color = entityParticles.points.geometry.getAttribute('color');
        color.setW(i, 1 - alpha);
        color.needsUpdate = true;

        // Rotate particle
        entityParticles.rotatePoint(i, 0.0025 * delta);
      }
    }

    // Resume Entity render behavior
    super.render(loop);
  }

  interact = () => {
    if (this.state === 'wounded') {
      // Save player checkpoint
      game.saveCheckpoint();
      this.tweens.removeAll();
      
      // Update model mixer
      const entityModelBody = this.get('EntityModel');
      const entityModelStatus = entityModelBody.get('EntityModel');
      const entityMixer = entityModelBody.get('EntityMixer');
      const entityPrompt = this.get('EntityPrompt');
      const entityParticles = this.get('EntityParticles');
      
      // Update NPC state
      this.state = 'revived';
      entityMixer.play('_IdleStanding');
      entityPrompt.hide();
      entityModelStatus.visible = false;
      entityParticles.visible = true;
    }
  }

  enablePrompt = event => {
    if (this.state === 'wounded') {
      // Check if collision is with player
      if (event.pair.parent.class === 'EntityPlayer') {
        // Show or hide dialog based on event type
        const entityPrompt = this.get('EntityPrompt');
        entityPrompt.show();

        // Animate visibility
        this.tweens.tween({
          object: { alpha: event.started ? 0 : 1 },
          to: { alpha: event.started ? 1 : 0 },
          duration: 250,
          onUpdate: obj => entityPrompt.setStyle(`opacity: ${obj.alpha}`),
          onComplete: () => entityPrompt.setVisibility(event.started)
        });
      }
    }
  }

  addParticles = () => {
    // Loop through capacity and add random particles
    this.get('EntityParticles', child => {
      const range = 1;
      for (let i = 0; i < child.capacity; i++) {
        const opacity = Math.random();
        const scale = (Math.random() * 0.5) + 0.5;
        child.addPoint({
          color: [1, 1, 1, opacity],
          scale: scale,
          angle: Math.random() * 2 * Math.PI,
          position: [
            Math.random() * range - (range / 2),
            Math.random() * range - (range / 2),
            Math.random() * range - (range / 2)
          ]
        });
      }
    });
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
            class: 'EntityModel',
            url: 'glb/quest.glb',
            scale: { x: 0.5, y: 0.5, z: 0.5 }
          }
        ]
      },
      {
        class: 'EntityParticles',
        capacity: 10,
        size: 1.0,
        sizeAttenuation: true,
        position: { x: 0, y: 0.25, z: 0 },
        url: 'png/icon16.png',
        visible: false,
      },
      {
        class: 'EntityPrompt',
        position: { x: 0, y: 0.25, z: 0 },
        text: 'F',
        visible: false
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
                arguments: [1]
              },
              enter: {
                name: 'enablePrompt',
              },
              exit: {
                name: 'enablePrompt',
              },
            }
          ]
        }
      }
    ]
  }
}

export { EntityNPC }