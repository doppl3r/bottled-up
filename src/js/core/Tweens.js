import { Easing, Group, Tween } from '@tweenjs/tween.js'

// This class utilizes tween.js within /libraries
class Tweens {
  constructor() {
    this.group = new Group();
  }

  update() {
    this.group.update();
  }

  tween(options) {
    // Set default behavior
    options = Object.assign({
      delay: 0,
      duration: 1000,
      dynamic: false,
      easing: 'Quadratic.InOut',
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
      .onStart(options.onStart)
      .onUpdate(options.onUpdate)
      .onComplete(() => {
        // Call onComplete callback before removing tween
        options.onComplete?.();
        this.group.remove(tween);
      });

    // Start animation immediately
    if (options.start === true) tween.start();

    // Return active tween
    return tween;
  }
}

export { Tweens };