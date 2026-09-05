import { Easing, Group, Tween } from '@tweenjs/tween.js'

// This class utilizes tween.js within /libraries
class Tweens {
  constructor() {
    this.group = new Group();

    // Virtual clock (ms) so tweens respect Interval's speed scaling instead of wall-clock time
    this.time = 0;
  }

  update(delta = 0) {
    this.time += delta;
    this.group.update(this.time);
  }

  tween(options) {
    // Set default behavior
    options = Object.assign({
      delay: 0,
      duration: 1000,
      dynamic: false,
      easing: 'Quadratic.InOut',
      yoyo: false,
      repeat: 0,
      start: true
    }, options);

    // Convert Easing string value into function
    options.easing = options.easing.split('.').reduce((obj, key) => obj[key], Easing);

    // Create and assign tween to tween group
    const tween = new Tween(options.object, this.group)
      .to(options.to, options.duration)
      .delay(options.delay)
      .dynamic(options.dynamic)
      .easing(options.easing)
      .interpolation(options.interpolation)
      .repeat(options.repeat)
      .yoyo(options.yoyo)
      .onStart(options.onStart)
      .onEveryStart(options.onEveryStart)
      .onStop(options.onStop)
      .onUpdate(options.onUpdate)
      .onRepeat(options.onRepeat)
      .onComplete(() => {
        // Call onComplete callback before removing tween
        options.onComplete?.();
        this.group.remove(tween);
      });

    // Start animation immediately, using the group's virtual clock as the time origin
    if (options.start === true) tween.start(this.time);

    // Return active tween
    return tween;
  }

  remove(tween) {
    this.group.remove(tween);
  }

  removeAll() {
    this.group.removeAll();
  }
}

export { Tweens };