import { EntityText } from './core/EntityText.js';
import { createVNode, render, ref } from 'vue';
import Prompt from '../vue/Prompt.vue';

/*
  EntityPrompt extends EntityText to create a prompt with a Vue component.
*/

class EntityPrompt extends EntityText {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Initialize EntityText with Vue component
    this.textRef = ref(this.getText());
    const className = this.textObject.element.className;
    this.removeText();
    this.removeClass(className);

    // Render Vue component into the text object element once
    const props = { class: className };
    const slots = { default: () => createVNode('div', { innerHTML: this.textRef.value }) };
    const vNode = createVNode(Prompt, props, slots);
    render(vNode, this.textObject.element);

    // Add event listeners
    this.addEventListener('rootRemoved', this.onRootRemoved);
  }

  setText(text) {
    if (this.textRef) this.textRef.value = text;
  }

  getText() {
    return this.textRef ? this.textRef.value : super.getText();
  }

  onRootRemoved = () => {
    // Unmount the Vue component from the text object element
    render(null, this.textObject.element);
  }
}

export { EntityPrompt }