import { AmbientLight } from 'three';
import { Entity } from './Entity.js';

class EntityLightAmbient extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Create and add light
    this.light = new AmbientLight(options.color, options.intensity);
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

export { EntityLightAmbient };