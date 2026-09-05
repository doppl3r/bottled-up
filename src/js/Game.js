import { reactive } from 'vue';
import { Core } from './core/Core.js';
import { Record } from './core/Record.js';
import { EntityClasses } from './EntityClasses.js';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

/*
  The Game class serves as the main entry point for the application,
  initializing the core engine and setting up the game environment.
*/

const stateStorage = {
  fullscreen: true,
  checkpoint: {
    position: { x: 0, y: 0.25, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  }
}

const stateSession = {
  menuPaused: true
}

class Game {
  constructor() {
    // Initialize game components
    this.core = new Core();
    this.core.entityManager.registerEntityClasses(EntityClasses);
    this.record = new Record('bottled-up', stateStorage);
    this.visible = true;
  }

  load() {
    // Initialization core settings
    this.core.entityManager.debug(false);
    this.core.interval.speed = 1;
    this.core.interval.loops[0].delay = 1000 / 60;
    this.core.entityManager.world.timestep = 1 / 60;
    this.core.entityManager.world.gravity.y = -9.81 * 4;
    this.core.entityManager.world.numSolverIterations = 4;
    this.core.scene.background.set('#1f1f1f');
    this.core.camera.position.set(0, 2, 8);

    // Reactive game state (persisted defaults + UI-only keys)
    this.state = reactive({
      ...stateStorage,
      ...stateSession,
    });

    // Load scene from GLB model
    this.core.assets.load('glb/forge-1.glb', model => {
      // Loop through scene
      const json = this.core.entityManager.convertModelToJSON(model);

      // Load level from JSON data
      this.core.entityManager.load(json, () => {
        this.core.render(this.core.interval.loops[1]);
        this.saveCheckpoint();
      });
    });

    // Setup event listeners
    this.addEventListeners();
  }

  pause() {
    this.core.stop();
    this.state.menuPaused = true;
  }

  async resume() {
    // Calculate pause time difference
    const delay = 1500;
    const nowTimestamp = performance.now();
    const pausedTimestamp = this.pointerLockTimestamp;
    const diffTimestamp = nowTimestamp - pausedTimestamp;

    // Defer resume until after the delay has passed
    if (diffTimestamp < delay) {
      setTimeout(() => this.resume(), delay - diffTimestamp);
    }
    else {
      // Request pointer lock
      try {
        this.core.start();
        this.state.menuPaused = false;
        await this.core.canvas.requestPointerLock({ unadjustedMovement: true });
      }
      catch (error) {
        console.error(error);
      }
    }
  }

  addEventListeners() {
    // Add document event listeners
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('fullscreenchange', this.onFullscreenChange);

    // Add resize listener
    this.core.compositor.addEventListener('resize', this.onResize);
  }

  onPointerLockChange = event => {
    // Pause game if pointer lock is exited
    if (document.pointerLockElement !== this.core.canvas) {
      this.pause();
      this.pointerLockTimestamp = performance.now();
    }
  };

  onResize = () => {
    this.core.render(this.core.interval.loops[1]);
  }

  onKeyDown = event => {
    if (event.code === 'F11') {
      event.preventDefault();
      this.toggleFullscreen();
    }
    else if (event.code === 'KeyR') {
      this.restoreCheckpoint();
    }
    else if (event.code === 'Escape') {
      this.pause();
    }
  }

  saveCheckpoint() {
    const player = this.core.scene.getObjectByProperty('class', 'EntityPlayer');
    const physics = player.get('EntityPhysics');
    const position = physics.getPosition();
    const rotation = physics.getRotation();
    this.record.save('checkpoint', { position, rotation });
  }

  restoreCheckpoint() {
    const player = this.core.scene.getObjectByProperty('class', 'EntityPlayer');
    const physics = player.get('EntityPhysics');
    const checkpoint = this.record.load('checkpoint');
    if (checkpoint) {
      physics.rigidBody.setLinvel({ x: 0, y: 0, z: 0 });
      physics.rigidBody.setAngvel({ x: 0, y: 0, z: 0 });
      physics.setPosition(checkpoint.position);
      physics.setRotation(checkpoint.rotation);
    }
  }

  onFullscreenChange = () => {
    const isFullscreen = !!document.fullscreenElement;
    this.state.fullScreen = isFullscreen;
    this.record.save('fullscreen', isFullscreen);
  }

  toggleFullscreen() {
    const next = !this.state.fullScreen;
    this.setWindowFullScreen(next);
    this.state.fullScreen = next;
    this.record.save('fullscreen', next);
  }

  setWindowFullScreen(enabled) {
    if (isTauri()) {
      return getCurrentWindow().setFullscreen(enabled);
    }
    else if (this.isExtension()) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
      window.close();
      return Promise.resolve();
    }
    else {
      if (enabled) return document.documentElement.requestFullscreen();
      if (document.fullscreenElement) return document.exitFullscreen();
      return Promise.resolve();
    }
  }

  isExtension() {
    return !!window.chrome?.runtime?.id && window.location.protocol === 'chrome-extension:';
  }
}

export { Game };