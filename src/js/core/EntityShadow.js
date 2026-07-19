import { Vector3, Raycaster, PlaneGeometry, MeshBasicMaterial, Mesh, Quaternion } from 'three';
import { Entity } from './Entity.js';

/*
  EntityShadow renders a fake shadow below the attached entity by raycasting
  downward to find the ground and positioning a transparent plane at the hit point.
*/

// Module-scoped reusables to avoid per-frame allocations
const _rayOrigin = new Vector3();
const _rayDirection = new Vector3(0, -1, 0);
const _hitPointLocal = new Vector3();
const _parentQuat = new Quaternion();

class EntityShadow extends Entity {
  constructor(options = {}) {
    options = Object.assign({
      class: 'EntityShadow',
      distance: 64,
      url: null
    }, options);

    // Inherit Entity properties
    super(options);
    
    // Initialize raycaster
    this.distance = options.distance;
    this.raycaster = new Raycaster();
    
    // Reference to core (set in init)
    this.shadowMesh;
    this.core;
    this.url;
  }

  init(options, core) {
    // Create shadow plane mesh
    const geometry = new PlaneGeometry(1, 1);
    const material = new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.5 });
    const mesh = new Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Rotate to face up (XZ plane)
    
    // Set shadow mesh
    this.setShadow(mesh, options);
    this.add(mesh);

    // Load shadow texture map
    if (options.url) {
      core.assets.load(options.url, texture => {
        material.map = texture;
        material.needsUpdate = true;
      });
    }

    // Store core reference
    this.core = core;
    super.init(options, core);
  }

  render(loop) {
    // Update shadow position from raycast
    this.updateShadow();
    
    // Resume Entity render behavior
    super.render(loop);
  }

  setShadow(shadowMesh, options) {
    this.shadowMesh = shadowMesh;
    this.url = options.url;
  }

  updateShadow() {
    // Get parent position in world space
    _rayOrigin.setFromMatrixPosition(this.parent.matrixWorld);

    // Set up raycaster
    this.raycaster.set(_rayOrigin, _rayDirection);
    this.raycaster.far = this.distance;

    // Cast ray into scene
    const intersections = this.raycaster.intersectObject(this.core.scene, true);
    const filteredIntersections = intersections.filter(hit => {
      // Only include mesh objects (exclude helpers and other non-mesh types)
      if (hit.object.type !== 'Mesh') return false;
      while (hit.object) { if (hit.object === this.parent) return false; hit.object = hit.object.parent; }
      return true;
    });

    // Update shadow position and visibility
    if (filteredIntersections.length > 0) {
      const hitPoint = filteredIntersections[0].point;
      
      // Convert world-space hit point to local space relative to parent
      _hitPointLocal.copy(hitPoint);
      _hitPointLocal.y += 0.01; // Add offset in world space
      this.parent.worldToLocal(_hitPointLocal);
      this.position.copy(_hitPointLocal);
      
      // Invert parent's world rotation to keep shadow at zero world rotation
      this.parent.getWorldQuaternion(_parentQuat);
      this.quaternion.copy(_parentQuat).invert();
      
      // Show shadow
      this.visible = true;
    }
    else {
      // No hit: hide shadow
      this.visible = false;
    }
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    return json;
  }
}

export { EntityShadow };
