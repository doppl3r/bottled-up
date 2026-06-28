import { DirectionalLight } from 'three';
import { Entity } from "./Entity";

class EntityLightDirectional extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityLightDirectional',
      color: '#ffffff',
      intensity: Math.PI
    }, options);

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
}

export { EntityLightDirectional };