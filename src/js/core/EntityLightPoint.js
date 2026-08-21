import { PointLight } from 'three';
import { Entity } from './Entity.js';

class EntityLightPoint extends Entity {
  constructor(options) {
    // Set default options
    // Inherit Entity properties
    super(options);

    // Create and add light
    this.light = new PointLight(options.color, options.intensity, options.distance, options.decay);
    this.add(this.light);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.color = `#${ this.light.color.getHexString() }`;
    json.intensity = this.light.intensity;
    json.distance = this.light.distance;
    json.decay = this.light.decay;
    return json;
  }

  static template = {
    color: '#ffffff',
    intensity: Math.PI,
    distance: 0,
    decay: 1
  }
}

export { EntityLightPoint };