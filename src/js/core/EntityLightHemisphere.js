import { HemisphereLight } from 'three';
import { Entity } from './Entity.js';

class EntityLightHemisphere extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Create and add light
    this.light = new HemisphereLight(options.skyColor, options.groundColor, options.intensity);
    this.add(this.light);

    // Update entity state
    this.ready();
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.skyColor = `#${ this.light.color.getHexString() }`;
    json.groundColor = `#${ this.light.groundColor.getHexString() }`;
    json.intensity = this.light.intensity;
    return json;
  }

  static template = {
    skyColor: '#ffffff',
    groundColor: '#aaaaaa',
    intensity: Math.PI
  }
}

export { EntityLightHemisphere };