<script setup>
  import '../scss/Global.scss';
  import 'overlayscrollbars/overlayscrollbars.css';

  import { onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Game } from '../js/Game.js';
  import ProgressBar from './ProgressBar.vue';

  // Initialize Vue components
  const i18n = useI18n();
  const progress = ref({ url: '', itemsLoaded: 0, itemsTotal: 0 });
  
  // Initialize game
  const gameRef = ref();
  const game = window.game = new Game();
  game.init();
  game.core.assets.addEventListener('onProgress', e => progress.value = e);

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
    <!-- Loading bar -->
    <ProgressBar :progress="progress" />
  </div>
</template>

<style lang="scss" scoped>

</style>