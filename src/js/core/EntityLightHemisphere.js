import { HemisphereLight } from 'three';
import { Entity } from './Entity.js';

class EntityLightHemisphere extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityLightHemisphere',
      skyColor: '#ffffff',
      groundColor: '#eeeeee',
      intensity: Math.PI
    }, options);

    // Inherit Entity properties
    super(options);

    // Create and add light
    this.light = new HemisphereLight(options.skyColor, options.groundColor, options.intensity);
    this.add(this.light);
  }

  static template = {
    name: 'light-hemisphere',
    label: 'Light Hemisphere',
    skyColor: '#ffffff',
    groundColor: '#aaaaaa',
    intensity: Math.PI
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.skyColor = `#${ this.light.color.getHexString() }`;
    json.groundColor = `#${ this.light.groundColor.getHexString() }`;
    json.intensity = this.light.intensity;
    return json;
  }
}

export { EntityLightHemisphere };