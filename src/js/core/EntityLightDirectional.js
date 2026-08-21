import { DirectionalLight } from 'three';
import { Entity } from './Entity.js';

class EntityLightDirectional extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Create and add light
    this.light = new DirectionalLight(options.color, options.intensity);
    this.add(this.light);

    // Update entity state
    this.isReady = true;
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