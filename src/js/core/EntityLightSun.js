import { DirectionalLight, Vector3, CameraHelper } from 'three';
import { Entity } from './Entity.js';

// Module-scoped reusable to avoid per-frame allocation
const _targetPos = new Vector3();

class EntityLightSun extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Store shadow parameters
    this.shadowQuality = options.shadowQuality;
    this.shadowArea = options.shadowArea;
    this.shadowRadius = options.shadowRadius;

    // Store orbit parameters
    this.time = options.time;
    this.duration = options.duration;
    this.speed = options.speed;
    this.azimuth = options.azimuth;
    this.targetName = options.targetName;

    // Create directional light and add with its target as children
    this.light = new DirectionalLight(options.color, options.intensity);
    this.light.castShadow = true;
    this.light.shadow.radius = this.shadowRadius;
    this.add(this.light, this.light.target);

    // Recalculate shadow area once
    this.updateShadowArea(options.shadowArea);

    // Create optional debug helper for shadow camera frustum
    this.lightHelper = new CameraHelper(this.light.shadow.camera);

    // Update entity state
    this.ready();
  }

  render(loop) {
    // Compute orbit angle: time=12 → angle=0 (above), time=0/24 → angle=±π (below)
    const elapsed = loop.timestamp / 1000;
    const timeAngle = ((this.time - 12) / 24) * Math.PI * 2;
    const orbitAngle = this.duration > 0 ? elapsed * this.speed * Math.PI * 2 / this.duration : 0;
    const angle = timeAngle + orbitAngle;

    // Resolve target world position (falls back to world origin)
    const target = this.targetName ? this.parent?.getObjectByName(this.targetName) : null;
    if (target) target.getWorldPosition(_targetPos);
    else _targetPos.set(0, 0, 0);

    // Position light and its target relative to followed entity
    const azimuth = this.azimuth;
    this.light.target.position.set(_targetPos.x, _targetPos.y, _targetPos.z);
    this.light.position.set(
      _targetPos.x + Math.sin(angle) * Math.sin(azimuth) * (this.shadowArea / 2),
      _targetPos.y + Math.cos(angle) * (this.shadowArea / 2),
      _targetPos.z + Math.sin(angle) * Math.cos(azimuth) * (this.shadowArea / 2),
    );

    // Inherit Entity render function
    super.render(loop);
  }

  updateShadowArea(area) {
    // Configure shadow camera frustum to cover the desired world-space area
    this.light.shadow.camera.left = -area / 2;
    this.light.shadow.camera.right = area / 2;
    this.light.shadow.camera.top = area / 2;
    this.light.shadow.camera.bottom = -area / 2;
    this.light.shadow.camera.near = 0.1;
    this.light.shadow.camera.far = this.shadowArea;
    this.light.shadow.camera.updateProjectionMatrix();

    // Map size = area × texels-per-unit, keeping shadow density constant
    const size = area * this.shadowQuality;
    this.light.shadow.mapSize.width = size;
    this.light.shadow.mapSize.height = size;

    // Dispose existing shadow map so Three.js recreates it at the new size
    if (this.light.shadow.map) {
      this.light.shadow.map.dispose();
      this.light.shadow.map = null;
    }
  }

  debug(state = true) {
    // Enable or disable shadow camera helper
    if (state === true) this.add(this.lightHelper);
    else this.remove(this.lightHelper);
  }

  static template = {
    color: '#ffffff',
    intensity: Math.PI,
    time: 12,
    duration: 120,
    speed: 0,
    azimuth: 0,
    targetName: 'ball',
    shadowArea: 64,
    shadowQuality: 32,
    shadowRadius: 1
  }
}

export { EntityLightSun };