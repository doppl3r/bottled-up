import { CanvasTexture, EquirectangularReflectionMapping, SRGBColorSpace } from 'three';
import { TextureFactory } from './TextureFactory.js';
import { Entity } from './Entity.js';

/*
  EntitySkyBox adds a CubeTexture system to scene.
*/

class EntitySkyBox extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntitySkyBox'
    }, options);

    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.urls = [];
  }

  init(options, core) {
    // Initialize with textures
    if (options.urls) {
      core.assets.loadBatch(options.urls, textures => {
        // Store options for serialization
        this.urls = options.urls;

        // Ensure 6 items
        const length = textures.length;
        const lastTexture = textures[length - 1];
        textures.length = 6;
        textures.fill(lastTexture, length, textures.length);

        // Assign DOM images from textures to new CubeTexture
        const images = textures.map(texture => texture.image);
        const textureCube = TextureFactory.createTextureCube(images);
        core.scene.background = textureCube;
        
        // Dispatch loaded and resume base class
        this.dispatchEvent({ type: 'loaded', textures });
        super.init(options, core);
      });
    }
    else {
      core.scene.background = TextureFactory.generateSkySphereTexture();
      super.init(options, core);
    }
  }

  render(loop) {
    // Perform base entity render
    super.render(loop);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.urls = this.urls;
    return json;
  }

  static template = {
    
  }
}

export { EntitySkyBox };