import { PMREMGenerator, Vector3 } from 'three';
import { Entity } from './Entity.js';

/*
  EntityEnvironment loads or generates environments for entities or scenes.
*/

// Initialize module-scoped variables
const _worldPosition = new Vector3();

class EntityEnvironment extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Store options
    this.options = options;

    this.scene = core.scene;
    this.pmremGenerator = new PMREMGenerator(core.renderer);

    // Load HDR texture
    if (this.url) {
      this.url = options.url;
      core.assets.load(this.url, texture => {
        this.texture = texture;
        this.ready();
      });
    }
    else {
      this.ready();
    }

    // Add event listeners
    this.addEventListener('added', this.onAdded);
  }

  updateEnvironment = () => {
    // Update the environment map for the parent entity or scene
    if (this.parent.isScene) {
      this.scene.updateMatrixWorld(true);
      this.scene.background = this.generateTexture();
      this.scene.environment = this.scene.background;
    }
    else {
      // Hide parent entity before generating texture
      this.parent.visible = false;
      this.texture = this.generateTexture();
      this.parent.visible = true;

      // Update the material of the parent
      this.parent.traverse(child => {
        if (child.isMesh) {
          child.material.envMap = this.texture;
          child.material.needsUpdate = true;
  
          // Assign material options
          if (this.options.material) {
            Object.entries(this.options.material)?.forEach(([key, value]) => {
              if (value) child.material[key] = value;
            });
          }
        }
      });
    }
  }

  generateTexture = (options = {}) => {
    // Update position from world position
    this.getWorldPosition(_worldPosition);

    // Extract options with defaults for generating the environment texture
    const { scene = this.scene, sigma = 0, near = 0.1, far = 100, size = 256, position = _worldPosition } = options;

    // Generate the environment texture using the PMREM generator
    const pmrem = this.pmremGenerator.fromScene(scene, sigma, near, far, { size, position });
    const texture = pmrem.texture;
    return texture;
  }

  onAdded = event => {
    if (this.parent.isScene) {
      // Update scene background when ready
      this.scene.addEventListener('ready', this.updateEnvironment);
    }
    else {
      // Update parent entity environment when ready
      this.parent.addEventListener('ready', this.updateEnvironment);
    }
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    return json;
  }

  static template = {
    material: {
      envMap: null,
      metalness: 1.0
    }
  }
}

export { EntityEnvironment };
