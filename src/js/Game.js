import { reactive } from 'vue';
import { Core } from './core/Core.js';
import { Record } from './core/Record.js';
import { EntityClasses } from './EntityClasses.js';
import { EntityTemplates } from './EntityTemplates.js'
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

/*
  The Game class serves as the main entry point for the application,
  initializing the core engine and setting up the game environment.
*/

const stateStorage = {
  fullscreen: true,
  checkpoint: {
    position: { x: 0, y: 0, z: 0 },
  }
}

const stateSession = {
  
}

class Game {
  constructor() {
    // Initialize game components
    this.core = new Core();
    this.core.entityManager.registerEntityClasses(EntityClasses);
    this.core.entityManager.registerEntityTemplates(EntityTemplates);
    this.record = new Record('boxel-4d', stateStorage);
    this.visible = true;
  }

  init() {
    // Initialization core settings
    this.core.entityManager.debug(false);
    this.core.interval.speed = 1;
    this.core.interval.loops[0].delay = 1000 / 60;
    this.core.entityManager.world.timestep = 1 / 60;
    this.core.entityManager.world.gravity.y = -9.81 * 4;
    this.core.entityManager.world.numSolverIterations = 4;
    this.core.scene.background.set('#1f1f1f');
    this.core.camera.position.set(0, 2, 10);

    // Reactive game state (persisted defaults + UI-only keys)
    this.state = reactive({
      ...stateStorage,
      ...stateSession,
    });

    // Load level then start the game
    this.core.entityManager.load('json/dungeon.json', () => {
      this.core.compositor.resize();
      this.core.start();
    });

    // Setup event listeners
    this.addEventListeners();
  }

  addEventListeners() {
    // Add keyboard event listener
    document.addEventListener('keydown', this.onKeyDown);

    // Sync fullscreen state when exiting via Escape or browser controls
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  onKeyDown = event => {
    if (event.code === 'F11') {
      event.preventDefault();
      this.toggleFullscreen();
    }
    else if (event.code === 'KeyC') {
      this.saveCheckpoint();
    }
    else if (event.code === 'KeyR') {
      this.restoreCheckpoint();
    }
  }

  saveCheckpoint() {
    const player = this.core.scene.getObjectByName('player');
    const position = player.position.clone();
    this.state.checkpoint.position = position;
    this.record.save('checkpoint', { position });
  }

  restoreCheckpoint() {
    const player = this.core.scene.getObjectByName('player');
    const physics = player.getObjectByProperty('class', 'EntityPhysics');
    const checkpoint = this.record.load('checkpoint');
    physics.setPosition(checkpoint.position);
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