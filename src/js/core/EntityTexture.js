import { Entity } from './Entity.js';

/*
  EntityTexture is a special entity that applies a texture to a material.
*/

class EntityTexture extends Entity {
  constructor(options) {
    // Set default options
    // Inherit Entity properties
    super(options);

    // Store options
    this.options = options;

    // Set default properties
    this.texture = null;

    // Add event listeners
    this.addEventListener('added', this.updateParentTexture);
    this.addEventListener('isLoaded', this.updateParentTexture);
  }

  load(options, core) {
    // Add texture component if entity is an instance of EntityTexture
    core.assets.load(options.url, texture => {
      this.texture = texture;
      this.isLoaded = true;
    });
  }

  updateParentTexture = event => {
    if (!this.parent || !this.texture) return;

    // Assign texture to parent materials
    this.parent.traverse(child => {
      if (child.isMesh) {
        child.material.map = this.texture;

        if (this.options) {
          Object.entries(this.options).forEach(([key, value]) => {
            if (key in child.material.map) {
              // Assign options to texture
              if (typeof value === 'object') Object.assign(child.material.map[key], value);
              else child.material.map[key] = value;
            }
          });
        }
      }
    });
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.options.url;
    return json;
  }

  static template = {
    url: null
  }
}

export { EntityTexture };