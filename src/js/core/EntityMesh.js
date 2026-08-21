import { Entity } from './Entity.js';
import { MeshFactory } from './MeshFactory.js';

/*
  EntityMesh is a special entity that applies a material to a model.
*/

class EntityMesh extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Add mesh component if entity is an instance of EntityMesh
    const mesh = MeshFactory.create(options);
    this.setMesh(mesh, options);
    this.add(mesh);
    mesh.castShadow = options.castShadow;
    mesh.receiveShadow = options.receiveShadow;
    mesh.renderOrder = options.renderOrder;
    this.isReady = true;
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

  static template = {
    geometry: null,
    material: null,
    castShadow: true,
    receiveShadow: true,
    renderOrder: 0
  }
}

export { EntityMesh };