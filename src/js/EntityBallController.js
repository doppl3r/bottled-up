import { Vector3, Raycaster } from 'three';
import { Entity } from './core/Entity.js';
import { Tweens } from './core/Tweens.js';

/*
  EntityBallController controls the movement of a physical ball
  that can be controlled by a keyboard input.
*/

// Module-scoped reusables to avoid per-frame allocations
const _forward = new Vector3();
const _right = new Vector3();
const _forceDir = new Vector3();
const _force = new Vector3();
const _perp = new Vector3();
const _orbitCenter = new Vector3();
const _desiredCamPos = new Vector3();
const _rayDirection = new Vector3();

class EntityBallController extends Entity {
  constructor(options = {}) {
    options = Object.assign({
      class: 'EntityBallController',
      moveForce: 10,
      moveMaxSpeed: 8,
      steerFactor: 1.0,
      dashImpulse: 10,
      dashTimerDuration: 3000,
      jumpBufferDuration: 100,
      jumpImpulse: 8,
      camPitchDefault: 0.5,
      camPitchMin: 0.08,
      camPitchMax: 1.48,
      camLerp: 0.9,
      camCollisionMinDistance: 2.0,
      camCollisionMaxDistance: 8,
      camCollisionLerp: 0.95,
      camAzimuthSensitivity: 0.0025,
      camPitchSensitivity: 0.003,
    }, options);

    // Inherit Entity properties
    super(options);

    // Assign default values from options
    this.moveForce = options.moveForce;
    this.moveMaxSpeed = options.moveMaxSpeed;
    this.steerFactor = options.steerFactor;
    this.dashImpulse = options.dashImpulse;
    this.dashTimerDuration = options.dashTimerDuration;
    this.jumpImpulse = options.jumpImpulse;
    this.jumpBufferDuration = options.jumpBufferDuration;
    this.camPitchDefault = options.camPitchDefault;
    this.camPitchMin = options.camPitchMin;
    this.camPitchMax = options.camPitchMax;
    this.camLerp = options.camLerp;
    this.camAzimuthSensitivity = options.camAzimuthSensitivity;
    this.camPitchSensitivity = options.camPitchSensitivity;
    this.camCollisionMaxDistance = options.camCollisionMaxDistance;
    this.camCollisionMinDistance = options.camCollisionMinDistance;
    this.camCollisionLerp = options.camCollisionLerp;

    // Sibling found on first update() tick
    this.entityPhysics = null;

    // Input state
    this.keys = new Set();
    this.canJump = false;
    this.jumpBufferElapsed = 0;
    this.dashTimerElapsed = 0;

    // Camera orbit state
    this.camAzimuth = 0;
    this.camPitch = this.camPitchDefault;
    this.hasPointerLock = false;
    this.isDragging = false;
    this.dragX = 0;
    this.dragY = 0;

    // Camera collision detection state
    this.raycaster = new Raycaster();
    this.camDistance = this.camCollisionMaxDistance;

    // Lerp targets
    this.lookTarget = new Vector3();

    // Animations
    this.tweens = new Tweens();
  }

  init(options, core) {
    // Initialize core
    this.core = core;

    // Add event listeners
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('mouseup', this.onWindowMouseUp);
    this.core.canvas.addEventListener('mousedown', this.onCanvasMouseDown);

    // Cleanup when the parent ball entity is removed from the scene
    this.addEventListener('added', this.onAdded);
  }

  update(loop) {
    // Decrement timers
    this.dashTimerElapsed = Math.max(0, this.dashTimerElapsed - loop.delta);
    this.jumpBufferElapsed = Math.max(0, this.jumpBufferElapsed - loop.delta);

    // Set direction vectors (XZ only, Y=0)
    _forward.set(-Math.sin(this.camAzimuth), 0, -Math.cos(this.camAzimuth));
    _right.set(Math.cos(this.camAzimuth), 0, -Math.sin(this.camAzimuth));

    // Dynamically adjust angular damping based on input
    const hasInput = this.keys.size > 0;
    const targetAngularDamping = hasInput ? 0.5 : 10;
    this.entityPhysics.rigidBody.setAngularDamping(targetAngularDamping);

    // Accumulate movement direction from held keys
    _forceDir.set(0, 0, 0);
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) _forceDir.add(_forward);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) _forceDir.sub(_forward);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) _forceDir.add(_right);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) _forceDir.sub(_right);
    if (_forceDir.lengthSq() > 1) _forceDir.normalize();

    // Taper input force as speed approaches max movement speed using dot-product
    if (_forceDir.lengthSq() > 0) {
      const linvel = this.entityPhysics.rigidBody.linvel();
      const speedInDir = linvel.x * _forceDir.x + linvel.z * _forceDir.z; // Y is always 0 in forceDir
      const scale = Math.max(0, 1 - speedInDir / this.moveMaxSpeed);
      _force.copy(_forceDir).multiplyScalar(this.moveForce * scale * (loop.delta / 1000));
      this.entityPhysics.rigidBody.applyImpulse(_force, true);

      // Steer the ball towards the camera direction
      _perp.set(linvel.x - speedInDir * _forceDir.x, 0, linvel.z - speedInDir * _forceDir.z);
      this.entityPhysics.rigidBody.applyImpulse(_perp.multiplyScalar(-this.steerFactor * (loop.delta / 1000)), true);
    }

    // Perform a jump behavior
    if (this.jumpBufferElapsed > 0 && this.canJump) {
      const linvel = this.entityPhysics.rigidBody.linvel();
      if (linvel.y < 0) {
        this.entityPhysics.rigidBody.setLinvel({ x: linvel.x, y: 0, z: linvel.z }, true);
      }
      this.entityPhysics.rigidBody.applyImpulse({ x: 0, y: this.jumpImpulse, z: 0 }, true);
      this.canJump = false;
      this.jumpBufferElapsed = 0;
    }

    // Perform a forward dash
    const wantsDash = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    if (wantsDash && this.dashTimerElapsed <= 0) {
      const dashDir = _forceDir.lengthSq() > 0 ? _forceDir : _forward;
      this.entityPhysics.rigidBody.applyImpulse({ x: dashDir.x * this.dashImpulse, y: 0, z: dashDir.z * this.dashImpulse }, true);
      this.dashTimerElapsed = this.dashTimerDuration;
      this.tweenCameraFOV();
    }

    // Resume Entity update behavior
    super.update(loop);
  }

  render(loop) {
    // Update tweens
    this.tweens.update();

    // Lerp only the orbit center toward the ball
    const lerpFactor = 1 - Math.pow(this.camLerp, loop.delta / 16.67);
    _orbitCenter.lerp(this.parent.position, lerpFactor);

    // Perform collision detection to adjust camera distance
    const h = this.camCollisionMaxDistance * Math.cos(this.camPitch);
    const v = this.camCollisionMaxDistance * Math.sin(this.camPitch);
    
    // Calculate desired camera position
    _desiredCamPos.set(
      _orbitCenter.x + h * Math.sin(this.camAzimuth),
      _orbitCenter.y + v,
      _orbitCenter.z + h * Math.cos(this.camAzimuth)
    );
    
    // Cast ray from orbit center toward desired camera position
    _rayDirection.subVectors(_desiredCamPos, _orbitCenter).normalize();
    this.raycaster.set(_orbitCenter, _rayDirection);
    this.raycaster.far = this.camCollisionMaxDistance;
    
    // Get intersections, filtering out the player ball
    const intersections = this.raycaster.intersectObject(this.core.scene, true);
    const filteredIntersections = intersections.filter(hit => {
      // Exclude the player ball and its children
      let current = hit.object;
      while (current) {
        if (current === this.parent) return false;
        current = current.parent;
      }
      return true;
    });
    
    // Calculate target distance based on collision
    let targetCamDistance = this.camCollisionMaxDistance;
    if (filteredIntersections.length > 0) {
      const hitDistance = filteredIntersections[0].distance;
      const safeDistance = Math.max(this.camCollisionMinDistance, hitDistance - this.camCollisionMinDistance);
      targetCamDistance = safeDistance;
    }
    
    // Smoothly lerp current distance toward target
    const collisionLerpFactor = 1 - Math.pow(this.camCollisionLerp, loop.delta / 16.67);
    this.camDistance = this.camDistance + (targetCamDistance - this.camDistance) * collisionLerpFactor;

    // Update camera position and rotation using adjusted distance
    const hAdjusted = this.camDistance * Math.cos(this.camPitch);
    const vAdjusted = this.camDistance * Math.sin(this.camPitch);
    this.core.camera.position.set(_orbitCenter.x + hAdjusted * Math.sin(this.camAzimuth), _orbitCenter.y + vAdjusted, _orbitCenter.z + hAdjusted * Math.cos(this.camAzimuth));
    this.core.camera.lookAt(_orbitCenter);

    // Resume Entity render behavior
    super.render(loop);
  }

  tweenCameraFOV() {
    // Tween camera FOV
    const fovOriginal = this.core.camera.fov;
    const fovState = { fov: fovOriginal };
    const zoomDuration = 250;
    const zoomAmount = 1.25;

    // Create reusable camera tween
    const tween = (fov = 45, duration = 100, onComplete = () => {}) => {
      return this.tweens.tween({
        object: fovState,
        to: { fov: fov },
        duration: duration,
        easing: 'Quadratic.InOut',
        onComplete: onComplete,
        onUpdate: () => {
          this.core.camera.fov = fovState.fov;
          this.core.camera.updateProjectionMatrix();
        }
      });
    };

    // Tween camera FOV in and out
    tween(fovOriginal * zoomAmount, zoomDuration, () => {
      tween(fovOriginal, zoomDuration * 2);
    });
  }

  setEntityPhysics(entity) {
    this.entityPhysics = entity;
    this.entityPhysics.addEventListener('collision', this.onCollision);
  }

  onKeyDown = (event) => {
    this.keys.add(event.code);
    if (event.code === 'Space') {
      event.preventDefault();
      this.jumpBufferElapsed = this.jumpBufferDuration;
    }
  }

  onKeyUp = (event) => {
    this.keys.delete(event.code);
  }

  onMouseMove = (event) => {
    if (this.hasPointerLock) {
      // Pointer lock: use raw movement deltas directly
      this.camAzimuth -= event.movementX * this.camAzimuthSensitivity;
      this.camPitch = Math.max(this.camPitchMin, Math.min(this.camPitchMax, this.camPitch + event.movementY * this.camPitchSensitivity));
    }
    else if (this.isDragging) {
      // Fallback drag: compute delta from last stored position
      const dx = event.clientX - this.dragX;
      const dy = event.clientY - this.dragY;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.camAzimuth -= dx * this.camAzimuthSensitivity;
      this.camPitch = Math.max(this.camPitchMin, Math.min(this.camPitchMax, this.camPitch + dy * this.camPitchSensitivity));
    }
  }

  onPointerLockChange = () => {
    this.hasPointerLock = (document.pointerLockElement === this.core.canvas);
    // If lock was lost (Escape), pause drag controls until user clicks again
    if (!this.hasPointerLock) {
      this.isDragging = false;
    }
  }

  onCanvasMouseDown = (event) => {
    if (event.button !== 0) return;
    if (this.core.canvas.requestPointerLock) {
      // Attempt to request pointer lock
      Promise.resolve(this.core.canvas.requestPointerLock()).catch(() => {
        this.isDragging = true;
        this.dragX = event.clientX;
        this.dragY = event.clientY;
      });
    }
    else {
      // Fallback drag mode
      this.isDragging = true;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
    }
  }

  onWindowMouseUp = (event) => {
    if (event.button !== 0) return;
    this.isDragging = false;
  }

  onWindowBlur = () => {
    this.keys.clear();
    this.isDragging = false;
  }

  onAdded = event => {
    // Set reference to physics entity type
    const sibling = this.parent.children.find(c => c.class === 'EntityPhysics');
    if (sibling) this.setEntityPhysics(sibling);

    // Add event listener to parent entity
    this.parent.addEventListener('removed', this.onParentRemoved);
    this.parent.addEventListener('childadded', this.onChildAdded);
  }

  onChildAdded = event => {
    // Check if child of parent is a physics entity type
    if (event.child.class === 'EntityPhysics') {
      this.setEntityPhysics(event.child);
      this.parent.removeEventListener('childadded', this.onChildAdded);
    }
  }

  onCollision = event => {
    if (event.started) this.canJump = true;
  }

  onParentRemoved = () => {
    // Remove event listeners
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
    this.core.canvas.removeEventListener('mousedown', this.onCanvasMouseDown);

    // Remove collision listener from sibling EntityPhysics
    this.entityPhysics.removeEventListener('collision', this.onCollision);

    // Exit pointer lock if active
    if (this.hasPointerLock) document.exitPointerLock?.();
  }
}

export { EntityBallController };