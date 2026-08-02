import { ColliderDesc, QueryFilterFlags } from '@dimforge/rapier3d';
import { Vector2, Vector3 } from 'three';
import { Entity } from './core/Entity.js';
import { Tweens } from './core/Tweens.js';

/*
  EntityBallController controls the movement of a physical ball
  that can be controlled by a keyboard input.
*/

// Module-scoped reusables to avoid per-frame allocations
const _mouseMovement = new Vector2();
const _camForward = new Vector3();
const _camRight = new Vector3();
const _camLookAtTarget = new Vector3();
const _forceDir = new Vector3();
const _moveImpulse = new Vector3();
const _steerImpulse = new Vector3();
const _orbitCenter = new Vector3();
const _desiredCamPos = new Vector3();
const _rayDirection = new Vector3();
const _groundNormalSum = new Vector3();
const _gravityTangential = new Vector3();
const _gravityNormalScaled = new Vector3();
const _uphillDir = new Vector3();
const _contactToBall = new Vector3();
const _slopeImpulse = new Vector3();

class EntityBallController extends Entity {
  constructor(options = {}) {
    options = Object.assign({
      class: 'EntityBallController',
      moveForce: 24,
      moveMaxSpeed: 8,
      steerFactor: 4.0,
      dashSpeed: 8,
      dashTimerDuration: 3000,
      jumpBufferDuration: 100,
      jumpHeight: 2.5,
      jumpSpin: 0.0,
      maxSlopeAngle: 45,
      camPitchDefault: Math.PI / 8,
      camPitchMin: (Math.PI / -2) + 0.1,
      camPitchMax: (Math.PI / 2) - 0.1,
      camLerp: 0.9,
      camOrbitHeight: 0.5,
      camCollisionLerp: 0.9,
      camCollisionMaxDistance: 5,
      camCollisionMinDistance: 0.5,
      camCollisionRadius: 0.1,
      camAzimuthSensitivity: 0.00125,
      camPitchSensitivity: 0.00125,
    }, options);

    // Inherit Entity properties
    super(options);

    // Assign default values from options
    this.moveForce = options.moveForce;
    this.moveMaxSpeed = options.moveMaxSpeed;
    this.steerFactor = options.steerFactor;
    this.dashSpeed = options.dashSpeed;
    this.dashTimerDuration = options.dashTimerDuration;
    this.jumpHeight = options.jumpHeight;
    this.jumpSpin = options.jumpSpin;
    this.jumpBufferDuration = options.jumpBufferDuration;
    this.maxSlopeAngleRad = options.maxSlopeAngle * Math.PI / 180;
    this.camPitchDefault = options.camPitchDefault;
    this.camPitchMin = options.camPitchMin;
    this.camPitchMax = options.camPitchMax;
    this.camLerp = options.camLerp;
    this.camOrbitHeight = options.camOrbitHeight;
    this.camAzimuthSensitivity = options.camAzimuthSensitivity;
    this.camPitchSensitivity = options.camPitchSensitivity;
    this.camCollisionMaxDistance = options.camCollisionMaxDistance;
    this.camCollisionMinDistance = options.camCollisionMinDistance;
    this.camCollisionLerp = options.camCollisionLerp;
    this.camCollisionRadius = options.camCollisionRadius;
    this.camCollisionShape = ColliderDesc.ball(options.camCollisionRadius).shape;

    // Physics entity reference
    this.entityPhysics = null;

    // Ground/slope detection state
    this.groundNormal = new Vector3(0, 1, 0);
    this.isGrounded = false;

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
    this.camDistance = this.camCollisionMaxDistance;

    // Lerp targets
    this.lookTarget = new Vector3();

    // Animations
    this.tweens = new Tweens();
    this.camRotateTween = null;
    this.camAzimuthTarget = 0;
    this.camPitchTarget = this.camPitchDefault;
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

    // Add event listeners for components
    this.addEventListener('added', this.onAdded);

    // Initialize entity properties
    super.init(options, core);
  }

  update(loop) {
    // Refresh ground/slope contact normal from physics narrow-phase
    this.updateGroundNormal();

    // Reset jump availability every tick the ball rests on stable ground.
    if (this.isGrounded) {
      const linvel = this.entityPhysics.rigidBody.linvel();
      const normalSpeed = linvel.x * this.groundNormal.x + linvel.y * this.groundNormal.y + linvel.z * this.groundNormal.z;
      if (normalSpeed <= 0.01) {
        this.canJump = true;
      }
    }

    // Decrement timers
    this.dashTimerElapsed = Math.max(0, this.dashTimerElapsed - loop.delta);
    this.jumpBufferElapsed = Math.max(0, this.jumpBufferElapsed - loop.delta);

    // Get mass for scaling all impulses
    const mass = this.entityPhysics.rigidBody.mass();

    // Set direction vectors (XZ only, Y=0)
    _camForward.set(-Math.sin(this.camAzimuth), 0, -Math.cos(this.camAzimuth));
    _camRight.set(Math.cos(this.camAzimuth), 0, -Math.sin(this.camAzimuth));

    // Dynamically adjust angular damping based on input
    const hasInput = this.keys.size > 0;
    const targetAngularDamping = hasInput ? 0.5 : 10;
    this.entityPhysics.rigidBody.setAngularDamping(targetAngularDamping);

    // Accumulate movement direction from held keys
    _forceDir.set(0, 0, 0);
    if (this.keys.has('KeyW')) _forceDir.add(_camForward);
    if (this.keys.has('KeyS')) _forceDir.sub(_camForward);
    if (this.keys.has('KeyD')) _forceDir.add(_camRight);
    if (this.keys.has('KeyA')) _forceDir.sub(_camRight);
    if (_forceDir.lengthSq() > 1) _forceDir.normalize();

    // Taper input force as speed approaches max movement speed using dot-product
    if (_forceDir.lengthSq() > 0) {
      const linvel = this.entityPhysics.rigidBody.linvel();
      const speedInDir = (linvel.x * _forceDir.x) + (linvel.z * _forceDir.z); // Y is always 0 in forceDir
      const scale = Math.max(0, 1 - speedInDir / this.moveMaxSpeed);
      _moveImpulse.copy(_forceDir).multiplyScalar(this.moveForce * scale * (loop.delta / 1000) * mass);
      this.entityPhysics.rigidBody.applyImpulse(_moveImpulse, true);

      // Steer the ball towards the camera direction
      _steerImpulse.set(linvel.x - speedInDir * _forceDir.x, 0, linvel.z - speedInDir * _forceDir.z);
      this.entityPhysics.rigidBody.applyImpulse(_steerImpulse.multiplyScalar(-this.steerFactor * (loop.delta / 1000) * mass), true);

      // Cancel gravity's downhill pull while climbing a gentle slope
      if (this.isGrounded) {
        const slopeAngle = Math.acos(Math.min(1, Math.max(-1, this.groundNormal.y)));

        // Check if slope angle is less than predefined max slope angle
        if (slopeAngle <= this.maxSlopeAngleRad) {
          const gravity = this.core.entityManager.world.gravity;
          _gravityTangential.set(gravity.x, gravity.y, gravity.z);
          const gDotN = _gravityTangential.dot(this.groundNormal);
          _gravityNormalScaled.copy(this.groundNormal).multiplyScalar(gDotN);
          _gravityTangential.sub(_gravityNormalScaled);

          // Apply slope climbing if gravity tangential is greater than 1e-6 (near zero)
          if (_gravityTangential.lengthSq() > 1e-6) {
            _uphillDir.copy(_gravityTangential).multiplyScalar(-1).normalize();
            const climbFactor = Math.max(0, Math.min(1, _forceDir.dot(_uphillDir)));
            _slopeImpulse.copy(_gravityTangential).multiplyScalar(-climbFactor * (loop.delta / 1000) * mass);
            this.entityPhysics.rigidBody.applyImpulse(_slopeImpulse, true);
          }
        }
      }
    }

    // Perform a jump behavior
    if (this.jumpBufferElapsed > 0 && this.canJump) {
      // Reset vertical velocity so slope-climb/falling speed doesn't stack with the jump impulse
      const linvel = this.entityPhysics.rigidBody.linvel();
      const mass = this.entityPhysics.rigidBody.mass();
      this.entityPhysics.rigidBody.setLinvel({ x: linvel.x, y: 0, z: linvel.z }, true);

      // Add forward spin (angular velocity) perpendicular to movement direction
      const spinAxis = new Vector3(_forceDir.z, 0, -_forceDir.x); // Perpendicular to movement in XZ plane
      this.entityPhysics.rigidBody.applyTorqueImpulse({ 
        x: spinAxis.x * this.jumpSpin * mass, 
        y: spinAxis.y * this.jumpSpin * mass, 
        z: spinAxis.z * this.jumpSpin * mass 
      }, true);

      // Calculate jump impulse from the desired jump height
      const gravity = this.core.entityManager.world.gravity;
      const gravityMagnitude = Math.sqrt(gravity.x ** 2 + gravity.y ** 2 + gravity.z ** 2);
      const requiredVelocity = Math.sqrt(2 * gravityMagnitude * this.jumpHeight);
      const jumpImpulse = requiredVelocity * mass;

      // Apply calculated jump impulse
      this.entityPhysics.rigidBody.applyImpulse({ x: 0, y: jumpImpulse, z: 0 }, true);
      this.canJump = false;
      this.jumpBufferElapsed = 0;
    }

    // Perform a forward dash
    const wantsDash = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    if (wantsDash && this.dashTimerElapsed <= 0) {
      const dashDir = _forceDir.lengthSq() > 0 ? _forceDir : _camForward;
      this.entityPhysics.rigidBody.applyImpulse({ x: dashDir.x * this.dashSpeed * mass, y: 0, z: dashDir.z * this.dashSpeed * mass }, true);
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
    
    // Calculate desired camera position relative to player
    _desiredCamPos.set(
      this.parent.position.x + h * Math.sin(this.camAzimuth),
      this.parent.position.y + v,
      this.parent.position.z + h * Math.cos(this.camAzimuth)
    );
    
    // Cast sphere from player position toward desired camera position using Rapier shape cast
    _rayDirection.subVectors(_desiredCamPos, this.parent.position).normalize();
    const targetCamDistance = this.castCameraCollisionSphere(this.parent.position, _rayDirection, this.camCollisionMaxDistance);
    
    // Smoothly lerp current distance toward camera target
    const collisionLerpFactor = 1 - Math.pow(this.camCollisionLerp, loop.delta / 16.67);
    this.camDistance = this.camDistance + (targetCamDistance - this.camDistance) * collisionLerpFactor;

    // Update camera position and rotation using adjusted distance
    const hAdjusted = this.camDistance * Math.cos(this.camPitch);
    const vAdjusted = this.camDistance * Math.sin(this.camPitch);
    this.core.camera.position.set(_orbitCenter.x + hAdjusted * Math.sin(this.camAzimuth), _orbitCenter.y + vAdjusted, _orbitCenter.z + hAdjusted * Math.cos(this.camAzimuth));
    
    // Apply y-offset to orbit center for camera look-at target
    _camLookAtTarget.copy(_orbitCenter);
    _camLookAtTarget.y += this.camOrbitHeight * (this.camDistance / this.camCollisionMaxDistance);
    this.core.camera.lookAt(_camLookAtTarget);

    // Resume Entity render behavior
    super.render(loop);
  }

  updateGroundNormal() {
    // Reset accumulator for this tick
    _groundNormalSum.set(0, 0, 0);
    let contactCount = 0;

    // Only contacts within maxSlopeAngle of vertical count as "ground"
    const rollThreshold = Math.cos(this.maxSlopeAngleRad);
    const world = this.core.entityManager.world;
    const ballPos = this.parent.position;
    const ballHandle = this.entityPhysics.rigidBody.collider(0).handle;

    // Query all contacts with this ball to find ground surfaces
    world.narrowPhase.contactPairsWith(ballHandle, otherHandle => {

      // Extract contact manifold to query normal and contact point
      world.narrowPhase.contactPair(ballHandle, otherHandle, manifold => {
        if (manifold.numSolverContacts() === 0) return;

        // Canonicalize normal to point away from the contact surface
        const n = manifold.normal();
        const contactPoint = manifold.solverContactPoint(0);

        // Determine if normal points toward or away from ball
        _contactToBall.set(ballPos.x - contactPoint.x, ballPos.y - contactPoint.y, ballPos.z - contactPoint.z);
        const sign = (n.x * _contactToBall.x + n.y * _contactToBall.y + n.z * _contactToBall.z) < 0 ? -1 : 1;

        // Only accumulate contacts steep enough to be considered climbable ground
        const ny = n.y * sign;
        if (ny >= rollThreshold) {
          _groundNormalSum.x += n.x * sign;
          _groundNormalSum.y += ny;
          _groundNormalSum.z += n.z * sign;
          contactCount++;
        }
      });
    });

    // Update grounded state and preserve normal value
    if (contactCount > 0) {
      this.groundNormal.copy(_groundNormalSum).normalize();
      this.isGrounded = true;
    }
    else {
      this.groundNormal.set(0, 1, 0);
      this.isGrounded = false;
    }
  }

  castCameraCollisionSphere(origin, direction, maxDistance) {
    // Guard: return max distance if physics not yet initialized
    if (!this.entityPhysics || !this.entityPhysics.rigidBody) {
      return maxDistance;
    }

    // Use Rapier to create a small sphere for camera collision detection
    const world = this.core.entityManager.world;
    const rigidBody = this.entityPhysics.rigidBody;
    const shape = this.camCollisionShape;
    const shapePos = origin;
    const shapeRot = rigidBody.rotation();
    const shapeVel = direction;
    const targetDistance = 0.0; // Distance between collision
    const maxToi = maxDistance;
    const stopAtPenetration = false; // Continue full sweep
    const filterFlags = QueryFilterFlags.EXCLUDE_SENSORS;
    const filterGroups = undefined;
    const filterExcludeCollider = undefined;
    const filterExcludeRigidBody = rigidBody;
    const hit = world.castShape(shapePos, shapeRot, shapeVel, shape, targetDistance, maxToi, stopAtPenetration, filterFlags, filterGroups, filterExcludeCollider, filterExcludeRigidBody);

    // Distance traveled before the swept shape touches a collider
    if (hit) {
      return Math.max(this.camCollisionMinDistance, hit.time_of_impact);
    }
    return maxDistance;
  }

  tweenCameraRotation({ azimuth = 0, pitch = 0, snap, duration = 300, easing = 'Quadratic.Out' }) {
    // Use last intended target as base when mid-tween, current position when idle
    const baseAzimuth = this.camRotateTween ? this.camAzimuthTarget : this.camAzimuth;
    const basePitch   = this.camRotateTween ? this.camPitchTarget   : this.camPitch;

    // Stop any in-progress camera rotation tween
    if (this.camRotateTween) {
      this.camRotateTween.stop();
      this.camRotateTween = null;
    }

    // Snap azimuth to the nearest snap value (if defined)
    const camSnapAzimuthValue = Math.round(baseAzimuth / snap + Math.sign(azimuth) * (0.5 + 1e-6)) * snap;
    const camSnapAzimuthTarget = (snap !== undefined) ? camSnapAzimuthValue : baseAzimuth + azimuth;
    const camSnapAzimuth = azimuth !== 0 ? camSnapAzimuthTarget : baseAzimuth;

    // Snap pitch to the nearest snap value (if defined)
    const camSnapPitchValue = Math.round(basePitch / snap + Math.sign(pitch) * (0.5 + 1e-6)) * snap;
    const camSnapPitchTarget = Math.max(this.camPitchMin, Math.min(this.camPitchMax, snap !== undefined ? camSnapPitchValue : basePitch + pitch));
    const camSnapPitch = pitch !== 0 ? camSnapPitchTarget : basePitch;

    // Store targets for accumulation on the next call
    this.camAzimuthTarget = camSnapAzimuth;
    this.camPitchTarget = camSnapPitch;

    // Tween from current camera state to snapped target
    const state = { azimuth: this.camAzimuth, pitch: this.camPitch };
    this.camRotateTween = this.tweens.tween({
      object: state,
      to: { azimuth: camSnapAzimuth, pitch: camSnapPitch },
      dynamic: true,
      duration,
      easing,
      onUpdate: () => {
        this.camAzimuth = state.azimuth;
        this.camPitch = state.pitch;
      },
      onComplete: () => {
        this.camRotateTween = null;
      }
    });
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
        easing: 'Quadratic.Out',
        onComplete: onComplete,
        onUpdate: () => {
          this.core.camera.fov = fovState.fov;
          this.core.camera.updateProjectionMatrix();
        }
      });
    };

    // Tween camera FOV in and out
    tween(fovOriginal * zoomAmount, zoomDuration, () => {
      tween(fovOriginal, zoomDuration * 4);
    });
  }

  setEntityPhysics(entity) {
    this.entityPhysics = entity;
  }

  onKeyDown = (event) => {
    this.keys.add(event.code);
    if (event.code === 'Space') {
      event.preventDefault();
      this.jumpBufferElapsed = this.jumpBufferDuration;
    }

    // Update camera rotation
    if (event.code === 'ArrowRight' || event.code === 'KeyE') this.tweenCameraRotation({ azimuth: -Math.PI / 4, duration: 250, snap: Math.PI / 4, easing: 'Quadratic.Out' });
    if (event.code === 'ArrowLeft' || event.code === 'KeyQ')  this.tweenCameraRotation({ azimuth: Math.PI / 4, duration: 250, snap: Math.PI / 4, easing: 'Quadratic.Out' });
    if (event.code === 'ArrowUp')    this.tweenCameraRotation({ pitch: -Math.PI / 8, duration: 250, snap: Math.PI / 8, easing: 'Quadratic.Out' });
    if (event.code === 'ArrowDown')  this.tweenCameraRotation({ pitch: Math.PI / 8, duration: 250, snap: Math.PI / 8, easing: 'Quadratic.Out' });
  }

  onKeyUp = (event) => {
    this.keys.delete(event.code);
  }

  onMouseMove = (event) => {
    if (this.hasPointerLock) {
      // Set threshold limits (33% of window)
      const isHorizontalSpike = Math.abs(event.movementX) > window.innerWidth / 3;
      const isVerticalSpike = Math.abs(event.movementY) > window.innerHeight / 3;
      
      // Check if mouse movement exceeds window threshold
      if (!isHorizontalSpike && !isVerticalSpike) {
        // Set raw movement deltas from pointer lock
        _mouseMovement.set(event.movementX, event.movementY);
      }
      else {
        console.log('onMouseMove: Mouse spike occurred');
      }

      // Pointer lock: use raw movement deltas directly
      this.camAzimuth -= _mouseMovement.x * this.camAzimuthSensitivity;
      this.camPitch = Math.max(this.camPitchMin, Math.min(this.camPitchMax, this.camPitch + _mouseMovement.y * this.camPitchSensitivity));
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

  onParentRemoved = () => {
    // Remove event listeners
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
    this.core.canvas.removeEventListener('mousedown', this.onCanvasMouseDown);

    // Exit pointer lock if active
    if (this.hasPointerLock) document.exitPointerLock?.();
  }
}

export { EntityBallController };