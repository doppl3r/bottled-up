import { Entity } from './Entity.js';

class EntityTrimesh extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Propagate properties to all child entities
    options.children.forEach(childOptions => {
      // Set child entity url to match parent entity url
      childOptions.url = options.url;

      // Set initial transform for child entities
      if (childOptions.class === 'EntityPhysics') {
        childOptions.rigidBody.position = this.position;
        childOptions.rigidBody.rotation = this.rotation;
      }
    });

    // Resume base entity load process
    this.isReady = true;
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