/*
  The Audio class manages playback of audio loaded by Assets.
  It provides volume control by category (master, music, effects) and
  tracks active audio instances using Three.js Audio library.
*/

class Audio {
  constructor(assets) {
    // Store the Assets instance for accessing loaded audio
    this.assets = assets;

    // Volume levels by category (0.0 to 1.0)
    this.volumes = {
      master: 1.0,
      music: 1.0,
      effects: 1.0,
    };

    // Store active audio elements for lifecycle management
    this.activeAudio = new Map();
    this.audioQueue = [];

    // Setup gesture listener to resume AudioContext on user interaction
    this.addEventListeners();
  }

  addEventListeners() {
    // Listen for user interaction to resume suspended AudioContext
    const handleGesture = async () => {
      const audioContext = this.assets.audioListener.context;
      
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
          this.processAudioQueue();
        } catch (err) {
          console.warn('Failed to resume AudioContext:', err);
        }
      }

      // Remove listener after first interaction
      document.removeEventListener('click', handleGesture);
      document.removeEventListener('touchstart', handleGesture);
      document.removeEventListener('keydown', handleGesture);
    };

    document.addEventListener('click', handleGesture);
    document.addEventListener('touchstart', handleGesture);
    document.addEventListener('keydown', handleGesture);
  }

  play(soundName, onEnded = () => {}) {
    // Get audio listener context state
    const state = this.assets.audioListener.context.state;

    // Queue audio request if context is suspended (no user gesture yet)
    if (state === 'suspended') {
      this.audioQueue.push({ soundName, onEnded });
      return;
    }

    // Get loaded audio from assets cache
    const audio = this.assets.get(soundName);
    if (!audio) {
      console.error(`Audio "${soundName}" not found in assets. Make sure it's been loaded.`);
      return null;
    }

    // Stop if already playing to avoid warning
    if (audio.isPlaying) {
      audio.stop();
    }

    // Update audio behavior
    audio.loop = audio.userData?.loop ?? false;
    audio.setDetune(audio.userData?.detune ?? 0);

    // Generate unique key for tracking
    const key = `${soundName}-${Date.now()}-${Math.random()}`;
    this.activeAudio.set(key, audio);

    // Handle cleanup when audio ends
    audio.onEnded = () => {
      this.activeAudio.delete(key);
      onEnded(audio);
    };
    
    // Play the audio
    try {
      audio.gain.gain.value = 0;
      audio.play();
      this.updateAudioVolume(audio); 
    } catch (err) {
      console.error(`Error playing audio: ${soundName}`, err);
      this.activeAudio.delete(key);
    }

    // Return the unique key for this audio instance
    return key;
  }

  stop(key) {
    // Stop a playing sound by key
    const audio = this.activeAudio.get(key);
    if (audio) {
      audio.stop();
      this.activeAudio.delete(key);
    }
  }

  setVolumeByCategory(category, volume) {
    // Set the volume volume for a specific category
    if (!this.volumes.hasOwnProperty(category)) {
      console.warn(`Unknown audio category: ${category}`);
      return;
    }

    // Clamp volume between 0 and 1
    volume = Math.max(0, Math.min(1, volume));
    this.volumes[category] = volume;

    // Update volume for all active audio in this category
    this.activeAudio.forEach(audio => {
      if (audio.userData.category === category) {
        this.updateAudioVolume(audio);
      }
    });

    // Update master volume for all audio
    if (category === 'master') {
      this.activeAudio.forEach(audio => this.updateAudioVolume(audio));
    }
  }

  getVolumeByCategory(category) {
    // Get the volume level for a specific category
    return this.volumes[category] ?? this.volumes.master;
  }

  getEffectiveVolume(audio) {
    const volumeMaster = this.volumes.master;
    const volumeCategory = this.volumes[audio.userData.category] ?? 1.0;
    const volumeAudio = audio.userData.volume ?? 1.0;
    return volumeMaster * volumeCategory * volumeAudio;
  }

  stopByCategory(category) {
    // Stop all audio in a category
    this.activeAudio.forEach((audio, key) => {
      if (audio.userData.category === category) {
        audio.stop();
        this.activeAudio.delete(key);
      }
    });
  }

  stopAll() {
    // Stop all audio
    this.activeAudio.forEach(audio => audio.stop());
    this.activeAudio.clear();
  }

  updateAudioVolume(audio) {
    // Update the volume of an audio element based on category and master volume
    let volume = this.volumes.master;

    // Set default category if not specified
    if (!audio.userData.category) {
      audio.userData.category = 'effects';
    }

    // Apply category volume
    if (audio.userData.category && this.volumes[audio.userData.category] !== undefined) {
      volume *= this.volumes[audio.userData.category];
    }

    // Apply custom override if specified
    if (audio.userData.volume !== null) {
      volume *= audio.userData.volume ?? 1.0;
    }

    // Clamp to valid range and set gain
    audio.setVolume(Math.max(0, Math.min(1, volume)));
  }

  pauseAll() {
    // Pause all audio
    this.activeAudio.forEach(audio => audio.pause());
  }

  resumeAll() {
    // Resume all audio
    this.activeAudio.forEach(audio => {
      audio.gain.gain.value = 0;
      audio.play();
      this.updateAudioVolume(audio);
    });
  }

  getActiveCount() {
    // Get the number of active audio elements
    return this.activeAudio.size;
  }

  processAudioQueue() {
    // Process all queued audio requests now that context is running
    while (this.audioQueue.length > 0) {
      const { soundName, onEnded } = this.audioQueue.shift();
      this.play(soundName, onEnded);
    }
  }
}

export { Audio };