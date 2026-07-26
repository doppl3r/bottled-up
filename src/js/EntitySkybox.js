import { Entity } from './core/Entity.js';

class EntitySkybox extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      code: 'KeyE',
      type: 'keydown',
    }, options);

    // Inherit Entity properties
    super(options);
  }

  static template = {
    name: 'skybox',
    label: 'Skybox',
    urls: [
      'png/skybox-forge-1-px.png',
      'png/skybox-forge-1-nx.png',
      'png/skybox-forge-1-py.png',
      'png/skybox-forge-1-ny.png',
      'png/skybox-forge-1-pz.png',
      'png/skybox-forge-1-nz.png'
    ]
  }
}

export { EntitySkybox }