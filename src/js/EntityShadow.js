import { CanvasTexture, Vector3, Raycaster, PlaneGeometry, MeshBasicMaterial, Mesh } from 'three';
import { Entity } from './core/Entity.js';

/*
  EntityShadow renders a fake shadow below the attached entity by raycasting
  downward to find the ground and positioning a transparent plane at the hit point.
*/

// Module-scoped reusables to avoid per-frame allocations
const _rayOrigin = new Vector3();
const _rayDir = new Vector3(0, -1, 0);
const _planeNormal = new Vector3(0, 0, 1); // PlaneGeometry default normal faces +Z
const _worldNormal = new Vector3();

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

    // Set in init()
    this.shadowMesh = null;
    this.core = null;
    this.url = null;
  }

  init(options, core) {
    this.core = core;
    this.url = options.url;

    // Create shadow plane mesh
    const geometry = new PlaneGeometry(1, 1);
    const material = new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.5 });
    const mesh = new Mesh(geometry, material);
    this.shadowMesh = mesh;
    this.shadowMesh.scale.copy(this.scale);
    core.scene.add(mesh);

    // Load shadow texture map
    if (options.url) {
      core.assets.load(options.url, texture => {
        material.map = texture;
      });
    }
    else {
      material.map = this.createShadowTexture();
    }

    // Clean up the scene-root mesh when this entity is removed from its parent
    this.addEventListener('removed', () => {
      core.scene.remove(this.shadowMesh);
      this.shadowMesh.geometry.dispose();
      this.shadowMesh.material.dispose();
      this.shadowMesh = null;
    });

    super.init(options, core);
  }

  render(loop) {
    // Update shadow position from raycast
    this.updateShadow();

    // Resume Entity render behaviour (dispatches events, recurses into children)
    super.render(loop);
  }

  updateShadow() {
    // Set ray origin and direction for downward raycast
    this.parent.getWorldPosition(_rayOrigin);

    // Cast ray straight down from the parent's world position
    this.raycaster.set(_rayOrigin, _rayDir);
    this.raycaster.far = this.distance;

    // Check for intersections with the scene
    const intersections = this.raycaster.intersectObject(this.core.scene, true);
    const hit = intersections.find(i => {
      if (i.object.type !== 'Mesh') return false;
      let obj = i.object;
      while (obj) { if (obj === this.shadowMesh || obj === this.parent) return false; obj = obj.parent; }
      return true;
    });

    // Place shadow at the hit point in world space
    if (hit) {
      // Align the plane to the surface normal so it lies flat on slopes
      _worldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
      this.shadowMesh.position.copy(hit.point).addScaledVector(_worldNormal, 0.01);
      this.shadowMesh.quaternion.setFromUnitVectors(_planeNormal, _worldNormal);
      this.shadowMesh.visible = true;
    }
    else {
      this.shadowMesh.visible = false;
    }
  }

  createShadowTexture(options = {}) {
    options = Object.assign({
      antiAlias: false,
      minFilter: 1006,
      magFilter: 1006,
      padding: 1,
      size: 32,
    }, options);

    // Create canvas
    const size = options.size;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    // Draw a simple black circle with padding
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = options.antiAlias;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, (size / 2) - options.padding, 0, Math.PI * 2);
    ctx.fill();

    const texture = new CanvasTexture(canvas);
    texture.minFilter = options.minFilter;
    texture.magFilter = options.magFilter;
    return texture;
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    return json;
  }
}

export { EntityShadow };
