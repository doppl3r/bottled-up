import { CameraHelper, OrthographicCamera, PerspectiveCamera } from 'three';
import { Entity } from './Entity.js';

/*
  EntityCamera adds a camera to the scene.
*/

class EntityCamera extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Initialize camera properties
    const { fov = 45, near = 1, far = 1000, type = 'perspective', zoom = 1, debug = false } = options;
    const aspect = window.innerWidth / window.innerHeight;

    // Assign camera to scene
    this.cameraPerspective = new PerspectiveCamera(fov, aspect, near, far);
    this.cameraOrthographic = new OrthographicCamera(-aspect * zoom, aspect * zoom, zoom, -zoom, near, far);
    this.camera = (type === 'perspective') ? this.cameraPerspective : this.cameraOrthographic;
    if (debug) this.cameraHelper = new CameraHelper(this.camera);

    // Store core reference
    this.core = core;

    // Add event listener
    this.addEventListener('added', this.onAdded);

    // Update entity state
    this.ready();
  }

  onAdded = event => {
    // Add optional camera helper to scene
    if (this.cameraHelper) this.core.scene.add(this.cameraHelper);

    // Assign new camera to core components
    if (event.target.parent === this.core.scene) {
      this.camera.position.copy(this.position);
      this.camera.rotation.copy(this.rotation);
      this.core.camera = this.camera;
      this.core.compositor.renderPass.camera = this.camera;
    }
    else {
      // Add camera to EntityCamera
      this.add(this.camera);
    }
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.type = this.camera.isPerspectiveCamera ? 'perspective' : 'orthographic';
    if (this.camera.fov) json.fov = this.camera.fov;
    if (this.camera.zoom) json.zoom = this.camera.zoom;
    if (this.camera.near) json.near = this.camera.near;
    if (this.camera.far) json.far = this.camera.far;
    return json;
  }

  static template = {
    color: '#ffffff',
    near: 1,
    far: 1000
  }
}

export { EntityCamera };