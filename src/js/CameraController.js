import { EventDispatcher, Vector2, Vector3, Vector4, Quaternion, Matrix4, Spherical, Box3, Sphere, Raycaster } from 'three';
import CameraControls from 'camera-controls';

/*
  The CameraController class wraps yomotsu/camera-controls for the camera,
  providing Google Maps-style touch gestures (pinch zoom + rotate).
*/

// Initialize module-scoped variables
CameraControls.install({ THREE: { Vector2, Vector3, Vector4, Quaternion, Matrix4, Spherical, Box3, Sphere, Raycaster }});
const _eventChange = { type: 'change' };
const _v = new Vector3();

class CameraController extends EventDispatcher {
  constructor(camera, canvas) {
    super();

    // Initialize camera-controls
    this.controls = new CameraControls(camera, canvas);

    // Configure controls
    this.controls.dollySpeed = 1.0;
    this.controls.truckSpeed = 2.0;
    this.controls.azimuthRotateSpeed = 0.5;
    this.controls.polarRotateSpeed = 0.5;
    this.controls.dollyToCursor = true;

    // Lock polar angle (camera tilt) to 45 degrees
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = (0.4 * Math.PI);

    // Set zoom distance limits
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 64;

    // Configure damping
    this.controls.smoothTime = 0.05;
    this.controls.draggingSmoothTime = 0.05;

    // Left = pan, Right = rotate (matching original CameraControls behavior)
    this.controls.mouseButtons = {
      left: CameraControls.ACTION.TRUCK,
      middle: CameraControls.ACTION.ROTATE,
      right: CameraControls.ACTION.ROTATE,
      wheel: CameraControls.ACTION.DOLLY
    };

    // One finger = pan, Two fingers = pinch zoom + rotate
    this.controls.touches = {
      one: CameraControls.ACTION.TRUCK,
      two: CameraControls.ACTION.TOUCH_DOLLY_ROTATE,
      three: CameraControls.ACTION.TOUCH_TRUCK
    };

    // Store initial state
    this.camera = camera;
    this.canvas = canvas;

    // Auto rotate settings
    this.autoRotate = false;
    this.autoRotateSpeed = 0.5; // radians per second

    // Boundary will be set when saveState() or restore() is called
    this.controls.boundaryEnclosesCamera = false;

    // Store default speeds for enable/disable
    this.dollySpeed0 = this.controls.dollySpeed;
    this.truckSpeed0 = this.controls.truckSpeed;
    this.azimuthRotateSpeed0 = this.controls.azimuthRotateSpeed;
    this.polarRotateSpeed0 = this.controls.polarRotateSpeed;

    // Add event listener for change events
    this.changeTimeoutId = null;
    this.controls.addEventListener('control', this.onChange);
  }

  onChange = () => {
    // Debounce change event
    this.dispatchChange();
  };

  enable() {
    this.controls.dollySpeed = this.dollySpeed0;
    this.controls.truckSpeed = this.truckSpeed0;
    this.controls.azimuthRotateSpeed = this.azimuthRotateSpeed0;
    this.controls.polarRotateSpeed = this.polarRotateSpeed0;
  }

  disable() {
    this.controls.dollySpeed = 0;
    this.controls.truckSpeed = 0;
    this.controls.azimuthRotateSpeed = 0;
    this.controls.polarRotateSpeed = 0;
  }

  update(loop) {
    // camera-controls uses delta time in seconds
    const delta = loop.delta / 1000;

    // Add auto rotate functionality
    if (this.autoRotate) {
      this.controls.rotate(this.autoRotateSpeed * delta, 0, true);
    }

    // Update camera-controls
    this.controls.update(delta);
  }

  saveState() {
    // Sync camera-controls with actual camera position before saving
    const pos = this.camera.position;
    const targetY = 0;
    
    // Set controls target direction
    this.controls.setLookAt(pos.x, pos.y, pos.z, 0, targetY, 0, false);
    
    // Update boundary to lock target Y
    this.updateBoundary(targetY);
    this.controls.saveState();
  }

  reset() {
    // Animate back to saved state
    this.controls.reset(true);
    this.dispatchChange();
  }

  pan(translation = { x: 0, y: 0, z: 0 }) {
    // Transform translation from camera space to world space
    const worldTranslation = _v.set(translation.x, translation.y, translation.z);
    const originalLength = worldTranslation.length();
    worldTranslation.applyQuaternion(this.camera.quaternion);

    // Flatten and normalize translation (keep on ground plane)
    worldTranslation.y = 0;
    worldTranslation.normalize().multiplyScalar(originalLength);

    // Get current target and calculate new target position
    const currentTarget = this.controls.getTarget(new Vector3());
    const newTarget = currentTarget.add(worldTranslation);

    // Move to new target position (animated)
    this.controls.moveTo(newTarget.x, newTarget.y, newTarget.z, true);
    this.dispatchChange();
  }

  panTo(target) {
    // Move target to new position (camera follows automatically)
    this.controls.moveTo(target.x, target.y, target.z, true);
    this.dispatchChange();
  }

  rotate(rotation = { x: 0, y: 0, z: 0 }, axis = { x: 0, y: 1, z: 0 }, snap = Math.PI / 4) {
    // Calculate snapped angle
    const currentAzimuth = this.controls.azimuthAngle;
    const requestedAzimuth = currentAzimuth + rotation.y * axis.y;
    const snappedAzimuth = Math.round(requestedAzimuth / snap) * snap;

    // Rotate to snapped angle (animated)
    this.controls.rotateTo(snappedAzimuth, this.controls.polarAngle, true);
    this.dispatchChange();
  }

  zoom(depth = 1) {
    // Dolly in/out (positive depth = zoom out, negative = zoom in)
    this.controls.dolly(-depth, true);
    this.dispatchChange();
  }

  dispatchChange() {
    // Dispatch change event (debounced)
    clearTimeout(this.changeTimeoutId);
    this.changeTimeoutId = setTimeout(() => {
      this.dispatchEvent(_eventChange);
    }, 100);
  }

  restore(data) {
    // Restore camera state from serialized data
    if (!data || !data.target || !data.position) return;

    // Immediately set camera and target positions (no animation)
    this.controls.setLookAt(
      data.position.x,
      data.position.y,
      data.position.z,
      data.target.x,
      data.target.y,
      data.target.z,
      false
    );

    // Update boundary to match restored target Y
    this.updateBoundary(data.target.y);
  }

  updateBoundary(targetY) {
    // Set boundary to lock target Y position (ground plane movement only)
    const boundary = new Box3(
      new Vector3(-Infinity, targetY, -Infinity),
      new Vector3(Infinity, targetY, Infinity)
    );
    this.controls.setBoundary(boundary);
    this.controls.boundaryEnclosesCamera = false;
  }

  serialize() {
    // Return serialized state of camera controls
    const target = this.controls.getTarget(new Vector3());
    const position = this.controls.getPosition(new Vector3());

    return {
      target: {
        x: target.x,
        y: target.y,
        z: target.z
      },
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      }
    };
  }

  // Additional helper methods

  getTarget() {
    return this.controls.getTarget(new Vector3());
  }

  getPosition() {
    return this.controls.getPosition(new Vector3());
  }

  setTarget(x, y, z, enableTransition = true) {
    this.controls.setTarget(x, y, z, enableTransition);
  }

  setPosition(x, y, z, enableTransition = true) {
    this.controls.setPosition(x, y, z, enableTransition);
  }

  dispose() {
    this.controls.removeEventListener('control', this.onChange);
    this.controls.dispose();
  }
}

export { CameraController };
