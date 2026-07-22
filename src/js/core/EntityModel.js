import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import { Entity } from './Entity.js';

/*
  EntityModel is a specialized entity that manages 3D models
  for parent entities.
*/

class EntityModel extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityModel',
    }, options);

    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.model;
    this.url;
  }

  render(loop) {
    // Perform base entity render
    super.render(loop);
  }

  init(options, core) {
    core.assets.load(options.url, asset => {
      const model = clone(asset);
      this.url = options.url;
      this.model = model;
      this.add(model);
      this.dispatchEvent({ type: 'loaded', model });
      super.init(options, core);
    });
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    return json;
  }
}

export { EntityModel };