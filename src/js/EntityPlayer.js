import { Entity } from './core/Entity.js';
import { Tweens } from './core/Tweens.js';

class EntityPlayer extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Animations
    this.core = core;
    this.tweens = new Tweens();

    // Update loading state
    this.ready();
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

  switchTemplate(shape) {
    // Switch template based on shape
    if (shape in EntityPlayer.templates) {
      const template = EntityPlayer.templates[shape];
      if (template) {
        this.clear();
        template.children.forEach(child => {
          this.core.entityManager.spawn(child, this);
        });
      } 
    }
  }

  static applyTemplate(options) {
    // Update template based on shape
    this.template = this.templates[options.shape];

    // Apply template to entity
    super.applyTemplate(options);
  }

  static templates = {
    ball: {
      children: [
        {
          class: 'EntityBallController'
        },
        {
          class: 'EntityModel',
          url: 'glb/potion-ball.glb'
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
              clone: true,
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
    },
    cube: {
      children: [
        {
          class: 'EntityBallController'
        },
        {
          class: 'EntityModel',
          url: 'glb/potion-cube.glb'
        },
        {
          class: 'EntityMesh',
          scale: { x: 0.4, y: 0.4, z: 0.4 },
          position: { x: 0, y: 0, z: 0.25 },
          castShadow: false,
          receiveShadow: true,
          renderOrder: 1,
          geometry: {
            type: 'PlaneGeometry',
            arguments: [1, 1]
          },
          material: {
            type: 'MeshStandardMaterial',
            arguments: [{ color: '#ffffff', transparent: true }],
          },
          children: [
            {
              class: 'EntityTexture',
              clone: true,
              url: 'png/smile.png',
              minFilter: 1003,
              magFilter: 1003,
              repeat: { x: 1, y: 1 },
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
                      type: 'roundCuboid',
                      arguments: [(1 / 4) - (1 / 8), (1 / 4) - (1 / 8), (1 / 4) - (1 / 8), (1 / 8)],
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
    },
    capsule: {
      children: [
        {
          class: 'EntityBallController'
        },
        {
          class: 'EntityModel',
          url: 'glb/potion-capsule.glb'
        },
        {
          class: 'EntityMesh',
          scale: { x: 1, y: 1, z: 1 },
          castShadow: false,
          receiveShadow: true,
          renderOrder: 1,
          geometry: {
            type: 'CylinderGeometry',
            arguments: [0.125, 0.125, 0.25, 12, 1, true, -Math.PI / 2, Math.PI]
          },
          material: {
            type: 'MeshStandardMaterial',
            arguments: [{ color: '#ffffff', transparent: true }],
          },
          children: [
            {
              class: 'EntityTexture',
              clone: true,
              url: 'png/smile.png',
              minFilter: 1003,
              magFilter: 1003,
              repeat: { x: 1.5, y: 1 },
              offset: { x: -0.25, y: 0 }
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
                      arguments: [(1 / 4) - (1 / 8), (1 / 8)],
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
    },
    cone: {
      children: [
        {
          class: 'EntityBallController'
        },
        {
          class: 'EntityModel',
          url: 'glb/potion-cone.glb'
        },
        {
          class: 'EntityMesh',
          scale: { x: 1, y: 1, z: 1 },
          castShadow: false,
          receiveShadow: true,
          renderOrder: 1,
          geometry: {
            type: 'CylinderGeometry',
            arguments: [(1 / 16) + (1 / 16), (1 / 8) + (1 / 16), 0.25, 12, 1, true, -Math.PI / 2, Math.PI]
          },
          material: {
            type: 'MeshStandardMaterial',
            arguments: [{ color: '#ffffff', transparent: true }],
          },
          children: [
            {
              class: 'EntityTexture',
              clone: true,
              url: 'png/smile.png',
              minFilter: 1003,
              magFilter: 1003,
              repeat: { x: 1.5, y: 1 },
              offset: { x: -0.25, y: 0 }
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
                      type: 'roundCone',
                      arguments: [(1 / 4) - (1 / 16), (1 / 8), (1 / 16)],
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

  static template = this.templates.ball;
}

export { EntityPlayer }