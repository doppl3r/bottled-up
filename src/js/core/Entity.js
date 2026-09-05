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
const _eventRootRemoved = { type: 'rootRemoved', root: null };

class Entity extends Object3D {
  constructor(options, core) {
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
      metaData: {},
      userData: {},
      visible: true
    }, options);

    // Declare entity properties
    this.isEntity = true;
    this.isReady = false;
    this.entities = {};
    this.name = options.name;
    this.label = options.label;
    this.class = options.class;
    this.metaData = options.metaData;
    this.userData = options.userData;
    this.position.set(options.position.x, options.position.y, options.position.z);
    this.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z);
    this.scale.set(options.scale.x, options.scale.y, options.scale.z);
    this.visible = options.visible;

    // Add event listener(s)
    this.addEventListener('removed', this.onRemoved);
    this.addEventListener('childadded', this.onChildAdded);
    this.addEventListener('childremoved', this.onChildRemoved);
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

  onRemoved = event => {
    // Notify descendant entities of root removal
    _eventRootRemoved.root = this;
    this.traverse(child => {
      if (child.isEntity) {
        child.dispatchEvent(_eventRootRemoved);
      }
    });
  }

  onChildAdded = event => {
    this.registerEntity(event.child);
  }

  onChildRemoved = event => {
    this.unregisterEntity(event.child);
  }

  registerEntity(entity) {
    if (entity.isEntity) {
      this.entities[entity.class] = entity;
    }
  }

  unregisterEntity(entity) {
    delete this.entities[entity.class];
  }

  get(className, callback = () => {}) {
    const entity = this.entities[className];

    // Add optional callback if entity does not exist yet
    if (entity === undefined) {
      const onChildAdded = event => {
        if (event.child.class === className) {
          this.removeEventListener('childadded', onChildAdded);
          callback(event.child);
        }
      };

      // Listen for child added events to find the entity when it is added
      this.addEventListener('childadded', onChildAdded);
    }
    else {
      // Return entity immediately
      callback(entity);
      return entity;
    }
  }

  getAll(className) {
    return Object.values(this.entities).filter(entity => entity.class === className);
  }

  ready() {
    this.isReady = true;
    this.dispatchEvent({ type: 'ready' });
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

  static applyTemplate(options) {
    // Merge template into options
    const template = structuredClone(this.template);
    if (template) {
      Object.assign(template, options); // Merge options into cloned template
      Object.assign(options, template); // Merge template back into options
    }
  }
}

export { Entity }