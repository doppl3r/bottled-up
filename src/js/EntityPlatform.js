import { Euler, Quaternion } from 'three';
import { EntityCube } from './core/EntityCube.js';

/*
  EntityPlatform inherits the EntityCube but with a rolling
  kinematic physics body that rolls
*/

// Initialize module-scoped variables
const _euler = new Euler(0, 0, 0);
const _quaternion = new Quaternion();

class EntityPlatform extends EntityCube {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);
  }

  init(options, core) {
    // Resume cube entity initialization
    super.init(options, core);
  }

  update(loop) {
    // Update world physics first
    super.update(loop);

    // Get physics component
    const entityPhysics = this.get('EntityPhysics');
    const rotation = entityPhysics.getRotation();

    // Update rotation based on local x axis roll
    _euler.setFromQuaternion(_quaternion.copy(rotation));
    _euler.x += loop.delta * 0.001; // Example: roll on local x axis
    _quaternion.setFromEuler(_euler);

    // Update rigid body rotation
    entityPhysics.setRotation(_quaternion);
  }

  static template = {
    color: '#ff00ff',
    url: '',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    children: [
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 2,
          colliders: [
            {
              shapeDesc: {
                type: 'cuboid',
                arguments: [0.5, 0.5, 0.5]
              }
            }
          ]
        }
      },
      {
        class: 'EntityModel'
      }
    ]
  }
}

export { EntityPlatform }