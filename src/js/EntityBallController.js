import { ColliderDesc, QueryFilterFlags } from '@dimforge/rapier3d';
import { Quaternion, Vector2, Vector3 } from 'three';
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
const _wallNormalSum = new Vector3();
const _gravityTangential = new Vector3();
const _gravityNormalScaled = new Vector3();
const _uphillDir = new Vector3();
const _slopeImpulse = new Vector3();
const _wallJumpImpulse = new Vector3();
const _wallPushDir = new Vector3();
const _contactPoint = new Vector3();
const _contactToBall = new Vector3();
const _contactNormal = new Vector3();
const _colliderPosition = new Vector3();
const _colliderRotation = new Quaternion();

class EntityBallController extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Assign default values from options
    this.moveForce = options.moveForce;
    this.moveMaxSpeed = options.moveMaxSpeed;
    this.steerFactor = options.steerFactor;
    this.dashSpeed = options.dashSpeed;
    this.dashTimerDuration = options.dashTimerDuration;
    this.jumpHeight = options.jumpHeight;
    this.jumpSpin = options.jumpSpin;
    this.jumpBufferDuration = options.jumpBufferDuration;
    this.keyRight = options.keyRight || 'KeyD';
    this.keyLeft = options.keyLeft || 'KeyA';
    this.keyDown = options.keyDown || 'KeyS';
    this.keyUp = options.keyUp || 'KeyW';
    this.keyInteract = options.keyInteract || 'KeyF';
    this.keyRotateClockwise = options.keyRotateClockwise || 'KeyE';
    this.keyRotateCounterClockwise = options.keyRotateCounterClockwise || 'KeyQ';
    this.keyJump = options.keyJump || 'Space';
    this.maxSlopeAngleRad = options.maxSlopeAngle * Math.PI / 180;
    this.maxWallAngleRad = options.maxWallAngle * Math.PI / 180;
    this.wallJumpPower = options.wallJumpPower;
    this.camPitchDefault = options.camPitchDefault;
    this.camPitchMin = options.camPitchMin;
    this.camPitchMax = options.camPitchMax;
    this.camLerp = options.camLerp;
    this.camOrbitHeight = options.camOrbitHeight;
    this.camAzimuthSensitivity = options.camAzimuthSensitivity;
    this.camPitchSensitivity = options.camPitchSensitivity;
    this.camDistance = 0;
    this.camDistanceRatio = 0;
    this.camDistanceFadeRatio = options.camDistanceFadeRatio;
    this.camDistanceFadeOpacity = 1;
    this.camCollisionDistance = 0;
    this.camCollisionDistanceMax = options.camCollisionDistanceMax;
    this.camCollisionDistanceMin = options.camCollisionDistanceMin;
    this.camCollisionLerp = options.camCollisionLerp;
    this.camCollisionRadius = options.camCollisionRadius;
    this.camCollisionShape = ColliderDesc.ball(options.camCollisionRadius).shape;
    this.camCollisionHit = null;

    // Physics entity reference
    this.entityPhysics = null;

    // Ground/slope detection state
    this.groundNormal = new Vector3(0, 1, 0);
    this.isGrounded = false;
    this.wasGrounded = false;

    // Wall sliding detection state (airborne contact against a steep surface)
    this.wallNormal = new Vector3(0, 1, 0);
    this.isWallSliding = false;

    // Input state
    this.keys = new Set();
    this.canGroundJump = false;
    this.canWallJump = true;
    this.jumpBufferElapsed = 0;
    this.dashTimerElapsed = 0;

    // Camera orbit state
    this.camAzimuth = 0;
    this.camPitch = this.camPitchDefault;
    this.hasPointerLock = false;
    this.hasPointerLockError = false;
    this.isDragging = false;
    this.dragX = 0;
    this.dragY = 0;

    // Camera collision detection state
    this.camDistance = this.camCollisionDistanceMax;

    // Lerp targets
    this.lookTarget = new Vector3();

    // Animations
    this.tweens = new Tweens();
    this.camRotateTween = null;
    this.camAzimuthTarget = 0;
    this.camPitchTarget = this.camPitchDefault;

    // Initialize core
    this.core = core;

    // Add event listeners
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    // Add event listeners for components
    this.addEventListener('added', this.onAdded);

    // Initialize entity properties
    this.ready();
  }

  update(loop) {
    // Cancel update if physics entity is not yet assigned
    if (this.entityPhysics === undefined) return;

    // Refresh ground/slope/wall contact normals from physics narrow-phase
    this.updateSurfaceNormals();

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
    if (this.keys.has(this.keyUp)) _forceDir.add(_camForward);
    if (this.keys.has(this.keyDown)) _forceDir.sub(_camForward);
    if (this.keys.has(this.keyRight)) _forceDir.add(_camRight);
    if (this.keys.has(this.keyLeft)) _forceDir.sub(_camRight);
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

    // Perform a ground jump or, failing that, a wall jump
    if (this.jumpBufferElapsed > 0) {
      if (this.canGroundJump) {
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
        this.canGroundJump = false;
        this.jumpBufferElapsed = 0;
      }
      else if (this.isWallSliding && this.canWallJump) {
        const linvel = this.entityPhysics.rigidBody.linvel();
        const mass = this.entityPhysics.rigidBody.mass();

        // Use only the wall normal's horizontal component so a slanted wall can't leak fall speed into vertical velocity
        _wallPushDir.set(this.wallNormal.x, 0, this.wallNormal.z);
        if (_wallPushDir.lengthSq() > 1e-6) _wallPushDir.normalize();

        // Cancel fall speed and any horizontal velocity still pushing into the wall, preserving velocity along the wall
        const intoWallSpeed = linvel.x * _wallPushDir.x + linvel.z * _wallPushDir.z;
        _wallJumpImpulse.set(linvel.x, 0, linvel.z);
        if (intoWallSpeed < 0) _wallJumpImpulse.addScaledVector(_wallPushDir, -intoWallSpeed);
        this.entityPhysics.rigidBody.setLinvel(_wallJumpImpulse, true);

        // Calculate vertical impulse using the same formula as a ground jump
        const gravity = this.core.entityManager.world.gravity;
        const gravityMagnitude = Math.sqrt(gravity.x ** 2 + gravity.y ** 2 + gravity.z ** 2);
        const requiredVelocity = Math.sqrt(2 * gravityMagnitude * this.jumpHeight);

        // Combine the horizontal away-from-wall push with a fixed vertical jump impulse
        _wallJumpImpulse.copy(_wallPushDir).multiplyScalar(this.wallJumpPower * mass);
        _wallJumpImpulse.y = requiredVelocity * mass;
        this.entityPhysics.rigidBody.applyImpulse(_wallJumpImpulse, true);
        this.canWallJump = false;
        this.jumpBufferElapsed = 0;
      }
    }

    // Perform a forward dash
    const wantsDash = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    if (wantsDash && this.dashTimerElapsed <= 0) {
      // Cancel downward force before dash
      const linvel = this.entityPhysics.rigidBody.linvel();
      if (linvel.y < 0) {
        this.entityPhysics.rigidBody.setLinvel({ x: linvel.x, y: 0, z: linvel.z }, true);
      }
      
      // Apply dash impulse
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
    this.tweens.update(loop.delta);

    // Perform collision detection to adjust camera distance
    const h = this.camCollisionDistanceMax * Math.cos(this.camPitch);
    const v = this.camCollisionDistanceMax * Math.sin(this.camPitch);
    
    // Calculate desired camera position relative to parent
    _desiredCamPos.set(
      this.parent.position.x + h * Math.sin(this.camAzimuth),
      this.parent.position.y + v,
      this.parent.position.z + h * Math.cos(this.camAzimuth)
    );
    
    // Cast sphere from parent position toward desired camera position using Rapier shape cast
    _rayDirection.subVectors(_desiredCamPos, this.parent.position).normalize();
    this.camCollisionDistance = this.castCameraDistance(this.parent.position, _rayDirection, this.camCollisionDistanceMax);

    // Smoothly lerp current distance toward camera target
    const collisionLerpFactor = 1 - Math.pow(this.camCollisionLerp, loop.delta / 16.67);
    this.camDistance = this.camDistance + (this.camCollisionDistance - this.camDistance) * collisionLerpFactor;

    // Lerp the orbit center toward the ball before it's used below, so position and look-at target agree this frame
    this.camDistanceRatio = this.camDistance / this.camCollisionDistanceMax;
    const lerpFactor = 1 - Math.pow(this.camLerp * this.camDistanceRatio, loop.delta / 16.67);
    _orbitCenter.lerp(this.parent.position, lerpFactor);

    // Update camera position and rotation using adjusted distance
    const hAdjusted = this.camDistance * Math.cos(this.camPitch);
    const vAdjusted = this.camDistance * Math.sin(this.camPitch);
    this.core.camera.position.set(
      _orbitCenter.x + hAdjusted * Math.sin(this.camAzimuth),
      _orbitCenter.y + vAdjusted,
      _orbitCenter.z + hAdjusted * Math.cos(this.camAzimuth)
    );

    // Apply y-offset to orbit center for camera look-at target
    _camLookAtTarget.copy(_orbitCenter);
    _camLookAtTarget.y += this.camOrbitHeight * this.camDistanceRatio;
    this.core.camera.lookAt(_camLookAtTarget);
    
    // Update parent opacity by camera distance, only fading once within camDistanceFadeRatio of the parent
    const fadeRatio = Math.min(1, this.camDistanceRatio / this.camDistanceFadeRatio);
    const newOpacity = Math.round(fadeRatio / 0.001) * 0.001;
    if (newOpacity !== this.camDistanceFadeOpacity) {
      this.camDistanceFadeOpacity = newOpacity;
      this.parent.get('EntityModel').traverse(child => {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.opacity = newOpacity;
          child.material.needsUpdate = true;
        }
      });
    }

    // Resume Entity render behavior
    super.render(loop);
  }

  updateSurfaceNormals() {
    // Reset accumulators for this tick
    _groundNormalSum.set(0, 0, 0);
    _wallNormalSum.set(0, 0, 0);
    let groundCount = 0;
    let wallCount = 0;

    // Contacts within maxSlopeAngle of vertical count as "ground"; steeper contacts count as "wall"
    const rollThreshold = Math.cos(this.maxSlopeAngleRad);
    const wallThreshold = Math.cos(this.maxWallAngleRad);
    const world = this.core.entityManager.world;
    const ballPos = this.entityPhysics.getPosition();
    const ballHandle = this.entityPhysics.rigidBody.collider(0).handle;

    // Query all contacts with this ball to find ground and wall surfaces
    world.narrowPhase.contactPairsWith(ballHandle, otherHandle => {
      // The owning collider's pose is the same for every manifold of this pair, so read it once
      let hasColliderPose = false;

      // Extract contact manifold to query normal and contact point
      world.narrowPhase.contactPair(ballHandle, otherHandle, world.bodies, (manifold, flipped) => {
        // Skip manifolds without a usable contact point
        if (!manifold.localContactPoint1(0, _contactPoint)) return;

        // Resolve the contact point to world-space via its owning collider's pose
        if (!hasColliderPose) {
          const contactPointCollider = world.getCollider(flipped ? otherHandle : ballHandle);
          contactPointCollider.rotation(_colliderRotation);
          contactPointCollider.translation(_colliderPosition);
          hasColliderPose = true;
        }
        _contactPoint.applyQuaternion(_colliderRotation).add(_colliderPosition);

        // Canonicalize normal to point away from the contact surface
        const contactNormal = manifold.normal(_contactNormal);
        _contactToBall.subVectors(ballPos, _contactPoint);
        if (contactNormal.dot(_contactToBall) < 0) contactNormal.negate();

        // Sort into ground (climbable) vs wall (steeper than maxSlopeAngle) buckets
        const slopeCosine = contactNormal.y;
        if (slopeCosine >= rollThreshold) {
          _groundNormalSum.add(contactNormal);
          groundCount++;
        }
        else if (slopeCosine <= wallThreshold) {
          _wallNormalSum.add(contactNormal);
          wallCount++;
        }
      });
    });

    // Update grounded state and preserve normal value
    if (groundCount > 0) {
      this.groundNormal.copy(_groundNormalSum).normalize();
      this.isGrounded = true;
      this.canWallJump = true;
    }
    else {
      this.groundNormal.set(0, 1, 0);
      this.isGrounded = false;
    }

    // Enable ground jump if previous grounded state is false
    if (this.wasGrounded === false && this.isGrounded === true) this.canGroundJump = true;
    this.wasGrounded = this.isGrounded;

    // Wall sliding only applies while airborne; grounded contact always takes priority
    if (!this.isGrounded && wallCount > 0) {
      this.wallNormal.copy(_wallNormalSum).normalize();
      this.isWallSliding = true;
    }
    else {
      this.isWallSliding = false;
    }
  }

  castCameraDistance(origin, direction, maxDistance) {
    // Guard: return max distance if physics not yet loaded
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
    this.camCollisionHit = world.castShape(shapePos, shapeRot, shapeVel, shape, targetDistance, maxToi, stopAtPenetration, filterFlags, filterGroups, filterExcludeCollider, filterExcludeRigidBody);

    // Distance traveled before the swept shape touches a collider
    if (this.camCollisionHit) {
      return Math.max(this.camCollisionDistanceMin, this.camCollisionHit.time_of_impact);
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
    const zoomDuration = this.dashTimerDuration;
    const zoomAmount = 1.5;

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
    tween(fovOriginal * zoomAmount, zoomDuration * 0.25, () => {
      tween(fovOriginal, zoomDuration * 0.75);
    });
  }

  setEntityPhysics(entity) {
    this.entityPhysics = entity;

    // Listen to if entity is removed
    const onEntityPhysicsRemoved = () => {
      this.entityPhysics = undefined;
      entity.removeEventListener('removed', onEntityPhysicsRemoved);
    }
    entity.addEventListener('removed', onEntityPhysicsRemoved);
  }

  onKeyDown = (event) => {
    this.keys.add(event.code);
    if (event.code === this.keyJump) {
      event.preventDefault();
      this.jumpBufferElapsed = this.jumpBufferDuration;
    }

    // Update camera rotation
    if (event.code === 'ArrowRight' || event.code === this.keyRotateClockwise) this.tweenCameraRotation({ azimuth: -Math.PI / 4, duration: 250, snap: Math.PI / 4, easing: 'Quadratic.Out' });
    if (event.code === 'ArrowLeft' || event.code === this.keyRotateCounterClockwise)  this.tweenCameraRotation({ azimuth: Math.PI / 4, duration: 250, snap: Math.PI / 4, easing: 'Quadratic.Out' });
    if (event.code === 'ArrowUp')    this.tweenCameraRotation({ pitch: -Math.PI / 8, duration: 250, snap: Math.PI / 8, easing: 'Quadratic.Out' });
    if (event.code === 'ArrowDown')  this.tweenCameraRotation({ pitch: Math.PI / 8, duration: 250, snap: Math.PI / 8, easing: 'Quadratic.Out' });
    if (event.code === this.keyInteract) this.onInteract();
  }

  onKeyUp = (event) => {
    this.keys.delete(event.code);
  }

  onInteract() {
    this.dispatchEvent({ type: 'interact', code: this.keyInteract });
  }

  onMouseDown = (event) => {
    // Add mouse drag if pointer lock is not supported
    if (this.hasPointerLockError) {
      this.isDragging = true;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
    }
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

  onMouseUp = (event) => {
    if (event.button !== 0) return;
    this.isDragging = false;
  }

  onPointerLockChange = event => {
    this.hasPointerLock = (document.pointerLockElement === this.core.canvas);
    this.hasPointerLockError = false;

    // If lock was lost (Escape), pause drag controls until user clicks again
    if (!this.hasPointerLock) {
      this.isDragging = false;
    }
    else {
      this.dragX = event.clientX;
      this.dragY = event.clientY;
    }
  }

  onPointerLockError = event => {
    this.hasPointerLockError = true;
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
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);

    // Exit pointer lock if active
    if (this.hasPointerLock) document.exitPointerLock?.();
  }

  static template = {
    moveForce: 24,
    moveMaxSpeed: 8,
    steerFactor: 4.0,
    dashSpeed: 8,
    dashTimerDuration: 1000,
    jumpBufferDuration: 100,
    jumpHeight: 2.5,
    jumpSpin: 0.0,
    maxSlopeAngle: 45,
    maxWallAngle: 60,
    wallJumpPower: 5,
    camPitchDefault: Math.PI / 8,
    camPitchMin: (Math.PI / -2) + 0.1,
    camPitchMax: (Math.PI / 2) - 0.1,
    camLerp: 0.9,
    camOrbitHeight: 0.5,
    camCollisionLerp: 0.5,
    camCollisionDistanceMax: 5,
    camCollisionDistanceMin: 0.25,
    camCollisionRadius: 0.1,
    camDistanceFadeRatio: 0.5,
    camAzimuthSensitivity: 0.00125,
    camPitchSensitivity: 0.00125
  }
}

export { EntityBallController };