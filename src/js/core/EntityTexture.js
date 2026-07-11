import { Entity } from './Entity.js';

/*
  EntityTexture is a special entity that applies a texture to a material.
*/

class EntityTexture extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityTexture',
      url: null
    }, options);

    // Inherit Entity properties
    super(options);

    // Set default properties
    this.texture = null;
  }

  init(options, core) {
    // Add texture component if entity is an instance of EntityTexture
    core.assets.load(options.url, texture => {
      this.setTexture(texture, options);
      this.dispatchEvent({ type: 'loaded', texture });
      super.init(options, core);
    });
  }

  setTexture(texture, options = {}) {
    // Assign texture
    this.texture = texture;
    Object.assign(this.texture, options);

    // Override parent material map
    this.parent.material.map = texture;
  }
}

export { EntityTexture };