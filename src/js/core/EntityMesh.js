import { Entity } from './Entity.js';
import { MeshFactory } from './MeshFactory.js';

/*
  EntityMesh is a special entity that applies a material to a model.
*/

class EntityMesh extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityMesh',
      geometry: null,
      material: null
    }, options);

    // Inherit Entity properties
    super(options);

    // Create mesh reference prior to creation
    this.mesh = null;
    this.meshOptions = options;
  }

  init(options) {
    // Add mesh component if entity is an instance of EntityMesh
    const mesh = MeshFactory.create(options);
    this.setMesh(mesh, options);
    this.add(mesh);
    this.dispatchEvent({ type: 'loaded', mesh });
  }

  setMesh(mesh, options) {
    this.mesh = mesh;
    this.meshOptions = options;
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.geometry = this.meshOptions.geometry;
    json.material = this.meshOptions.material;
    return json;
  }
}

export { EntityMesh };