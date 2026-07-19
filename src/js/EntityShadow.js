import { CanvasTexture, Vector3, Quaternion, Raycaster, PlaneGeometry, MeshBasicMaterial, Mesh } from 'three';
import { Entity } from './core/Entity.js';

/*
  EntityShadow renders a fake shadow below the attached entity by raycasting
  downward to find the ground and positioning a transparent plane at the hit point.
*/

// Module-scoped reusables to avoid per-frame allocations
const _rayOrigin = new Vector3();
const _rayDirection = new Vector3(0, -1, 0);
const _planeNormal = new Vector3(0, 0, 1);
const _worldNormal = new Vector3();
const _localNormal = new Vector3();
const _localPosition = new Vector3();
const _worldQuaternion = new Quaternion();

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
    this.shadow = null;
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
    this.shadow = mesh;
    this.add(mesh);

    // Load shadow texture map
    if (options.url) {
      core.assets.load(options.url, texture => {
        material.map = texture;
      });
    }
    else {
      material.map = this.createShadowTexture();
    }

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
    this.raycaster.set(_rayOrigin, _rayDirection);
    this.raycaster.far = this.distance;

    // Check for intersections with the scene
    const intersections = this.raycaster.intersectObject(this.core.scene, true);
    const hit = intersections.find(i => {
      if (i.object.type !== 'Mesh') return false;
      let obj = i.object;
      while (obj) { if (obj === this.parent) return false; obj = obj.parent; }
      return true;
    });

    // Place shadow at the hit point in local space
    if (hit) {
      // Convert world position to local space (relative to this entity)
      _localPosition.copy(hit.point);
      this.worldToLocal(_localPosition);
      
      // Transform surface normal to local space
      _worldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
      _localNormal.copy(_worldNormal);
      this.getWorldQuaternion(_worldQuaternion);
      _worldQuaternion.invert();
      _localNormal.applyQuaternion(_worldQuaternion);
      
      // Position shadow at hit point and align to surface normal (in local space)
      this.shadow.position.copy(_localPosition).addScaledVector(_localNormal, 0.01);
      this.shadow.quaternion.setFromUnitVectors(_planeNormal, _localNormal);
      this.shadow.visible = true;
    }
    else {
      this.shadow.visible = false;
    }
  }

  createShadowTexture(options = {}) {
    options = Object.assign({
      antiAlias: false,
      minFilter: 1003,
      magFilter: 1003,
      padding: 1,
      size: 16,
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
