import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Entity } from './Entity.js';

class EntityText extends Entity {
  constructor(options) {
    // Set default options
    options = Object.assign({
      type: 'div',
      text: 'Hello, World!'
    }, options);

    // Inherit Entity properties
    super(options);

    // Create element for the CSS2DObject
    const element = document.createElement(options.type);
    element.className = options.class;
    element.innerHTML = options.text;
    this.textObject = new CSS2DObject(element);

    // Ensure this text is removed after parent is removed
    this.addEventListener('added', this.onAdded);
  }

  onAdded = event => {
    this.add(this.textObject);
    this.parent.addEventListener('removed', this.onParentRemoved);
  }
  
  onParentRemoved = event => {
    this.remove(this.textObject);
    this.parent.removeEventListener('removed', this.onParentRemoved);
  }

  setText(text) {
    this.textObject.element.innerHTML = text;
  }

  getText() {
    return this.textObject.element.innerHTML;
  }

  hide() {
    this.visible = false;
  }

  show() {
    this.visible = true;
  }
}

export { EntityText }