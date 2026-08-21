import { EntityParticles } from './core/EntityParticles.js';

/*
  EntityRain extends EntityParticles to create a rain effect.
*/

class EntityRain extends EntityParticles {
  constructor(options) {
    // Inherit Entity properties
    super(options);

    // Add rain particles
    this.range = options.range;
    this.speed = options.speed;
    for (let i = 0; i < this.particles.capacity; i++) {
      this.particles.add({
        texture: Math.floor(Math.random() * options.urls?.length || 0),
        position: {
          x: Math.random() * this.range - this.range / 2,
          y: Math.random() * this.range - this.range / 2,
          z: Math.random() * this.range - this.range / 2
        }
      })
    }
  }

  load(options, core) {
    core.camera.layers.enable(1);
    super.load(options, core);
  }

  render(loop) {
    // Update rain particle positions
    this.particles.translateWrapAll(
      -0.25 * this.speed * loop.delta,
      -0.75 * this.speed * loop.delta,
      0.25 * this.speed * loop.delta,
      this.range
    );

    // Continue base entity render
    super.render(loop)
  }

  static template = {
    attenuation: 0.5,
    capacity: 100,
    range: 100,
    speed: 0.01,
    urls: [
      'png/icon16.png'
    ]
  }
}

export { EntityRain };