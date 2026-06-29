import { Object3D } from 'three';

/*
  The base entity class leverages the Three.js scene graph system by
  extending Object3D. This allows entities to be positioned, rotated, and
  scaled in 3D space, and to have parent-child relationships with other
  entities.
*/

// Initialize module-scoped variables
const _eventBeforeRender = { type: 'beforeRender', loop: null };
const _eventBeforeUpdate = { type: 'beforeUpdate', loop: null };
const _eventRendered = { type: 'rendered', loop: null };
const _eventUpdated = { type: 'updated', loop: null };

class Entity extends Object3D {
  constructor(options) {
    // Inherit Three.js Object3D system
    super();

    // Set base options
    options = Object.assign({
      name: '',
      label: '',
      class: 'Entity',
      isSelectable: false,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      tempData: {},
      metaData: {},
      userData: {},
    }, options);

    // Declare entity properties
    this.isEntity = true;
    this.name = options.name;
    this.label = options.label;
    this.class = options.class;
    this.tempData = options.tempData;
    this.metaData = options.metaData;
    this.userData = options.userData;
    this.position.set(options.position.x, options.position.y, options.position.z);
    this.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z);
    this.scale.set(options.scale.x, options.scale.y, options.scale.z);
  }

  create(options, entityManager) {
    // This method can be overridden by subclasses
  }

  update(loop) {
    // Dispatch event before updating
    _eventBeforeUpdate.loop = loop;
    this.dispatchEvent(_eventBeforeUpdate);
    
    // Update all child entities
    this.children.forEach(child => child.update?.(loop));
    
    // Dispatch event after updating
    _eventUpdated.loop = loop;
    this.dispatchEvent(_eventUpdated);
  }
  
  render(loop) {
    // Dispatch event before rendering
    _eventBeforeRender.loop = loop;
    this.dispatchEvent(_eventBeforeRender);

    // Update all children rendering properties
    this.children.forEach(child => child.render?.(loop));

    // Dispatch 'rendered' events after updating
    _eventRendered.loop = loop;
    this.dispatchEvent(_eventRendered);
  }

  serialize() {
    // Serialize entity to JSON
    const jsonData = {
      name: this.name,
      class: this.class,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotation: { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z, order: this.rotation.order },
      scale: { x: this.scale.x, y: this.scale.y, z: this.scale.z }
    };

    // Serialize optional user data
    if (Object.keys(this.userData).length > 0) {
      jsonData.userData = JSON.parse(JSON.stringify(this.userData));
    }

    // Check if entity is using template data
    if (Object.keys(this.tempData).length > 0) {
      // Assign json data from template with user data
      const templateData = { ...this.tempData };
      if (jsonData.userData) templateData.userData = jsonData.userData;
      
      // Return serialized template without children
      return templateData;
    }
    else {
      // Serialize children
      this.children.forEach(child => {
        if (child.isEntity) {
          jsonData.children = jsonData.children || [];
          jsonData.children.push(child.serialize());
        }
      });

      // Return full JSON data
      return jsonData;
    }
  }
}

export { Entity }