import { AnimationMixer } from 'three';
import { Entity } from "./Entity";

/*
  EntityMixer is a specialized entity that manages animation
  mixers for parent entities.
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

    // Add event listeners
    this.addEventListener('added', this.onAdded);
  }

  render(loop) {
    this.mixer?.update(loop.delta / 1000);

    // Perform base entity render
    super.render(loop);
  }

  play(name, duration = 1) {
    var startAction = this.mixer.actions?.['active'];
    var endAction = this.mixer.actions?.[name];

    // Check if action exists
    if (startAction && endAction && endAction != startAction) {
      // Fade in from no animation
      if (startAction == null) {
        endAction.setEffectiveWeight(1);
        endAction.reset().fadeIn(duration);
      }
      else {
        // Cross fade animation with duration
        startAction.setEffectiveWeight(1);
        endAction.setEffectiveWeight(1);
        endAction.reset().crossFadeFrom(startAction, duration);
      }

      // Store action data for cross fade
      endAction['duration'] = duration;
      this.mixer.actions['active'] = endAction;
    }
  }

  build = (event) => {
    // Get animations from child with animations
    const child = event.target.children.find(child => child.animations?.length > 0);

    // Add animations to mixer if animations exists
    if (child) {
      const loopType = child.userData.loop || 2201; // 2201 = LoopRepeat, 2200 = LoopOnce
      this.mixer.actions = {};
      
      // Add all animations (for nested objects)
      for (let i = 0; i < child.animations.length; i++) {
        const animation = child.animations[i];
        const action = this.mixer.clipAction(animation);
        if (loopType == 2200) {
          action.setLoop(loopType);
          action.clampWhenFinished = true;
        }
        action.play(); // Activate action by default
        action.setEffectiveWeight(0); // Clear action influence
        this.mixer.actions[animation.name] = action;

        // Set active action to first action
        if (i == 0) {
          this.mixer.actions['active'] = action;
          action.setEffectiveWeight(1);
        }
      }
    }
  }

  onAdded = event => {
    // Add event listener to parent entity
    event.target.parent.addEventListener('childadded', this.build);
    event.target.parent.addEventListener('removed', this.onRemoved);

    // Initialize AnimationMixer with parent entity
    this.mixer = new AnimationMixer(event.target.parent);
  }

  onRemoved = event => {
    // Remove event listener from target (parent) entity
    event.target.removeEventListener('removed', this.onRemoved);
    event.target.removeEventListener('childadded', this.build);
  }
}

export { EntityMixer };