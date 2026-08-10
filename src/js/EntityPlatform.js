import { Euler, Quaternion, Vector3 } from 'three';
import { EntityCube } from './core/EntityCube.js';
import { Tweens } from './core/Tweens.js';

/*
  EntityPlatform inherits the EntityCube but with a rolling
  kinematic physics body that rolls
*/

// Initialize module-scoped variables
const _euler = new Euler();
const _vector = new Vector3();
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

  init(options, core) {
    this.setupAnimations(options);

    // Resume cube entity initialization
    super.init(options, core);
  }

  update(loop) {
    // Update world physics first
    super.update(loop);

    // Update tweens (using engine loop delta)
    this.tweens.update(loop.delta);
  }

  setupAnimations(options) {
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

    const {
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
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

    const start = {
      position: position,
      rotation: rotation
    }
    const end = {
      position: { x: position.x + px, y: position.y + py, z: position.z + pz },
      rotation: { x: rotation.x + (rx * Math.PI * 2), y: rotation.y + (ry * Math.PI * 2), z: rotation.z + (rz * Math.PI * 2) }
    }

    const updatePhysics = obj => {
      const entityPhysics = this.get('EntityPhysics');
      if (entityPhysics) {
        entityPhysics.setPosition(obj.position);
        entityPhysics.setRotation(obj.rotation);
      }
    };

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
      easing: 'Quadratic.Out',
      onRepeat: obj => {
        obj.isReversed = !obj.isReversed;
        updatePhysics(obj.isReversed ? end : start);
      },
      onUpdate: obj => updatePhysics(obj)
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