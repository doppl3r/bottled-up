import { Fog } from 'three';
import { Entity } from './Entity.js';

/*
  EntityFog adds a fog effect to the scene with a custom gradient shader.
*/

class EntityFog extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.fog;
  }

  init(options = {}, core) {
    // Initialize fog
    const { color = '#ffffff', near = 1, far = 1000 } = options;
    this.fog = new Fog(color, near, far);

    // Assign fog to scene
    core.scene.fog = this.fog;

    // Get the sphere mesh child and apply the material
    super.init(options, core);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.color = this.color;
    return json;
  }
}

export { EntityFog };