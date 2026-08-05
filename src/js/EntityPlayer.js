import { Entity } from './core/Entity.js';

class EntityPlayer extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);

    // Add default event listeners
    this.addEventListener('childadded', this.onChildAdded);
  }

  onChildAdded = event => {
    if (event.child.class === 'EntityPhysics') {
      event.child.addEventListener('onWake', this.onWake);
      event.child.addEventListener('onSleep', this.onSleep);
    }
  }

  onWake = event => {
    // Play Cube-to-ball animation
    const entityModel = this.get('EntityModel');
    const entityModelMixer = entityModel?.get('EntityMixer');
    entityModelMixer?.play('CubeToBall');
  }

  onSleep = event => {
    // Play Ball-to-cube animation
    const entityModel = this.get('EntityModel');
    const entityModelMixer = entityModel?.get('EntityMixer');
    entityModelMixer?.play('BallToCube');
  }

  static template = {
    children: [
      {
        class: 'EntityBallController'
      },
      {
        class: 'EntityModel',
        url: 'glb/ball.glb',
        scale: {
          x: 0.5,
          y: 0.5,
          z: 0.5
        },
        children: [
          {
            class: 'EntityMixer',
          },
          {
            class: 'EntityDecal',
            url: 'png/smile.png',
            position: { x: 0, y: 0, z: 0.25 },
            normal: { x: 0, y: 0, z: 1 },
            scale: { x: 0.9, y: 0.9, z: 0.9 }
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