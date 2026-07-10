import { Euler, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Entity } from './Entity.js';
import { MeshFactory } from './MeshFactory.js';

/*
  EntityDecal projects a texture onto the surface of a target entity's
  model/mesh using Three.js DecalGeometry. It is generic enough to cover
  both statically authored decals (ex: a face on the ball, a poster on a
  wall, nested as a template child of an EntityModel/EntityMesh) and
  runtime-spawned decals (ex: bullet holes, bug splatters, spawned via
  entityManager.spawn() with the hit entity as parent).
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
    // Set default options
    options = Object.assign({
      class: 'EntityDecal',
      url: null,
      normal: { x: 0, y: 0, z: 1 },
      color: '#ffffff',
      opacity: 1,
      metalness: 0,
      roughness: 1,
      polygonOffsetFactor: -4,
    }, options);

    // Inherit Entity properties
    super(options);

    // Capture the projector transform and reset entity transform
    this.decalPosition = this.position.clone();
    this.decalSize = this.scale.clone();
    this.decalRotation = this.rotation.clone();
    this.decalNormal = options.normal;
    this.position.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.scale.set(1, 1, 1);

    // Declare entity components
    this.decalMesh = null;
    this.texture = null;
    this.url = options.url;
    this.decalOptions = options;

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

  init(options, core) {
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
    const options = this.decalOptions;
    const orientation = this.resolveOrientation();

    // Create decal geometry
    const decalGeometry = new DecalGeometry(tempMesh, this.decalPosition, orientation, this.decalSize);

    // Load texture and build decal mesh once ready
    core.assets.load(options.url, texture => {
      this.texture = texture;
      const material = new MeshStandardMaterial({
        map: texture,
        color: options.color,
        opacity: options.opacity,
        metalness: options.metalness,
        roughness: options.roughness,
        transparent: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: options.polygonOffsetFactor,
      });

      this.decalMesh = new Mesh(decalGeometry, material);
      this.add(this.decalMesh);
      this.dispatchEvent({ type: 'loaded' });
    });
  }

  resolveOrientation() {
    // Use explicit rotation if provided
    if (this.decalRotation) {
      return this.decalRotation;
    }

    // Otherwise derive orientation from a surface normal
    if (this.decalNormal) {
      const normal = _position.set(this.decalNormal.x, this.decalNormal.y, this.decalNormal.z).normalize();
      _quaternion.setFromUnitVectors(_forward, normal);
      return _euler.setFromQuaternion(_quaternion);
    }

    // Default: no rotation
    return _euler.set(0, 0, 0);
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

        // Bake transform relative to root (NOT full world matrix), so the
        // merged geometry moves/rotates with root via normal parenting
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
    // Dispose owned resources (NOT the shared geometry cache)
    this.decalMesh?.geometry.dispose();
    this.decalMesh?.material.dispose();
    this.texture?.dispose();

    // Remove event listeners
    this.target.removeEventListener('removed', this.onTargetRemoved);
    this.target.removeEventListener('loaded', this.onTargetLoaded);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    json.normal = { x: this.decalNormal.x, y: this.decalNormal.y, z: this.decalNormal.z };
    json.position = { x: this.decalPosition.x, y: this.decalPosition.y, z: this.decalPosition.z };
    json.scale = { x: this.decalSize.x, y: this.decalSize.y, z: this.decalSize.z };
    return json;
  }
}

export { EntityDecal };
