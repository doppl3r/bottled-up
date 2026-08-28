<script setup>
  import { onBeforeUnmount, ref } from 'vue';

  // Define custom props and events
  const emits = defineEmits(['click-repeat']);
  const props = defineProps({
    rate: {
      type: Number,
      default: 250 // ms
    }
  });

  // Button state management
  const state = ref('');
  const stateInterval = ref(null);
  const buttonElement = ref(null);
  const tooltipVisible = ref(false);

  // Expose button element to parent
  defineExpose({ el: buttonElement });

  const onPress = event => {
    // Set active state
    if (event.repeat) return;
    state.value = 'active';
    showTooltipOnTouch(event);
    startRepeat(event);
  };

  const onRelease = () => {
    hideTooltip();
    stopRepeat();
  }

  const onBlur = () => {
    hideTooltip();
    state.value = '';
  }

  const onEnter = () => {
    state.value = 'hover';
  };

  const onLeave = event => {
    hideTooltip();

    if (event.pointerType === 'mouse') {
      state.value = '';
      stopRepeat();
    }
  };

  const showTooltipOnTouch = event => {
    if (event.pointerType !== 'touch') return;
    tooltipVisible.value = true;
  };

  const hideTooltip = () => {
    tooltipVisible.value = false;
  };
  
  const startRepeat = event => {
    if (stateInterval.value) return;
    emits('click-repeat', event);
    stateInterval.value = setInterval(() => emits('click-repeat', event), props.rate);
  };

  const stopRepeat = () => {
    if (stateInterval.value) {
      clearInterval(stateInterval.value);
      stateInterval.value = null;
    }
  };

  onBeforeUnmount(() => {
    stopRepeat();
  });
</script>

<template>
  <button
    ref="buttonElement"
    class="game-button"
    :class="[state, { 'tooltip-visible': tooltipVisible }]"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @pointerdown="onPress"
    @keydown.enter.space="onPress"
    @keyup.enter.space="onRelease"
    @pointerup="onRelease"
    @touchend="onRelease"
    @touchcancel="onRelease"
    @blur="onBlur"
  >
    <slot name="default"></slot>
    <div class="tooltip" v-if="$slots.tooltip">
      <slot name="tooltip"></slot>
    </div>
  </button>
</template>

<style lang="scss" scoped>
  .game-button {
    --color-cork-1: #FFB474;
    --color-cork-2: #E16642;
    --color-glass-1: var(--color-blue-light-1);
    --color-glass-2: var(--color-blue-light-2);
    --color-gradient-1: var(--color-blue-1);
    --color-gradient-2: var(--color-blue-2);
    --border-width: 0.125em;
    --border-radius: 0.5em;

    align-items: center;
    background:
      linear-gradient(to bottom, var(--color-gradient-1), var(--color-gradient-2)) padding-box,
      linear-gradient(to bottom, var(--color-glass-2), var(--color-glass-1)) border-box;
    border: var(--border-width) solid transparent;
    border-radius: var(--border-radius);
    color: #ffffff;
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    font-size: 1em;
    font-family: inherit;
    gap: 0.25em;
    justify-content: center;
    line-height: 1em;
    padding: 0.5em 1em;
    position: relative;
    text-shadow: 0 0.125em 0 #000000;

    // Bottle neck
    &:before {
      background: inherit;
      border: inherit;
      border-left: none;
      border-radius: var(--border-width);
      content: '';
      display: block;
      height: 50%;
      right: calc(-0.75em + var(--border-width));
      position: absolute;
      top: 50%;
      transform: translate(0%, -50%);
      width: 0.5em;
    }

    // Bottle cap
    &:after {
      background:
        linear-gradient(to bottom, var(--color-cork-1), var(--color-cork-2)) padding-box,
        linear-gradient(to bottom, var(--color-cork-2), var(--color-cork-1)) border-box;
      border: var(--border-width) solid transparent;
      border-left: none;
      border-radius: var(--border-width);
      content: '';
      display: block;
      height: 40%;
      right: calc(-1.25em + var(--border-width));
      position: absolute;
      top: 50%;
      transform: translate(0%, -50%);
      transform-origin: 50% 50%;
      transition: transform 0.1s ease-in-out;
      width: 0.5em;
    }

    &:focus-visible,
    &.hover,
    &.active {
      &:after {
        transform: translate(100%, -100%) rotate(-45deg);
      }

      .tooltip {
        @media (hover: hover) and (pointer: fine) {
          visibility: visible;
        }
      }
    }

    &.green {
      --color-gradient-1: var(--color-green-1);
      --color-gradient-2: var(--color-green-2);
      --color-glass-1: var(--color-green-light-1);
      --color-glass-2: var(--color-green-light-2);
    }

    &.pink {
      --color-gradient-1: var(--color-pink-1);
      --color-gradient-2: var(--color-pink-2);
      --color-glass-1: var(--color-pink-light-1);
      --color-glass-2: var(--color-pink-light-2);
    }

    &.red {
      --color-gradient-1: var(--color-red-1);
      --color-gradient-2: var(--color-red-2);
      --color-glass-1: var(--color-red-light-1);
      --color-glass-2: var(--color-red-light-2);
    }

    &.tooltip-visible .tooltip {
      visibility: visible;
    }

    &:disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .tooltip {
      align-items: center;
      background-color: inherit;
      bottom: calc(100% + var(--border-width));
      display: flex;
      gap: 0.25em;
      left: 50%;
      padding: 0.25em;
      pointer-events: none;
      position: absolute;
      transform: translate(-50%, 0);
      visibility: hidden;
    }
  }
</style>