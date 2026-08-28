<script setup>
  import '../scss/Global.scss';
  import 'overlayscrollbars/overlayscrollbars.css';

  import { onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Game } from '../js/Game.js';
  import ProgressBar from './ProgressBar.vue';
  import GameButton from './GameButton.vue';

  // Initialize Vue components
  const i18n = useI18n();
  const progress = ref({ url: '', itemsLoaded: 0, itemsTotal: 0 });
  
  // Initialize game
  const gameRef = ref();
  const game = window.game = new Game();
  game.load();

  const resumeGame = () => {
    game.state.menuPaused = false;

    Promise.resolve(game.core.canvas.requestPointerLock({ unadjustedMovement: true })).catch(error => {
      // If pointer lock fails, resume game after a short delay
      setTimeout(() => resumeGame(), 100);
    });
  };

  // Handle pointer lock change events
  const onPointerLockChange = event => {
    if (document.pointerLockElement === game.core.canvas) {
      game.state.menuPaused = false;
    }
    else {
      game.state.menuPaused = true;
    }
  };

  // Add event listeners for game events
  game.core.assets.addEventListener('onProgress', e => progress.value = e);
  document.addEventListener('pointerlockchange', onPointerLockChange);

  // Initialize app after canvas has been mounted
  onMounted(() => {
    // Replace Vue canvas element
    gameRef.value.prepend(game.core.compositor.effectComposer.renderer.domElement);
    gameRef.value.prepend(game.core.compositor.rendererCSS.domElement);
  });

  onUnmounted(() => {
    
  });
</script>

<template>
  <!-- Floating menus -->
  <div class="game" ref="gameRef">
    <div class="menu-pause" v-if="game.state.menuPaused === true">
      <div class="menu-pause__overlay" @click="resumeGame"></div>
      <div class="menu-pause__wrapper">
        <GameButton class="pink">Settings</GameButton>
        <GameButton @click="resumeGame">Resume</GameButton>
      </div>
    </div>

    <!-- Loading bar -->
    <ProgressBar :progress="progress" />
  </div>
</template>

<style lang="scss" scoped>
  .menu-pause {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;

    .menu-pause__overlay {
      background-color: rgba(0, 0, 0, 0.5);
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }

    .menu-pause__wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      padding: 1em;
      position: relative;
    }
  }
</style>