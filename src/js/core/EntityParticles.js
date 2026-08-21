import { Entity } from './Entity.js';
import { Particles } from './Particles.js';

/*
  EntityParticles adds a buffered particle system to an entity.
*/

class EntityParticles extends Entity {
  constructor(options) {
    // Set default options
    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.urls = [];
    this.particles = new Particles(options);
    this.particles.layers.set(1);
    this.add(this.particles);
  }

  load(options, core) {
    // Add particles component if entity is an instance of EntityParticles
    if (options.urls) {
      core.assets.loadBatch(options.urls, textures => {
        this.setTextures(textures, options);
        super.load(options, core);
      });
    }
    else {
      super.load(options, core);
    }
  }

  render(loop) {
    // Perform base entity render
    super.render(loop);
  }

  setTextures(textures, options) {
    // Add textures to entity
    this.urls = options.urls;

    // Add particles as child of entity
    this.particles.createAtlas(textures);

    // Update texture properties
    this.particles.material.uniforms.atlasTexture.value.magFilter = 1003;
    this.particles.material.uniforms.atlasTexture.value.minFilter = 1003;
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.urls = this.urls;
    return json;
  }

  static template = {
    urls: []
  }
}

export { EntityParticles };