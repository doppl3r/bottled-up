import { PointLight } from 'three';
import { Entity } from './Entity.js';

class EntityLightPoint extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Create and add light
    this.light = new PointLight(options.color, options.intensity, options.distance, options.decay);
    this.add(this.light);

    // Update entity state
    this.isReady = true;
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