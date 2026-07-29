import { Entity } from './Entity.js';

class EntityTrimesh extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      url: ''
    }, options);

    // Inherit Entity properties
    super(options);
  }

  init(options, core) {
    // Propagate url to all child entities
    options.children.forEach(childOptions => {
      childOptions.url = options.url;
    });

    // Resume base entity initialization
    super.init(options, core);
  }

  static template = {
    url: '',
    children: [
      {
        class: 'EntityModel',
        url: ''
      },
      {
        class: 'EntityPhysics',
        url: '',
        rigidBody: {
          status: 1,
          colliders: [
            {
              shapeDesc: {
                type: 'trimesh'
              }
            }
          ]
        }
      }
    ]
  }
}

export { EntityTrimesh }