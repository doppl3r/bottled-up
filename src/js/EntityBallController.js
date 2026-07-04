import { Vector3 } from 'three';
import { Entity } from './core/Entity.js';

// Tuning constants
const MOVE_FORCE   = 10;
const MAX_SPEED    = 8;
const STEER_FACTOR = 1.0;
const DASH_IMPULSE = 10;
const DASH_COOLDOWN_MS = 3000;
const JUMP_IMPULSE = 8;
const JUMP_BUFFER_MS = 100;
const CAM_DISTANCE = 8;
const CAM_PITCH_DEFAULT = 0.5;
const CAM_PITCH_MIN = 0.08;
const CAM_PITCH_MAX = 1.48;
const CAM_LERP_BASE = 0.9;     // at 60fps: 1 - 0.9^1 = 0.1 per frame
const AZ_SENSITIVITY = 0.0025;  // rad/px
const PITCH_SENSITIVITY = 0.003; // rad/px

// Module-scoped reusables to avoid per-frame allocations
const _forward = new Vector3();
const _right   = new Vector3();
const _forceDir = new Vector3();
const _force    = new Vector3();
const _perp     = new Vector3();
const _orbitCenter = new Vector3();

class EntityBallController extends Entity {
  constructor(options = {}) {
    options = Object.assign({ class: 'EntityBallController' }, options);
    super(options);

    // References set in init()
    this.camera = null;
    this.canvas = null;

    // Sibling found on first update() tick
    this.entityPhysics = null;
    this._collisionListener = null;

    // Input state
    this.keys = new Set();
    this.jumpBufferTimer = 0;
    this.canJump = false;
    this.dashCooldown = 0;

    // Camera orbit state
    this.azimuth = 0;
    this.pitch = CAM_PITCH_DEFAULT;
    this.hasPointerLock = false;
    this.isDragging = false;
    this.dragX = 0;
    this.dragY = 0;

    // Lerp targets
    this._lookTarget = new Vector3();
  }

  init(options, entityManager) {
    this.camera = entityManager.camera;
    this.canvas = entityManager.canvas;

    // Initialise lookTarget to current camera position so there's no jump on first frame
    if (this.camera) this._lookTarget.copy(this.camera.position);

    // Bind handlers so we can remove them later
    this._onKeyDown          = this._handleKeyDown.bind(this);
    this._onKeyUp            = this._handleKeyUp.bind(this);
    this._onMouseMove        = this._handleMouseMove.bind(this);
    this._onPointerLockChange = this._handlePointerLockChange.bind(this);
    this._onCanvasMouseDown  = this._handleCanvasMouseDown.bind(this);
    this._onWindowMouseUp    = this._handleWindowMouseUp.bind(this);
    this._onWindowBlur       = this._handleWindowBlur.bind(this);

    document.addEventListener('keydown',          this._onKeyDown);
    document.addEventListener('keyup',            this._onKeyUp);
    document.addEventListener('mousemove',        this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    this.canvas?.addEventListener('mousedown',    this._onCanvasMouseDown);
    window.addEventListener('mouseup',            this._onWindowMouseUp);
    window.addEventListener('blur',               this._onWindowBlur);

    // Cleanup when the parent ball entity is removed from the scene
    this.parent?.addEventListener('removed', this._onParentRemoved);
  }

  // ─── Event handlers ────────────────────────────────────────────────────────

  _handleKeyDown(event) {
    this.keys.add(event.code);
    if (event.code === 'Space') {
      event.preventDefault();
      this.jumpBufferTimer = JUMP_BUFFER_MS;
    }
  }

  _handleKeyUp(event) {
    this.keys.delete(event.code);
  }

  _handleMouseMove(event) {
    if (this.hasPointerLock) {
      // Pointer lock: use raw movement deltas directly
      this.azimuth -= event.movementX * AZ_SENSITIVITY;
      this.pitch = Math.max(CAM_PITCH_MIN, Math.min(CAM_PITCH_MAX,
        this.pitch + event.movementY * PITCH_SENSITIVITY
      ));
    } else if (this.isDragging) {
      // Fallback drag: compute delta from last stored position
      const dx = event.clientX - this.dragX;
      const dy = event.clientY - this.dragY;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.azimuth -= dx * AZ_SENSITIVITY;
      this.pitch = Math.max(CAM_PITCH_MIN, Math.min(CAM_PITCH_MAX,
        this.pitch + dy * PITCH_SENSITIVITY
      ));
    }
  }

  _handlePointerLockChange() {
    this.hasPointerLock = (document.pointerLockElement === this.canvas);
    // If lock was lost (Escape), pause drag controls until user clicks again
    if (!this.hasPointerLock) {
      this.isDragging = false;
    }
  }

  _handleCanvasMouseDown(event) {
    if (event.button !== 0) return;
    if (this.canvas?.requestPointerLock) {
      // requestPointerLock() returns a Promise in modern browsers and throws in
      // environments that don't support it (e.g. Chrome Extension popups).
      // Catch the rejection and fall back to drag mode silently.
      Promise.resolve(this.canvas.requestPointerLock()).catch(() => {
        this.isDragging = true;
        this.dragX = event.clientX;
        this.dragY = event.clientY;
      });
    } else {
      // Fallback drag mode
      this.isDragging = true;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
    }
  }

  _handleWindowMouseUp(event) {
    if (event.button !== 0) return;
    this.isDragging = false;
  }

  _handleWindowBlur() {
    this.keys.clear();
    this.isDragging = false;
  }

  _onParentRemoved = () => {
    // Remove all DOM listeners
    document.removeEventListener('keydown',           this._onKeyDown);
    document.removeEventListener('keyup',             this._onKeyUp);
    document.removeEventListener('mousemove',         this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this.canvas?.removeEventListener('mousedown',     this._onCanvasMouseDown);
    window.removeEventListener('mouseup',             this._onWindowMouseUp);
    window.removeEventListener('blur',                this._onWindowBlur);

    // Remove collision listener from sibling EntityPhysics
    if (this.entityPhysics && this._collisionListener) {
      this.entityPhysics.removeEventListener('collision', this._collisionListener);
    }

    // Exit pointer lock if active
    if (this.hasPointerLock) document.exitPointerLock?.();
  }

  // ─── Update (physics tick) ─────────────────────────────────────────────────

  update(loop) {
    // Step 1: One-time sibling lookup — safe because spawn() is synchronous,
    // so all siblings exist before the first update() tick runs.
    if (this.entityPhysics === null) {
      const sibling = this.parent?.children.find(c => c.class === 'EntityPhysics');
      if (!sibling) return; // not ready yet (shouldn't happen)
      this.entityPhysics = sibling;
      this._collisionListener = event => {
        if (event.started) this.canJump = true;
      };
      this.entityPhysics.addEventListener('collision', this._collisionListener);
    }

    const rb = this.entityPhysics.rigidBody;
    if (!rb) return;

    // Step 2: Decrement timers
    this.dashCooldown    = Math.max(0, this.dashCooldown    - loop.delta);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - loop.delta);

    // Step 3: Direction vectors (XZ only, Y=0)
    _forward.set(-Math.sin(this.azimuth), 0, -Math.cos(this.azimuth));
    _right.set(   Math.cos(this.azimuth), 0, -Math.sin(this.azimuth));

    // Step 4: Accumulate movement direction from held keys
    _forceDir.set(0, 0, 0);
    if (this.keys.has('KeyW')     || this.keys.has('ArrowUp'))    _forceDir.add(_forward);
    if (this.keys.has('KeyS')     || this.keys.has('ArrowDown'))  _forceDir.sub(_forward);
    if (this.keys.has('KeyD')     || this.keys.has('ArrowRight')) _forceDir.add(_right);
    if (this.keys.has('KeyA')     || this.keys.has('ArrowLeft'))  _forceDir.sub(_right);
    if (_forceDir.lengthSq() > 1) _forceDir.normalize();

    // Step 5: Dot-product force cap — taper input force as speed approaches MAX_SPEED.
    // Uses applyImpulse scaled by delta time rather than addForce, because addForce
    // accumulates in Rapier's force buffer and persists until the next step. applyImpulse
    // is one-shot per call and unambiguously correct for per-tick character movement.
    if (_forceDir.lengthSq() > 0) {
      const linvel = rb.linvel();
      const speedInDir = linvel.x * _forceDir.x + linvel.z * _forceDir.z; // Y is always 0 in forceDir
      const scale = Math.max(0, 1 - speedInDir / MAX_SPEED);
      _force.copy(_forceDir).multiplyScalar(MOVE_FORCE * scale * (loop.delta / 1000));
      rb.applyImpulse(_force, true);

      // Steering: cancel velocity perpendicular to the intended direction so the
      // ball corrects toward the camera facing without killing momentum from
      // slopes, dashes, or collisions. Only acts on the XZ plane.
      _perp.set(linvel.x - speedInDir * _forceDir.x, 0, linvel.z - speedInDir * _forceDir.z);
      rb.applyImpulse(_perp.multiplyScalar(-STEER_FACTOR * (loop.delta / 1000)), true);
    }

    // Step 6: Jump — fires when buffer is active and a surface was touched
    if (this.jumpBufferTimer > 0 && this.canJump) {
      const linvel = rb.linvel();
      if (linvel.y < 0) {
        rb.setLinvel({ x: linvel.x, y: 0, z: linvel.z }, true);
      }
      rb.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
      this.canJump = false;
      this.jumpBufferTimer = 0;
    }

    // Step 7: Dash — one-shot impulse in movement direction (or forward if idle)
    const wantsDash = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    if (wantsDash && this.dashCooldown <= 0) {
      const dashDir = _forceDir.lengthSq() > 0 ? _forceDir : _forward;
      rb.applyImpulse({
        x: dashDir.x * DASH_IMPULSE,
        y: 0,
        z: dashDir.z * DASH_IMPULSE
      }, true);
      this.dashCooldown = DASH_COOLDOWN_MS;
    }

    super.update(loop);
  }

  // ─── Render (render tick, interpolated) ────────────────────────────────────

  render(loop) {
    if (!this.camera) return super.render(loop);

    // Delta-time-normalised lerp factor — equivalent to 0.1 per frame at 60fps
    const lerpFactor = 1 - Math.pow(CAM_LERP_BASE, loop.delta / 16.67);

    // Ball's interpolated world position (set by EntityPhysics.render before this runs)
    const ball = this.parent.position;

    // Lerp only the orbit center toward the ball — this gives the smooth follow lag.
    // Orbit angles are applied directly (no lerp) so rapid mouse rotation never
    // lerps the camera through 3D space and produces the correct arc at any speed.
    _orbitCenter.lerp(ball, lerpFactor);

    const h = CAM_DISTANCE * Math.cos(this.pitch);
    const v = CAM_DISTANCE * Math.sin(this.pitch);
    this.camera.position.set(
      _orbitCenter.x + h * Math.sin(this.azimuth),
      _orbitCenter.y + v,
      _orbitCenter.z + h * Math.cos(this.azimuth)
    );

    this.camera.lookAt(_orbitCenter);

    super.render(loop);
  }
}

export { EntityBallController };