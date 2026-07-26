import { BasicShadowMap, EventDispatcher, PCFShadowMap } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// Initialize module-scoped variables
const _eventBeforeRender = { type: 'beforeRender' };
const _eventRendered = { type: 'rendered' };
const _eventResize = { type: 'resize' };

/*
  The Compositor class manages post-processing effects and rendering,
  utilizing Three.js EffectComposer to apply various visual passes.
*/

class Compositor extends EventDispatcher {
  constructor(scene, camera, renderer) {
    super();

    // Assign post processing on top of renderer
    this.renderPass = new RenderPass(scene, camera);
    this.outputPass = new OutputPass(); // {} = use default resolution
    
    // Add effects to composer
    this.effectComposer = new EffectComposer(renderer);
    this.effectComposer.renderer.shadowMap.enabled = true;
    this.effectComposer.renderer.shadowMap.type = BasicShadowMap;
    this.effectComposer.addPass(this.renderPass); // Renderer
    this.effectComposer.addPass(this.outputPass); // Gamma/sRGB correction

    // Initialize CSS2DRenderer
    this.rendererCSS = new CSS2DRenderer();
    this.rendererCSS.domElement.className = 'CSS2DRenderer';
    this.rendererCSS.domElement.style.position = 'absolute';
    this.rendererCSS.domElement.style.pointerEvents = 'none';
    this.rendererCSS.domElement.style.top = '0px';
    this.rendererCSS.domElement.style.right = '0px';
    this.rendererCSS.domElement.style.bottom = '0px';
    this.rendererCSS.domElement.style.left = '0px';

    // Add stats
    this.stats = new Stats();
    this.stats.dom.style = 'position: fixed; bottom: 0px; left: 0px; cursor: pointer; opacity: 0.9; z-index: 10000;';

    // Add event listeners and dispatch resize immediately
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  render() {
    // Begin stats recording
    this.stats.begin();

    // Render scene with all post processing effects
    this.dispatchEvent(_eventBeforeRender);
    this.effectComposer.render();
    this.rendererCSS.render(this.renderPass.scene, this.renderPass.camera);
    this.dispatchEvent(_eventRendered);

    // End stats recording
    this.stats.end();
  }

  resize = e => {
    var width = e?.target.innerWidth || window.innerWidth;
    var height = e?.target.innerHeight || window.innerHeight;
    this.setSize(width, height)

    // Dispatch resize event
    _eventResize.width = width;
    _eventResize.height = height;
    this.dispatchEvent(_eventResize);
  }

  setSize(width, height) {
    var ratio = width / height;
    
    // Update orthographic frustum
    if (this.renderPass.camera.isOrthographicCamera) {
      this.renderPass.camera.left = -ratio * 0.5;
      this.renderPass.camera.right = ratio * 0.5;
      this.renderPass.camera.top = 0.5;
      this.renderPass.camera.bottom = -0.5;
    }

    // Update camera ratio
    this.renderPass.camera.aspect = ratio * this.renderPass.camera.zoom;
    this.renderPass.camera.updateProjectionMatrix();

    // Update renderer size
    this.effectComposer.renderer.setSize(width, height);
    this.effectComposer.setSize(width, height);

    // Update CSS2DRenderer size
    this.rendererCSS.setSize(width, height);
  }

  captureScreenshot() {
    // Rerender the scene
    this.effectComposer.render();
    
    // Composite on background and save as png image
    const canvas = this.compositeBackground(this.effectComposer.renderer.domElement);
    canvas.toBlob(blob => {
      const link = document.createElement('a');
      link.download = `screenshot-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
    });
  }

  compositeBackground(sourceCanvas, backgroundColor = '#000000') {
    // Create blank canvas element from source canvas
    const newCanvas = document.createElement('canvas');
    newCanvas.width = sourceCanvas.width;
    newCanvas.height = sourceCanvas.height;
    
    // Fill the canvas context background
    const ctx = newCanvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);
    
    // Return new canvas with background
    return newCanvas;
  }

  addStats() {
    document.body.appendChild(this.stats.dom);
  }

  removeStats() {
    document.body.removeChild(this.stats.dom);
  }

  showStats() {
    this.stats.dom.style.display = 'block';
  }

  hideStats() {
    this.stats.dom.style.display = 'none';
  }
}

export { Compositor };