import { Entity } from './Entity.js';

class EntityTrimesh extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);
  }

  init(options, core) {
    super.init(options, core);
  }

  static template = {
    children: [
      {
        class: 'EntityModel'
      },
      {
        class: 'EntityPhysics',
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