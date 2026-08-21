import { Entity } from './Entity.js';

/*
  EntityAudio is a special entity that includes an audio source.
*/

class EntityAudio extends Entity {
  constructor(options) {
    // Inherit Entity properties
    super(options);

    // Set default properties
    this.audio;
    this.url;
  }

  load(options, core) {
    // Add audio component if entity is an instance of EntityAudio
    core.assets.load(options.url, audio => {
      this.setAudio(audio, options);
      this.add(audio);
      super.load(options, core);
    });
  }

  setAudio(audio, options = {}) {
    // Assign audio
    this.audio = audio;
    this.audio.userData = options.userData;
    this.url = options.url;
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    json.userData = this.audio?.userData;
    return json;
  }

  static template = {
    url: null
  }
}

export { EntityAudio };