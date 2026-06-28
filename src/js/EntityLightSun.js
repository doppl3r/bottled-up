import { AmbientLight, DirectionalLight } from 'three';
import { Entity } from "./core/Entity";

class EntityLightSun extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityLightSun',
      color: '#ffffff',
      distance: 20,
      intensity: Math.PI,
      shadowQuality: 1024,
      shadowArea: 4,
      speed: 0.25,
      time: 0,
    }, options);

    // Inherit Entity properties
    super(options);

    // Create and add lights
    this.distance = options.distance;
    this.speed = options.speed; // 1 rotation = 24 seconds
    this.time = options.time; // 12 = noon
    this.directionalLight = new DirectionalLight(options.color, options.intensity * 0.5);
    this.directionalLight.castShadow = true;
    this.ambientLight = new AmbientLight(options.color, options.intensity * 0.5);
    this.add(this.ambientLight, this.directionalLight, this.directionalLight.target);

    // Update initial properties
    this.updateShadowQuality(options.shadowQuality);
    this.updateShadowArea(options.shadowArea);
  }

  render(loop) {
    // Update time
    this.updateTime(((loop.timestamp / 1000) * this.speed) + this.time);

    // Inherit Entity render function
    super.render(loop);
  }

  updateShadowQuality(quality) {
    // Shadow map size should be power of 2 for optimal GPU performance
    const size = Math.pow(2, Math.round(Math.log2(quality)));
    this.directionalLight.shadow.mapSize.width = size;
    this.directionalLight.shadow.mapSize.height = size;
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
  }

  updatePosition(position = { x: 0, y: 0, z: 0 }) {
    // Only update target position for directional light. Requires new time to update position
    this.directionalLight.target.position.copy(position);
  }

  updateTime(time = 12) {
    const hours = 24;
    const degrees = (360 * (time) / hours) % 360;
    const radians = degrees * Math.PI / 180;
    
    // Reset to default 45deg, rotate y-axis (time), and set target position
    this.directionalLight.position.set(0, 0, this.distance).applyAxisAngle({ x: -1, y: 0, z: 0 }, Math.PI / 4)
    this.directionalLight.position.applyAxisAngle({ x: 0, y: 1, z: 0 }, radians);
    this.directionalLight.position.add(this.directionalLight.target.position);
  }
}

export { EntityLightSun };