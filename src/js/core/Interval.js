/*
  Executes synchronous functions at a recurring frequency. The first
  or "base" loop determines the shared alpha value for all sibling functions.

  Tip: Add your physics loop first (ex: 1000ms / 30fps = ~33ms), then add the
  rendering loop without any delay. Use the alpha value to interpolate
  rendered objects during your physics engine delay.
*/

class Interval {
  constructor() {
    this.loops = [];
    this.speed = 1;
    this.thread = timestamp => this.update(timestamp);
    this.threadTimestamp = 0;
    this.threadFrame = 0;
    this.paused = true;
  }

  add(callback, delay = -1) {
    // Create a loop with a callback and delay (milliseconds)
    return this.loops.push({
      alpha: 0,
      callback,
      delay,
      delta: 0,
      frame: 0,
      paused: false,
      sum: 0,
      timestamp: 0
    });
  }

  get(i) {
    return this.loops[i];
  }

  remove(i) {
    return this.loops.splice(i, 1);
  }

  start() {
    // Only start if thread is paused
    if (this.paused === true) {
      this.paused = false;

      // Set initial timestamps before starting thread
      this.threadFrame = requestAnimationFrame(timestamp => {
        this.threadTimestamp = timestamp;
        this.loops.forEach(loop => loop.timestamp = timestamp);
        this.thread(timestamp);
      });
    }
  }

  stop() {
    this.paused = true;
  }

  pause(i) {
    this.loops[i].paused = true;
  }

  resume(i) {
    this.loops[i].paused = false;
  }

  update(timestamp) {
    // Cancel the interval thread
    if (this.paused === true) return;

    // Rerun thread on next repaint
    this.threadFrame = requestAnimationFrame(this.thread);

    // Set thread delta from thread timestamp
    const threadDelta = timestamp - this.threadTimestamp;
    const maxDelta = this.loops[0].delay;
    const cappedDelta = Math.min(threadDelta, maxDelta);
    this.threadTimestamp = timestamp;

    // Loop through array of loops
    for (let i = 0; i < this.loops.length; i++) {
      const loop = this.loops[i];

      // Skip paused loops.
      if (loop.paused === false) {
        let stepCount = 1;
        loop.delta = cappedDelta * this.speed;

        // Fixed-delay loops catch up once for every elapsed simulation step.
        if (loop.delay > 0) {
          loop.sum += cappedDelta * this.speed;
          stepCount = Math.floor(loop.sum / loop.delay);
          loop.delta = loop.delay;
        }

        // Execute the loop callback for each simulation step that has elapsed.
        for (let step = 0; step < stepCount; step++) {
          if (loop.delay > 0) loop.sum -= loop.delay;
          loop.alpha = this.loops[0].sum / this.loops[0].delay;
          loop.fps = 1000 / loop.delta;
          loop.frame++;
          loop.timestamp = timestamp;
          loop.callback(loop);
        }
      }
    }
  }
}

export { Interval };