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

  init(options, core) {
    // Stash core here; parent isn't assigned yet until the 'added' event fires
    this.core = core;

    // Perform base entity init
    super.init(options, core);
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
      paused: false,
      time: 0,
      warp: false
    }, options);
    
    const action = this.actions[name];

    // Ignore missing actions or a request to replay the already-active one
    if (!action) return;

    // Loop mode is decided per-play so different clips (ex: idle vs jump) can differ
    action.setLoop(options.loop ? LoopRepeat : LoopOnce, Infinity);
    action.clampWhenFinished = !options.loop;
    action.reset().setEffectiveWeight(1);
    action.paused = options.paused;
    action.time = options.time;

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

  scrub(progress) {
    // Hide whatever was previously showing without touching its loop/time state
    if (!this.activeAction) return;
    
    // Freeze this action on an exact pose (ex: 0.5 = halfway through the clip)
    this.activeAction.paused = true;
    this.activeAction.enabled = true;
    this.activeAction.setEffectiveWeight(1);
    this.activeAction.time = progress * this.activeAction.getClip().duration;
  }

  createActions(model) {
    model.animations?.forEach((clip, index) => {
      // Create and assign action
      const action = this.mixer.clipAction(clip);
      this.actions[clip.name] = action;

      // Arm every clip at weight 0
      action.setEffectiveWeight(0);
      action.play();

      // Set active action to the first action
      if (index === 0) this.activeAction = action;
    });
  }

  onAdded = event => {
    // Initialize AnimationMixer with parent entity
    this.mixer = new AnimationMixer(this.parent);

    // Reuse the parent EntityModel's (cached) asset to source animation clips
    this.core.assets.load(this.parent.url, model => this.createActions(model));
  }
}

export { EntityMixer };