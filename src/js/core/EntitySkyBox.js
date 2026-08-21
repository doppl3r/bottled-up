import { CanvasTexture, EquirectangularReflectionMapping, SRGBColorSpace } from 'three';
import { TextureFactory } from './TextureFactory.js';
import { Entity } from './Entity.js';

/*
  EntitySkyBox adds a CubeTexture system to scene.
*/

class EntitySkyBox extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Initialize with textures
    if (options.urls) {
      // Store options for serialization
      this.urls = options.urls;

      // Load all textures
      core.assets.loadBatch(options.urls, textures => {
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
        this.isLoaded = true;
      });
    }
    else {
      core.scene.background = TextureFactory.generateSkySphereTexture();
      this.isLoaded = true;
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
    urls: []
  }
}

export { EntitySkyBox };