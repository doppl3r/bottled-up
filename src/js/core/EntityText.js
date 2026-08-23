import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Entity } from './Entity.js';

class EntityText extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Create element for the CSS2DObject
    const element = document.createElement(options.type);
    element.className = options.class;
    element.innerHTML = options.text;
    element.style.cssText = options.style;
    this.textObject = new CSS2DObject(element);
    
    // Ensure this text is removed after parent is removed
    this.addEventListener('added', this.onAdded);
    this.addEventListener('rootRemoved', this.onRootRemoved);

    // Update entity state
    this.ready();
  }

  onAdded = event => {
    this.add(this.textObject);
  }

  onRootRemoved = event => {
    this.remove(this.textObject);
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

  static template = {
    type: 'div',
    text: 'Hello, World!'
  }
}

export { EntityText }