import { Euler, Quaternion } from 'three';
import { EntityCube } from './core/EntityCube.js';
import { Tweens } from './core/Tweens.js';

/*
  EntityPlatform inherits the EntityCube but with a rolling
  kinematic physics body that rolls
*/

// Initialize module-scoped variables
const _euler = new Euler();
const _quaternion = new Quaternion();

class EntityPlatform extends EntityCube {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);

    // Animations
    this.tweens = new Tweens();
  }

  load(options, core) {
    // Assign options from prop string
    if (options.prop) {
      const props = options.prop.split(',');
      props.forEach(prop => {
        const [key, value] = prop.split('=');
        if (key && value !== undefined) {
          const k = key.trim();
          const v = JSON.parse(value.trim());
          options[k] = v;
        }
      });
    }

    // Resume cube entity loading
    super.load(options, core);

    // Initialize animations container
    this.createAnimations(options);
  }

  update(loop) {
    // Update world physics first
    super.update(loop);

    // Update tweens (using engine loop delta)
    this.tweens.update(loop.delta);
  }

  createAnimations(options) {
    const {
      px = 0,        // Position x-axis
      py = 0,        // Position y-axis
      pz = 0,        // Position z-axis
      rx = 0,        // Rotation x-axis
      ry = 0,        // Rotation y-axis
      rz = 0,        // Rotation z-axis
      dur = 5,       // Duration
      del = 0,       // Delay
      alt = 1,       // Alternate (yoyo)
      rep = Infinity // Repeat
    } = options;

    const position = {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z
    };
    const rotation = {
      x: this.rotation.x,
      y: this.rotation.y,
      z: this.rotation.z
    };
    const start = {
      position: position,
      rotation: rotation
    }
    const end = {
      position: { x: position.x + px, y: position.y + py, z: position.z + pz },
      rotation: { x: rotation.x + (rx * Math.PI * 2), y: rotation.y + (ry * Math.PI * 2), z: rotation.z + (rz * Math.PI * 2) }
    }

    this.tweens.tween({
      duration: dur * 1000,
      delay: del * 1000,
      repeat: rep,
      yoyo: alt,
      object: {
        position: { ...start.position },
        rotation: { ...start.rotation }
      },
      to: {
        position: { ...end.position },
        rotation: { ...end.rotation }
      },
      easing: 'Quadratic.InOut',
      onUpdate: obj => {
        const entityPhysics = this.get('EntityPhysics');
        if (entityPhysics) {
          entityPhysics.setNextKinematicPosition(obj.position);
          entityPhysics.setNextKinematicRotation(obj.rotation);
        }
      }
    });
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