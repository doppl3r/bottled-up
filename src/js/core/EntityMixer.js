import { AnimationMixer, LoopOnce, LoopRepeat } from 'three';
import { Entity } from './Entity.js';

/*
  EntityMixer is a specialized entity that manages animation actions
  for a sibling model loaded by its parent EntityModel.
*/

class EntityMixer extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityMixer',
    }, options);

    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.mixer;
    this.actions = {};
    this.activeAction;

    // Add event listeners
    this.addEventListener('added', this.onAdded);
  }

  render(loop) {
    this.mixer?.update(loop.delta / 1000);

    // Perform base entity render
    super.render(loop);
  }

  play(name, options = {}) {
    // Assign default options
    options = Object.assign({
      duration: 1,
      loop: false,
      warp: false
    }, options);
    
    const action = this.actions[name];

    // Ignore missing actions or a request to replay the already-active one
    if (!action || action === this.activeAction) return;

    // Loop mode is decided per-play so different clips (ex: idle vs jump) can differ
    action.setLoop(options.loop ? LoopRepeat : LoopOnce, Infinity);
    action.clampWhenFinished = !options.loop;
    action.reset().setEffectiveWeight(1);

    // Cross fade from the previous action, or fade in if nothing was playing
    if (this.activeAction) {
      action.crossFadeFrom(this.activeAction, options.duration, options.warp);
    }
    else {
      action.fadeIn(options.duration);
    }

    // Play action and assign it as the active action
    action.play();
    this.activeAction = action;
  }

  createActions(model) {
    model.animations?.forEach(clip => {
      const action = this.mixer.clipAction(clip);
      action.setEffectiveWeight(0);
      action.play(); // Keep ticking so play() can crossfade purely via weight
      this.actions[clip.name] = action;
    });
  }

  init(options, core) {
    // Stash core here; parent isn't assigned yet until the 'added' event fires
    this.core = core;

    // Perform base entity init
    super.init(options, core);
  }

  onAdded = event => {
    // Initialize AnimationMixer with parent entity
    this.mixer = new AnimationMixer(this.parent);

    // Reuse the parent EntityModel's (cached) asset to source animation clips
    this.core.assets.load(this.parent.url, model => this.createActions(model));
  }
}

export { EntityMixer };