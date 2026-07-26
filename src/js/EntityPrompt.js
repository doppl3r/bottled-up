import { Entity } from './core/Entity.js';

class EntityPrompt extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      code: 'KeyE',
      type: 'keydown',
    }, options);

    // Inherit Entity properties
    super(options);
  }

  static template = {
    name: 'prompt',
    label: 'Prompt',
    class: 'EntityPrompt',
    keyCode: 'Space',
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