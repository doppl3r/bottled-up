import { Entity } from './core/Entity.js';

class EntityPrompt extends Entity {
  constructor(options) {
    // Inherit Entity properties
    super(options);
  }

  static template = {
    code: 'KeyE',
    type: 'keydown',
    children: [
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 1,
          colliders: [
            {
              isSensor: true,
              shapeDesc: {
                type: 'ball',
                arguments: [0.25]
              }
            }
          ]
        }
      }
    ]
  }
}

export { EntityPrompt }