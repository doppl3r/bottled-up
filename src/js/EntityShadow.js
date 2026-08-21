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
const _localPosition = new Vector3();
const _worldQuat = new Quaternion();

class EntityShadow extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Initialize raycaster
    this.distance = options.distance;
    this.raycaster = new Raycaster();

    // Store core reference and shadow texture URL
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
        this.isLoaded = true;
      });
    }
    else {
      material.map = this.createShadowTexture();
      this.isLoaded = true;
    }
  }

  render(loop) {
    // Update shadow position from raycast
    this.updateShadow();

    // Resume Entity render behaviour (dispatches events, recurses into children)
    super.render(loop);
  }

  updateShadow() {
    // Counteract inherited player rotation so this entity's local space is world-aligned
    this.parent.getWorldQuaternion(_worldQuat);
    this.quaternion.copy(_worldQuat).invert();
    this.updateWorldMatrix(true, false);

    // Set ray origin and cast straight down from the parent's world position
    this.parent.getWorldPosition(_rayOrigin);
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

    if (hit) {
      // World surface normal (equals local normal since rotation is neutralized above)
      _worldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();

      // Position shadow at hit point, nudged slightly off the surface
      _localPosition.copy(hit.point);
      this.worldToLocal(_localPosition);
      this.shadow.position.copy(_localPosition).addScaledVector(_worldNormal, 0.01);

      // Align shadow plane to surface normal
      this.shadow.quaternion.setFromUnitVectors(_planeNormal, _worldNormal);
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

  static template = {
    distance: 64,
    url: null
  }
}

export { EntityShadow };
