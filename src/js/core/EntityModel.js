import { Entity } from "./Entity";

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

  setModel(model, options) {
    // Add 3D model to entity
    this.model = model;
    this.url = options.url;

    // Enable shadows
    this.model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
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