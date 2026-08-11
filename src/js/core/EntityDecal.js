import { Euler, FrontSide, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Entity } from './Entity.js';
import { MeshFactory } from './MeshFactory.js';

/*
  EntityDecal projects a texture onto the surface of a target entity's
  model/mesh using Three.js DecalGeometry.
*/

// Module-scoped reusables to avoid per-decal allocations
const _geometryCache = new WeakMap();
const _forward = new Vector3(0, 0, 1);
const _quaternion = new Quaternion();
const _euler = new Euler();
const _position = new Vector3();
const _relativeMatrix = new Matrix4();

class EntityDecal extends Entity {
  constructor(options = {}) {
    // Inherit Entity properties (position, rotation, scale, etc.)
    options = Object.assign({
      class: 'EntityDecal',
      url: null,
      normal: { x: 0, y: 0, z: 1 },
      size: { x: 1, y: 1, z: 1 },
    }, options);

    super(options);

    // Store only what cannot be derived from Entity properties
    this.url = options.url;
    this.normal = options.normal;
    this.size = new Vector3(options.size.x, options.size.y, options.size.z);
    this.target = null;

    // Add event listeners
    this.addEventListener('added', this.onAdded);
  }

  onAdded = event => {
    // Resolve projection target (explicit override or parent entity)
    const target = this.targetEntity || this.parent;
    this.target = target;

    // Add cleanup listener
    target.addEventListener('removed', this.onTargetRemoved);

    // Build immediately if target visual root already exists
    if (target.model || target.mesh) {
      this.build(this.core, target);
    }
    else {
      // Otherwise wait for the target to finish loading (ex: EntityModel GLTF)
      target.addEventListener('loaded', this.onTargetLoaded);
    }
  }

  onTargetLoaded = event => {
    this.target.removeEventListener('loaded', this.onTargetLoaded);
    this.build(this.core, this.target);
  }

  load(options, core) {
    // Store core reference for use once the target is ready
    this.core = core;
  }

  build(core, target) {
    // Resolve visual root shared by all decals on this target
    const root = target.model || target.mesh;
    if (!root) return;

    // Get or create cached merged local-space geometry for this root
    let geometry = _geometryCache.get(root);
    if (geometry === undefined) {
      geometry = this.mergeLocalGeometry(root);
      _geometryCache.set(root, geometry);
    }

    // Build throwaway identity-transform mesh as DecalGeometry input
    const tempMesh = new Mesh(geometry);

    // Resolve projector position, orientation, and size
    const orientation = this.resolveOrientation();

    // Create decal geometry
    const decalGeometry = new DecalGeometry(tempMesh, this.position, orientation, this.size);

    // Load texture and build decal mesh once ready
    core.assets.load(this.url, texture => {
      // Hard-coded material: white, fully opaque, non-metallic
      const material = new MeshStandardMaterial({
        map: texture,
        color: 0xffffff,
        opacity: 1,
        metalness: 0,
        roughness: 1,
        transparent: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        side: FrontSide,
      });

      // Add decal mesh to scene
      const decalMesh = new Mesh(decalGeometry, material);
      this.add(decalMesh);
      super.load({}, this.core);
    });
  }

  resolveOrientation() {
    // If entity rotation is set, use it directly
    if (this.rotation.x !== 0 || this.rotation.y !== 0 || this.rotation.z !== 0) {
      return this.rotation;
    }

    // Otherwise derive orientation from the normal vector
    const normal = _position.set(this.normal.x, this.normal.y, this.normal.z).normalize();
    _quaternion.setFromUnitVectors(_forward, normal);
    return _euler.setFromQuaternion(_quaternion);
  }

  mergeLocalGeometry(root) {
    const geometries = [];

    // Update world matrices before baking local-relative transforms
    root.updateMatrixWorld();
    const rootMatrixInverse = root.matrixWorld.clone().invert();

    root.traverse(child => {
      if (child.isMesh) {
        // Clone geometry to avoid mutating the original
        const geo = child.geometry.clone();

        // Bake transform relative to root (NOT full world matrix)
        _relativeMatrix.multiplyMatrices(rootMatrixInverse, child.matrixWorld);
        geo.applyMatrix4(_relativeMatrix);
        geometries.push(geo);
      }
    });

    // Resolve missing attributes across geometries (ex: differing UV sets)
    const normalizedGeometries = MeshFactory.normalizeAttributes(geometries);

    let geometry = mergeGeometries(normalizedGeometries, true);
    geometry = mergeVertices(geometry);
    return geometry;
  }

  onTargetRemoved = () => {
    // Remove event listeners
    this.target.removeEventListener('removed', this.onTargetRemoved);
    this.target.removeEventListener('loaded', this.onTargetLoaded);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    json.normal = { x: this.normal.x, y: this.normal.y, z: this.normal.z };
    json.size = { x: this.size.x, y: this.size.y, z: this.size.z };
    return json;
  }
}

export { EntityDecal };
