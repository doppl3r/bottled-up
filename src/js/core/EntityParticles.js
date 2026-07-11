import { Entity } from "./Entity";
import { Particles } from './Particles.js';

/*
  EntityParticles adds a buffered particle system to an entity.
*/

class EntityParticles extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityParticles'
    }, options);

    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.urls = [];
    this.particles = new Particles(options);
    this.particles.layers.set(1);
    this.add(this.particles);
  }

  init(options, core) {
    // Add particles component if entity is an instance of EntityParticles
    if (options.urls) {
      core.assets.loadBatch(options.urls, textures => {
        this.setTextures(textures, options);
        this.dispatchEvent({ type: 'loaded', textures });
        super.init(options, core);
      });
    }
    else {
      super.init(options, core);
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
}

export { EntityParticles };