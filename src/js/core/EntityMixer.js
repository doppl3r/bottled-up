import { AnimationMixer, LoopOnce, LoopRepeat } from 'three';
import { Entity } from './Entity.js';

/*
  EntityMixer is a specialized entity that manages animation actions
  for a sibling model loaded by its parent EntityModel.
*/

class EntityMixer extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Declare entity components
    this.mixer;
    this.actions = {};
    this.activeAction;

    // Store options for later
    this.options = options;
    this.core = core;
    
    // Add event listeners
    this.addEventListener('added', this.onAdded);

    // Update entity state
    this.ready();
  }

  render(loop) {
    this.mixer?.update(loop.delta / 1000);

    // Perform base entity render
    super.render(loop);
  }

  play(name, options = {}) {
    // Get reference to predefined actions
    const actions = this.options.actions;
    const actionOptions = actions?.[name] ?? {};

    // Assign default options
    options = Object.assign({
      onComplete: () => {},
      crossFadeDuration: 0,
      crossFadeWarp: false,
      loop: false,
      paused: false,
      time: 0,
    }, actionOptions, options);
    
    // Get reference to the action to play
    const action = this.actions[name];

    // Prevent playing the same action
    if (action === this.activeAction) return;

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
      action.crossFadeFrom(this.activeAction, options.crossFadeDuration, options.crossFadeWarp);
    }
    else {
      action.fadeIn(options.crossFadeDuration);
    }

    // Play action and assign it as the active action
    action.play();
    this.activeAction = action;

    // Listen for the action to finish
    const onFinished = (event) => {
      if (event.action === action) {
        this.mixer.removeEventListener('finished', onFinished);
        options.onComplete();
      }
    };
    this.mixer.addEventListener('finished', onFinished);
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
      const actionOptions = this.options?.actions?.[clip.name];
      if (index === 0 || actionOptions?.default) {
        this.activeAction = action;
      }
    });

    // Ensure the first action is fully weighted
    this.activeAction.setEffectiveWeight(1);
  }

  onAdded = event => {
    // Initialize AnimationMixer with parent entity
    this.mixer = new AnimationMixer(this.parent);

    // Reuse the parent EntityModel's (cached) asset to source animation clips
    this.core.assets.load(this.parent.url, model => this.createActions(model));
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    if (this.url) json.url = this.url;
    if (this.options.actions) {
      json.actions = JSON.parse(JSON.stringify(this.options.actions));
    }
    return json;
  }
}

export { EntityMixer };