import { Entity } from './core/Entity.js';
import { Tweens } from './core/Tweens.js';

class EntityPlayer extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);

    // Animations
    this.tweens = new Tweens();
  }

  update(loop) {
    super.update(loop);
  }

  render(loop) {
    // Update tweens
    this.tweens.update(loop.delta);

    // Resume Entity render behavior
    super.render(loop);
  }

  static template = {
    children: [
      {
        class: 'EntityBallController'
      },
      {
        class: 'EntityModel',
        url: 'glb/potion.glb'
      },
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 0,
          softCcdPrediction: 1.0,
          sleeping: true,
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