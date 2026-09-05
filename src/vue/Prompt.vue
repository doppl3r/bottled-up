<script setup>

</script>

<template>
  <div class="prompt">
    <div class="prompt-container">
      <div class="prompt-container__cap"></div>
      <div class="prompt-container__neck"></div>
      <div class="prompt-container__body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .prompt {
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
    padding: 0;
    font-family: inherit;
    font-size: 1em;
    transition: opacity 0.1s ease-out;

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

    &[disabled] {
      opacity: 0.25;
    }

    .prompt-container {
      align-items: center;
      display: flex;
      flex-direction: column;
      transition: transform 0.1s ease-out;

      .prompt-container__cap {
        background:
          linear-gradient(to bottom, var(--color-cork-1), var(--color-cork-2)) padding-box,
          linear-gradient(to bottom, var(--color-cork-2), var(--color-cork-1)) border-box;
        border: var(--border-width) solid transparent;
        border-bottom: none;
        border-radius: var(--border-width);
        display: block;
        height: 0.5em;
        margin-bottom: -0.125em;
        position: relative;
        transition: transform 0.1s ease-out;
        width: 0.75em;
        z-index: 1;
      }
  
      .prompt-container__neck {
        background:
          linear-gradient(to bottom, var(--color-gradient-1), var(--color-gradient-2)) padding-box,
          linear-gradient(to bottom, var(--color-glass-2), var(--color-glass-1)) border-box;
        border: var(--border-width) solid transparent;
        border-bottom: none;
        border-radius: var(--border-width);
        display: block;
        height: 0.5em;
        margin-bottom: -0.125em;
        position: relative;
        width: 1em;
        z-index: 1;
      }

      .prompt-container__body {
        align-items: center;
        background:
          linear-gradient(to bottom, var(--color-gradient-1), var(--color-gradient-2)) padding-box,
          linear-gradient(to bottom, var(--color-glass-2), var(--color-glass-1)) border-box;
        border: var(--border-width) solid transparent;
        border-radius: 99em;
        color: #ffffff;
        display: flex;
        flex-shrink: 0;
        gap: 0.25em;
        justify-content: center;
        line-height: 1em;
        min-height: 1.5em;
        min-width: 1.5em;
        padding: 0.25em 0.5em;
        position: relative;
        text-shadow: 0 0.125em 0 #000000;
        z-index: 0;
      }
    }
  }
</style>