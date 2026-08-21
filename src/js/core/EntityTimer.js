import { Entity } from './Entity.js';

/*
  EntityTimer dispatches an event at set time delay.
*/

class EntityTimer extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Define properties
    this.delay = options.delay;
    this.elapsed = 0;
    
    // Update entity state
    this.isReady = true;
  }

  update(loop) {
    // Update elapsed time by determined loop delay
    this.elapsed += loop.delay;

    // Dispatch event if enough time has passed
    if (this.elapsed >= this.delay) {
      this.dispatchEvent({ type: 'tick' });
      this.elapsed %= this.delay;
    }
  }

  static template = {
    delay: 1000
  }
}

export { EntityTimer };