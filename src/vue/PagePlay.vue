<script setup>
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Game } from '../js/Game.js';
  import ProgressBar from './ProgressBar.vue';

  // Initialize Vue components
  const i18n = useI18n();
  const canvas = ref();
  const progress = ref({ url: '', itemsLoaded: 0, itemsTotal: 0 });

  // Initialize game
  let game = window.game = new Game();
  game.init();
  game.core.assets.addEventListener('onProgress', e => progress.value = e);

  // Initialize app after canvas has been mounted
  onMounted(() => {
    // Replace canvas element
    canvas.value.replaceWith(game.core.canvas);
  });

  onUnmounted(() => {
    
  });
</script>

<template>
  <div>
    <!-- Core canvas -->
    <canvas ref="canvas"></canvas>

    <!-- Floating menus -->
    <div class="game-ui">
      <!-- Loading bar -->
      <ProgressBar :progress="progress" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  
</style>