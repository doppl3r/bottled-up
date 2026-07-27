import { BufferAttribute, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three';

/*
  The Physics Debugger provides 3D lines to the scene from the physics world buffer.
*/

class WorldDebugger extends LineSegments {
  constructor(world) {
    super();
    this.world = world;
    this.material = new LineBasicMaterial({ color: 0xffffff, vertexColors: true });
    this.geometry =  new BufferGeometry();
    // Initialize with empty but valid attributes to prevent raycast errors
    this.geometry.setAttribute('position', new Float32BufferAttribute([], 3));
    this.geometry.setAttribute('color', new Float32BufferAttribute([], 4));
    this.frustumCulled = false; // Force offscreen renders
  }

  update() {
    if (this.visible == true && this.parent != null) {
      this.buffers = this.world.debugRender();
      this.geometry.setAttribute('position', new BufferAttribute(this.buffers.vertices, 3));
      this.geometry.setAttribute('color', new BufferAttribute(this.buffers.colors, 4));
    }
  }

  enable() {
    this.visible = true;
  }

  isEnabled() {
    return this.visible == true;
  }

  disable() {
    this.visible = false;
  }

  toggle() {
    this.visible = !this.visible;
  }
}

export { WorldDebugger };