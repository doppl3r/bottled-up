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
        url: 'glb/egg.glb',
        scale: { x: 0.25, y: 0.25, z: 0.25 },
        position: { x: 0, y: -1 / 16, z: 0 },
      },
      {
        class: 'EntityMesh',
        scale: { x: 1, y: 1, z: 1 },
        position: { x: 0, y: 0, z: 1 / 32 },
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
                    type: 'capsule',
                    arguments: [1 / 16, 0.25]
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