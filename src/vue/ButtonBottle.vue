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
    :class="[state, { 'tooltip-visible': tooltipVisible }]"
    class="button-bottle"
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
    <div class="button-bottle-container">
      <div class="button-bottle-container__body">
        <slot></slot>
      </div>
      <div class="button-bottle-container__neck"></div>
      <div class="button-bottle-container__cap"></div>
    </div>
  </button>
</template>

<style lang="scss" scoped>
  .button-bottle {
    --color-cork-1: #FFB474;
    --color-cork-2: #E16642;
    --color-glass-1: var(--color-blue-light-1);
    --color-glass-2: var(--color-blue-light-2);
    --color-gradient-1: var(--color-blue-1);
    --color-gradient-2: var(--color-blue-2);
    --border-width: 0.125em;
    --border-radius: 0.5em;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    font-size: 1em;

    &:focus-visible,
    &.hover,
    &.active {
        .button-bottle-container {
        transform: translate(-0.5em, 0);

        .button-bottle-container__cap {
          transform: translate(100%, -50%) rotate(-45deg);
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

    &:disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .button-bottle-container {
      align-items: center;
      display: flex;
      transition: transform 0.1s ease-out;
  
      .button-bottle-container__body {
        align-items: center;
        background:
          linear-gradient(to bottom, var(--color-gradient-1), var(--color-gradient-2)) padding-box,
          linear-gradient(to bottom, var(--color-glass-2), var(--color-glass-1)) border-box;
        border: var(--border-width) solid transparent;
        border-radius: var(--border-radius);
        color: #ffffff;
        display: flex;
        flex-shrink: 0;
        gap: 0.25em;
        justify-content: center;
        line-height: 1em;
        padding: 0.5em 1em;
        text-shadow: 0 0.125em 0 #000000;
      }
  
      .button-bottle-container__neck {
        background:
          linear-gradient(to bottom, var(--color-gradient-1), var(--color-gradient-2)) padding-box,
          linear-gradient(to bottom, var(--color-glass-2), var(--color-glass-1)) border-box;
        border: var(--border-width) solid transparent;
        border-left: none;
        border-radius: var(--border-width);
        display: block;
        height: 1.25em;
        margin-left: -0.125em;
        width: 0.5em;
      }
      
      .button-bottle-container__cap {
        background:
          linear-gradient(to bottom, var(--color-cork-1), var(--color-cork-2)) padding-box,
          linear-gradient(to bottom, var(--color-cork-2), var(--color-cork-1)) border-box;
        border: var(--border-width) solid transparent;
        border-left: none;
        border-radius: var(--border-width);
        display: block;
        height: 1em;
        margin-left: -0.125em;
        transition: transform 0.1s ease-out;
        width: 0.5em;
      }
    }
  }
</style>