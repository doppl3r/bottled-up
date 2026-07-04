import { EventDispatcher, Raycaster, Vector2, Vector3 } from 'three';

/*
  The Selector class provides functionality for selecting and interacting
  with entities in a 3D object using pointer events. It utilizes raycasting
  to detect which objects are under the pointer and dispatches events
  accordingly.
*/

// Initialize module-scoped variables
const _v = new Vector3();
const _eventPointerDown = { type: 'pointerdown', button: 0, buttons: 0, clientX: 0, clientY: 0, intersects: [], pointerType: 'mouse', pressed: false, snapped: false }
const _eventPointerMove = { type: 'pointermove', button: 0, buttons: 0, clientX: 0, clientY: 0, intersects: [], pointerType: 'mouse', pressed: false, snapped: false }
const _eventPointerUp = { type: 'pointerup', button: 0, buttons: 0, clientX: 0, clientY: 0, intersects: [], pointerType: 'mouse', pressed: false, snapped: false }

class Selector extends EventDispatcher {
  constructor(camera, canvas) {
    // Inherit Three.js EventDispatcher system
    super();

    // Store references
    this.camera = camera;
    this.canvas = canvas;
    this.object = undefined;

    // Initialize raycaster and coordinates
    this.raycaster = new Raycaster();
    this.pointViewport = new Vector2();
    this.pointDown = new Vector2();
    this.pointMove = new Vector2();
    this.pointUp = new Vector2();
    this.pointRange = 10; // pixels
    this.pointPressed = false;
    this.pointSnapped = false;

    // Enable by default
    this.addEventListeners();
  }

  attach(object) {
    this.object = object;
  }

  detach() {
    this.object = undefined;
  }

  addEventListeners() {
    // Add event listeners
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
  }

  removeEventListeners() {
    // Remove event listeners
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
  }

  getIntersects = e => {
    // Return all intersected objects under pointer
    this.updateCoords(e);
    this.raycaster.setFromCamera(this.pointViewport, this.camera);
    let intersects = this.raycaster.intersectObject(this.object, true);
    return intersects;
  }

  getScreenPositionFromVector(vector) {
    _v.copy(vector);
    _v.project(this.camera);

    return {
      x: (_v.x * window.innerWidth / 2) + window.innerWidth / 2,
      y: -(_v.y * window.innerHeight / 2) + window.innerHeight / 2
    };
  }

  getScreenPositionFromObject(object) {
    _v.setFromMatrixPosition(object.matrixWorld);
    return this.getScreenPositionFromVector(_v);
  }

  updateCoords(e) {
    this.pointViewport.set(
      ((e.clientX - this.canvas.offsetLeft) / window.innerWidth) * 2 - 1,
      -((e.clientY - this.canvas.offsetTop) / window.innerHeight) * 2 + 1
    );
  }

  onPointerDown = e => {
    // Cancel event if no object is attached
    if (this.object === undefined) return;

    // Update pointer down state
    this.pointDown.set(e.clientX, e.clientY);
    this.pointPressed = true;
    this.pointSnapped = true;

    // Update pointer event object
    _eventPointerDown.button = e.button;
    _eventPointerDown.buttons = e.buttons;
    _eventPointerDown.clientX = e.clientX;
    _eventPointerDown.clientY = e.clientY;
    _eventPointerDown.intersects = this.getIntersects(e);
    _eventPointerDown.pointerType = e.pointerType;
    _eventPointerDown.pressed = this.pointPressed;
    _eventPointerDown.snapped = this.pointSnapped;
    this.dispatchEvent(_eventPointerDown);
  }
  
  onPointerMove = e => {
    // Cancel event if no object is attached
    if (this.object === undefined) return;

    // Update pointer move state
    this.pointMove.set(e.clientX, e.clientY);
    this.pointSnapped = this.isSnapped();

    // Update pointer move event before dispatching
    _eventPointerMove.button = e.button;
    _eventPointerMove.buttons = e.buttons;
    _eventPointerMove.clientX = e.clientX;
    _eventPointerMove.clientY = e.clientY;
    _eventPointerMove.intersects = this.getIntersects(e);
    _eventPointerMove.pointerType = e.pointerType;
    _eventPointerMove.pressed = this.pointPressed;
    _eventPointerMove.snapped = this.pointSnapped;
    this.dispatchEvent(_eventPointerMove);
  }
  
  onPointerUp = e => {
    // Cancel event if no object is attached
    if (this.object === undefined) return;

    // Update pointer up state
    this.pointPressed = false;
    this.pointUp.set(e.clientX, e.clientY);

    // Update pointer up event before dispatching
    _eventPointerUp.button = e.button;
    _eventPointerUp.buttons = e.buttons;
    _eventPointerUp.clientX = e.clientX;
    _eventPointerUp.clientY = e.clientY;
    _eventPointerUp.intersects = this.getIntersects(e);
    _eventPointerUp.pointerType = e.pointerType;
    _eventPointerUp.pressed = this.pointPressed;
    _eventPointerUp.snapped = this.pointSnapped;
    this.dispatchEvent(_eventPointerUp);
  }

  isSnapped() {
    const length = this.pointDown.distanceTo(this.pointMove);
    return length <= this.pointRange && this.pointSnapped;
  }
}

export { Selector };