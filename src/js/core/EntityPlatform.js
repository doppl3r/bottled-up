import { EntityCube } from './EntityCube.js';
import { Tweens } from './Tweens.js';

/*
  EntityPlatform inherits the EntityCube but with a rolling
  kinematic physics body that rolls
*/

// Initialize module-scoped variables

class EntityPlatform extends EntityCube {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Animations
    this.tweens = new Tweens();

    // Assign "prop" string to options
    this.propToOptions(options.prop, options);

    // Initialize animations container
    this.createAnimations(options);
  }

  propToOptions(url = '', options) {
    // Assign options from prop string
    const params = new URLSearchParams(url);

    // Loop through each parameter and assign to options
    for (const [key, value] of params.entries()) {
      options[key] = JSON.parse(value);
    }
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
              shape: {
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