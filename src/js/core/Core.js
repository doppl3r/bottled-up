import { Color, EventDispatcher, Fog, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { Assets } from './Assets.js';
import { Audio } from './Audio.js';
import { Compositor } from './Compositor.js';
import { Interval } from './Interval.js';
import { Selector } from './Selector.js';
import { EntityManager } from './EntityManager.js';

/*
  The Core class serves as the central engine for the core application,
  coordinating assets, the core loop, graphics rendering, and entity management.
*/

// Initialize module-scoped variables
const _eventBeforeUpdate = { type: 'beforeUpdate', loop: null };
const _eventBeforeRender = { type: 'beforeRender', loop: null };
const _eventUpdated = { type: 'updated', loop: null };
const _eventRendered = { type: 'rendered', loop: null };

class Core extends EventDispatcher {
  constructor() {
    // Inherit Three.js EventDispatcher system
    super();

    // Initialize visual components
    this.canvas = document.createElement('canvas');
    this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
    this.scene = new Scene();
    this.scene.fog = new Fog('#ffffff');
    this.scene.background = new Color('#000000');
    this.selector = new Selector(this.camera, this.canvas);
    this.renderer = new WebGLRenderer({ alpha: true, canvas: this.canvas });
    this.compositor = new Compositor(this.scene, this.camera, this.renderer);
    
    // Initialize core components
    this.assets = new Assets();
    this.audio = new Audio(this.assets);
    this.entityManager = new EntityManager(this);
    
    // Setup main loops
    this.interval = new Interval();
    this.interval.add(loop => this.update(loop), 1000 / 60);
    this.interval.add(loop => this.render(loop));
    _eventBeforeUpdate.loop = this.interval.loops[0];
    _eventBeforeRender.loop = this.interval.loops[1];
    _eventUpdated.loop = this.interval.loops[0];
    _eventRendered.loop = this.interval.loops[1];
  }

  update(loop) {
    // Dispatch event before updating entities
    this.dispatchEvent(_eventBeforeUpdate);

    // Update all entities
    this.entityManager.update(loop);

    // Dispatch final updated event
    this.dispatchEvent(_eventUpdated);
  }

  render(loop) {
    // Dispatch event before rendering
    this.dispatchEvent(_eventBeforeRender);
    
    // Update component visual states before rendering
    this.entityManager.render(loop);
    this.compositor.render();
    
    // Dispatch final rendered event
    this.dispatchEvent(_eventRendered);
  }

  start() {
    if (this.interval.paused === false) return;
    this.interval.start();
  }

  pause() {
    this.interval.stop();
  }

  resume() {
    this.interval.start();
  }

  stop() {
    this.interval.stop();
  }
}

export { Core }