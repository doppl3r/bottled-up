import { DirectionalLight } from 'three';
import { Entity } from './Entity.js';

class EntityLightDirectional extends Entity {
  constructor(options) {
    // Set default options
    // Inherit Entity properties
    super(options);

    // Create and add light
    this.light = new DirectionalLight(options.color, options.intensity);
    this.add(this.light);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.color = `#${ this.light.color.getHexString() }`;
    json.intensity = this.light.intensity;
    return json;
  }

  static template = {
    color: '#ffffff',
    intensity: Math.PI
  }
}

export { EntityLightDirectional };