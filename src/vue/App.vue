<script setup>
  import '../scss/Global.scss';
  import 'overlayscrollbars/overlayscrollbars.css';

  import { onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Game } from '../js/Game.js';
  import ProgressBar from './ProgressBar.vue';
  import ButtonBottle from './ButtonBottle.vue';

  // Initialize Vue components
  const i18n = useI18n();
  const progress = ref({ url: '', itemsLoaded: 0, itemsTotal: 0 });
  
  // Initialize game
  const gameRef = ref();
  const game = window.game = new Game();
  game.load();

  const pauseGame = () => {
    game.core.stop();
    game.state.menuPaused = true;
  };

  const resumeGame = () => {
    game.core.start();
    game.state.menuPaused = false;

    Promise.resolve(game.core.canvas.requestPointerLock({ unadjustedMovement: true })).catch(error => {
      // If pointer lock fails, resume game after a short delay
      setTimeout(() => resumeGame(), 100);
    });
  };

  // Handle pointer lock change events
  const onPointerLockChange = event => {
    if (document.pointerLockElement !== game.core.canvas) {
      pauseGame();
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
      <div class="menu-pause__overlay"></div>
      <div class="menu-pause__wrapper">
        <div class="menu-pause__logo">
          <img :src="'svg/logo.svg'" />
        </div>
        <div class="menu-pause__actions">
          <ButtonBottle class="pink">Settings</ButtonBottle>
          <ButtonBottle @click="resumeGame">Resume</ButtonBottle>
        </div>
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
    pointer-events: none;

    .menu-pause__overlay {
      background-color: rgba(0, 0, 0, 0.5);
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }

    .menu-pause__wrapper {
      align-items: center;
      display: flex;
      flex-direction: column;
      gap: 2em;
      padding: 1em;
      position: relative;

      .menu-pause__logo {
        img {
          height: 4em;
          width: auto;
        }
      }

      .menu-pause__actions {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 0.5em;

        :deep(.button-bottle) {
          width: 100%;
          pointer-events: all;
        }
      }
    }
  }
</style>