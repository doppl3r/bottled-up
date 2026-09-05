import { EntityText } from './core/EntityText.js';
import { createVNode, render } from 'vue';
import Prompt from '../vue/Prompt.vue';

/*
  EntityPrompt extends EntityText to create a prompt with a Vue component.
*/

class EntityPrompt extends EntityText {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Initialize EntityText with Vue component
    const text = this.getText();
    this.removeText();

    // Render Vue component into the text object element once
    const vnode = createVNode(Prompt, null, { default: () => createVNode('div', { innerHTML: text }) });
    render(vnode, this.textObject.element);

    // Add event listeners
    this.addEventListener('rootRemoved', this.onRootRemoved);
  }

  onRootRemoved = () => {
    // Unmount the Vue component from the text object element
    render(null, this.textObject.element);
  }

  static template = {
    code: 'KeyE',
  }
}

export { EntityPrompt }