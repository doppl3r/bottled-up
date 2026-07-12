import { DirectionalLight, Vector3 } from 'three';
import { Entity } from "./Entity";

// Module-scoped reusable to avoid per-frame allocation
const _targetPos = new Vector3();

class EntityLightSun extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityLightSun',
      color: '#ffffff',
      intensity: Math.PI,
      distance: 20,
      time: 12,
      duration: 120,
      speed: 1,
      azimuth: 0,
      targetName: '',
      shadowQuality: 128,
      shadowArea: 32,
    }, options);

    // Inherit Entity properties
    super(options);

    // Store shadow parameters
    this.shadowQuality = options.shadowQuality;

    // Store orbit parameters
    this.distance = options.distance;
    this.time = options.time;
    this.duration = options.duration;
    this.speed = options.speed;
    this.azimuth = options.azimuth;
    this.targetName = options.targetName;

    // Create directional light and add with its target as children
    this.directionalLight = new DirectionalLight(options.color, options.intensity);
    this.directionalLight.castShadow = true;
    this.add(this.directionalLight, this.directionalLight.target);

    // Recalculate shadow area once
    this.updateShadowArea(options.shadowArea);
  }

  render(loop) {
    // Compute orbit angle: time=12 → angle=0 (above), time=0/24 → angle=±π (below)
    const elapsed = loop.timestamp / 1000;
    const angle = ((this.time - 12) / 24) * Math.PI * 2
      + (this.duration > 0 ? elapsed * this.speed * Math.PI * 2 / this.duration : 0);

    // Resolve target world position (falls back to world origin)
    const target = this.targetName ? this.parent?.getObjectByName(this.targetName) : null;
    if (target) {
      target.getWorldPosition(_targetPos);
    } else {
      _targetPos.set(0, 0, 0);
    }

    // Position light and its target relative to followed entity
    const d = this.distance;
    const az = this.azimuth;
    this.directionalLight.target.position.set(_targetPos.x, _targetPos.y, _targetPos.z);
    this.directionalLight.position.set(
      _targetPos.x + Math.sin(angle) * Math.sin(az) * d,
      _targetPos.y + Math.cos(angle) * d,
      _targetPos.z + Math.sin(angle) * Math.cos(az) * d,
    );

    // Inherit Entity render function
    super.render(loop);
  }

  updateShadowArea(area) {
    // Configure shadow camera frustum to cover the desired world-space area
    this.directionalLight.shadow.camera.left = -area / 2;
    this.directionalLight.shadow.camera.right = area / 2;
    this.directionalLight.shadow.camera.top = area / 2;
    this.directionalLight.shadow.camera.bottom = -area / 2;
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = this.distance * 2;
    this.directionalLight.shadow.camera.updateProjectionMatrix();

    // Map size = area × texels-per-unit, keeping shadow density constant
    const size = area * this.shadowQuality;
    this.directionalLight.shadow.mapSize.width = size;
    this.directionalLight.shadow.mapSize.height = size;

    // Dispose existing shadow map so Three.js recreates it at the new size
    if (this.directionalLight.shadow.map) {
      this.directionalLight.shadow.map.dispose();
      this.directionalLight.shadow.map = null;
    }
  }
}

export { EntityLightSun };