import { CubeTexture, SRGBColorSpace } from 'three';
import { Entity } from './core/Entity.js';

/*
  EntitySkybox adds a CubeTexture system to scene.
*/

class EntitySkybox extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntitySkybox'
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
        this.textureCube = new CubeTexture(images);
        this.textureCube.colorSpace = SRGBColorSpace;
        this.textureCube.needsUpdate = true;
        core.scene.background = this.textureCube;
        
        // Dispatch loaded and resume base class
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

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.urls = this.urls;
    return json;
  }

  static template = {
    urls: [
      'png/forge-skybox-px.png',
      'png/forge-skybox-nx.png',
      'png/forge-skybox-py.png',
      'png/forge-skybox-ny.png',
      'png/forge-skybox-pz.png',
      'png/forge-skybox-nz.png'
    ]
  }
}

export { EntitySkybox };