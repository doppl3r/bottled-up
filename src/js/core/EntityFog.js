import { Fog } from 'three';
import { Entity } from './Entity.js';

/*
  EntityFog adds a fog effect to the scene with a custom gradient shader.
*/

class EntityFog extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Initialize fog
    const { color = '#ffffff', near = 1, far = 1000 } = options;
    this.fog = new Fog(color, near, far);
    this.isLoaded = true;

    // Assign fog to scene
    core.scene.fog = this.fog;
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.color = this.fog.color.getHex();
    json.near = this.fog.near;
    json.far = this.fog.far;
    return json;
  }

  static template = {
    color: '#ffffff',
    near: 1,
    far: 1000
  }
}

export { EntityFog };