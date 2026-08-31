import { EntityParticles } from './core/EntityParticles.js';

/*
  EntityRain extends EntityParticles to create a rain effect.
*/

class EntityRain extends EntityParticles {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Add rain particles
    this.range = options.range;
    this.speed = options.speed;
    for (let i = 0; i < this.capacity; i++) {
      this.addPoint({
        size: options.size !== undefined ? options.size : 1.0,
        color: '#8A9FBF',
        position: {
          x: Math.random() * this.range - this.range / 2,
          y: Math.random() * this.range - this.range / 2,
          z: Math.random() * this.range - this.range / 2
        }
      });
    }

    // Enable rain layer for camera
    core.camera.layers.enable(1);

    // Update entity state
    this.ready();
  }

  render(loop) {
    // Update rain particle positions
    for (let i = 0; i < this.count; i++) {
      // Update position (wrapped)
      const position = this.points.geometry.getAttribute('position');
      this.positionPoint(i, [
        (((position.getX(i) + -0.25 * this.speed * loop.delta + (this.range / 2)) % this.range + this.range) % this.range) - (this.range / 2),
        (((position.getY(i) + -0.75 * this.speed * loop.delta + (this.range / 2)) % this.range + this.range) % this.range) - (this.range / 2),
        (((position.getZ(i) + 0.25 * this.speed * loop.delta + (this.range / 2)) % this.range + this.range) % this.range) - (this.range / 2)
      ]);
    }

    // Continue base entity render
    super.render(loop)
  }

  static template = {
    capacity: 1000,
    range: 100,
    speed: 0.1,
    size: 0.5,
    sizeAttenuation: true
  }
}

export { EntityRain };