import { Entity } from './Entity.js';

/*
  EntityMaterial is a special entity that applies a material to a model.
*/

class EntityMaterial extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityMaterial'
    }, options);

    // Inherit Entity properties
    super(options);

    // Create standard material
    this.material;
    this.url;
  }

  init(options, core) {
    // Add material component if entity is an instance of EntityMaterial
    core.assets.load(options.url, material => {
      this.setMaterial(material, options);
      this.dispatchEvent({ type: 'loaded', material });
    });
  }

  setMaterial(material, options) {
    // Add 3D model to entity
    this.material = material;
    this.url = options.url;
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    return json;
  }
}

export { EntityMaterial };