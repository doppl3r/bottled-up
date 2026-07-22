import { Audio, AudioListener, AudioLoader, EventDispatcher, FileLoader, LoadingManager, MaterialLoader, TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader'

class Assets extends EventDispatcher {
  constructor() {
    // Inherit Three.js EventDispatcher system
    super();

    // Store assets in memory
    this.cache = {};
    this.queue = [];
    
    // Define manager and assign callbacks
    this.loadingManager = new LoadingManager();
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => this.dispatchEvent({ type: 'onStart', url, itemsLoaded, itemsTotal });
    this.loadingManager.onLoad = () => this.dispatchEvent({ type: 'onLoad' });
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => this.dispatchEvent({ type: 'onProgress', url, itemsLoaded, itemsTotal });
    this.loadingManager.onError = url => console.error(`File "${ url }" not found`);
    
    // Initialize additional components
    this.audioListener = new AudioListener();

    // Initialize loaders with manager
    this.audioLoader = new AudioLoader(this.loadingManager);
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.fbxLoader = new FBXLoader(this.loadingManager);
    this.hdrLoader = new HDRLoader(this.loadingManager);
    this.textureLoader = new TextureLoader(this.loadingManager);
    this.materialLoader = new MaterialLoader(this.loadingManager);
    this.fileLoader = new FileLoader(this.loadingManager);
    this.fileLoader.responseType = 'json';

    // Define loader options for different file types
    this.loaderOptions = [
      {
        fileTypes: ['mp3', 'ogg', 'wav'],
        loader: this.audioLoader,
        onLoad: (fileName, data) => {
          const audio = new Audio(this.audioListener);
          Object.assign(audio, { name: fileName });
          this.assign(fileName, audio.setBuffer(data))
        }
      },
      {
        fileTypes: ['glb', 'gltf'],
        loader: this.gltfLoader,
        onLoad: (fileName, data) => {
          Object.assign(data.scene, { ...data });
          this.assign(fileName, data.scene);
        }
      },
      {
        fileTypes: ['fbx'],
        loader: this.fbxLoader,
        onLoad: (fileName, data) => this.assign(fileName, data)
      },
      {
        fileTypes: ['jpg', 'jpeg', 'png'],
        loader: this.textureLoader,
        onLoad: (fileName, data) => {
          Object.assign(data, { colorSpace: 'srgb' })
          this.assign(fileName, data)
        }
      },
      {
        fileTypes: ['hdr'],
        loader: this.hdrLoader,
        onLoad: (fileName, data) => {
          Object.assign(data, { mapping: 303 }); // EquirectangularReflectionMapping
          this.assign(fileName, data)
        }
      },
      {
        fileTypes: ['json'],
        loader: this.fileLoader,
        onLoad: (fileName, data) => {
          // Check if data type is a material
          if (data.type?.includes('Material')) {
            if (typeof data.map?.url === 'string') {
              // Create and assign new material with JSON data
              const material = this.materialLoader.createMaterialFromType(data.type);
              Object.assign(material, { ...data, name: fileName });
              this.assign(fileName, material);

              // Load and assign texture to material
              this.load(data.map.url, texture => {
                // Update material texture with JSON data
                Object.assign(texture, data.map);
                this.get(fileName).map = texture;
                material.dispatchEvent({ type: 'loaded', texture });
              });
            }
            else {
              // Create material if no texture is specified
              this.assign(fileName, this.materialLoader.parse(data));
            }
          }
          else {
            // Default load json
            this.assign(fileName, data);
          }
        }
      }
    ];
  }

  load(url, callback = () => {}) {
    // Resolve directly from cache if url is an exact cache key
    const cached = this.get(url);
    if (cached) return callback(cached);

    // Get file details
    const fileType = this.getFileType(url);
    const fileName = this.getFileName(url);
    const isQueued = this.isQueued(fileName);
    const asset = this.get(fileName); // Default = undefined

    // Add item to the queue
    if (asset === undefined) {
      this.queue.push({ name: fileName, callback });

      // Start loading if asset is not queued
      if (isQueued === false) {
        // Get loader option by file type (ex: 'mp3')
        const loaderOption = this.loaderOptions.find(option => option.fileTypes.includes(fileType));

        // Load asset if loader option exists
        if (loaderOption !== undefined) {
          loaderOption.loader.load(url, data => loaderOption.onLoad(fileName, data));
        }
        else {
          console.error(`File type ".${ fileType }" not supported`);
        }
      }
    }
  }

  loadBatch(urls, onLoad = () => {}) {
    Promise.all(
      urls.map((path) =>
        new Promise(resolve => {
          this.load(path, asset => {
            resolve(asset);
          });
        })
      )
    ).then(assets => onLoad(assets));
  }

  assign(name, asset) {
    // Set loaded asset by name
    this.set(name, asset);
 
    // Run callbacks and remove items from queue
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i]?.name === name) {
        this.queue[i].callback(asset);
        this.queue.splice(i, 1);
      }
    }
  }

  set(key, value) {
    return this.cache[key] = value;
  }

  get(key) {
    return this.cache[key];
  }

  getFileType(url) {
    return url.substring(url.lastIndexOf('.') + 1);
  }

  getFileName(url) {
    return url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
  }

  isQueued(name) {
    return this.queue.find(item => item.name === name) !== undefined;
  }

  remove(key) {
    delete this.cache[key];
  }
}

export { Assets }