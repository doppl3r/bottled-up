import { Entity } from './core/Entity.js';
import { Tweens } from './core/Tweens.js';

class EntityPlayer extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Animations
    this.tweens = new Tweens();

    // Update loading state
    this.isReady = true;
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
        class: 'EntityMesh',
        scale: { x: 1, y: 1, z: 1 },
        castShadow: false,
        receiveShadow: true,
        renderOrder: 1,
        geometry: {
          type: 'SphereGeometry',
          arguments: [0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI]
        },
        material: {
          type: 'MeshStandardMaterial',
          arguments: [{ color: '#ffffff', transparent: true }],
        },
        children: [
          {
            class: 'EntityTexture',
            url: 'png/smile.png',
            minFilter: 1003,
            magFilter: 1003,
            repeat: { x: 4, y: 2 },
            offset: { x: -0.5, y: -0.5 }
          }
        ]
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
                shapes: [
                  {
                    type: 'ball',
                    arguments: [0.25]
                  },
                  {
                    type: 'ball',
                    arguments: [0.125],
                    translation: { x: 0, y: 0.25, z: 0 }
                  }
                ]
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