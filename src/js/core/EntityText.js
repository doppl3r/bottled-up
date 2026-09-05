import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Entity } from './Entity.js';

class EntityText extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Create element for the CSS2DObject
    const element = document.createElement(options.type || 'div');
    this.textObject = new CSS2DObject(element);
    this.setText(options.text);
    this.setStyle(options.style);
    this.addClass(options.className);
    
    // Ensure this text is removed after parent is removed
    this.addEventListener('added', this.onAdded);
    this.addEventListener('rootRemoved', this.onRootRemoved);

    // Update entity state
    this.ready();
  }

  onAdded = () => {
    this.add(this.textObject);
  }

  onRootRemoved = () => {
    this.remove(this.textObject);
  }

  setText(text) {
    this.textObject.element.innerHTML = text;
  }

  getText() {
    return this.textObject.element.innerHTML;
  }

  removeText() {
    this.setText('');
  }

  addClass(className) {
    this.textObject.element.classList.add(className);
  }

  removeClass(className) {
    this.textObject.element.classList.remove(className);
  }

  setStyle(style) {
    this.textObject.element.style.cssText = style;
  }

  hide() {
    this.visible = false;
    this.remove(this.textObject);
  }

  show() {
    this.visible = true;
    if (!this.textObject.parent) this.add(this.textObject);
  }

  setVisibility(visible) {
    if (visible) this.show();
    else this.hide();
  }

  static template = {
    type: 'div',
    text: 'Hello, World!'
  }
}

export { EntityText }