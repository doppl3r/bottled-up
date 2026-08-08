import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import { Entity } from './Entity.js';

/*
  EntityModel is a specialized entity that manages 3D models
*/

class EntityModel extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      castShadow: true,
      class: 'EntityModel',
      generateMipmaps: true,
      magFilter: 1003,
      minFilter: 1003,
      receiveShadow: true,
    }, options);

    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.minFilter = options.minFilter;
    this.magFilter = options.magFilter;
    this.generateMipmaps = options.generateMipmaps;
    this.castShadow = options.castShadow;
    this.receiveShadow = options.receiveShadow;
    this.model;
    this.url;
  }

  render(loop) {
    // Perform base entity render
    super.render(loop);
  }

  init(options, core) {
    const url = options.url;
    if (url) {
      // Store url
      this.url = url;

      // Load asset
      core.assets.load(url, asset => {
        // Clone the loaded asset so we don't mutate or reparent the shared cached instance
        const model = clone(asset);

        // Reset model transform
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);

        // Apply shadow settings to all mesh children of the model
        model.traverse(child => {
          if (child.isMesh) {
            // Update texture settings
            if (child.material.map) {
              if (this.generateMipmaps) child.material.map.generateMipmaps = this.generateMipmaps;
              if (this.minFilter) child.material.map.minFilter = this.minFilter;
              if (this.magFilter) child.material.map.magFilter = this.magFilter;
            }

            // Update shadow settings
            child.castShadow = this.castShadow;
            child.receiveShadow = this.receiveShadow;
          }
        });

        this.model = model;
        this.add(model);
        this.dispatchEvent({ type: 'loaded', model });
        super.init(options, core);
      });
    }
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    if (this.url) json.url = this.url;
    return json;
  }

  static template = {
    url: ''
  }
}

export { EntityModel };