import { Entity } from './Entity.js';

/*
  EntityAudio is a special entity that includes an audio source.
*/

class EntityAudio extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityAudio',
      url: null
    }, options);

    // Inherit Entity properties
    super(options);

    // Set default properties
    this.audio;
    this.url;
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
}

export { EntityAudio };