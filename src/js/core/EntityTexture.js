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

  create(options, entityManager) {
    // Add texture component if entity is an instance of EntityTexture
    entityManager.assets.load(options.url, texture => {
      this.setTexture(texture, options);
      this.dispatchEvent({ type: 'loaded', texture });
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