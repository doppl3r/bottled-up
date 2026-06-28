import { Vector3 } from 'three';
import { Entity } from './core/Entity.js';

/*
  EntityPlayer contains a kinematic character controller that
  adjusts the position and movement of the entity it is attached to.
*/

// Initialize module-scoped variables
const _v = new Vector3();

class EntityPlayer extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityPlayer',
    }, options);

    // Inherit Entity properties
    super(options);
  }
}

export { EntityPlayer };