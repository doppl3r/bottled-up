import { Color, ShaderMaterial, BackSide } from 'three';
import { Entity } from './Entity.js';
import { Tweens } from './Tweens.js';

/*
  EntitySkySphere adds a sphere mesh background to scene with a custom gradient shader.
  Accepts an array of color stops with hex colors and float offsets (0.0 to 1.0).
*/

class EntitySkySphere extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Declare entity components
    this.colors = options.colors;
    this.colorGroup = [];
    this.material = null;
    this.colorArray = null;
    this.offsetArray = null;

    // Animations
    this.tweens = new Tweens();

    // Create uniform arrays for shader
    this.colorGroup = this.getColorGroup(options.colors);
    this.colorArray = new Float32Array(this.colorGroup.length * 3);
    this.offsetArray = new Float32Array(this.colorGroup.length);

    // Populate the uniform arrays with color and offset data
    this.colorGroup.forEach((stop, i) => {
      this.colorArray[i * 3] = stop.color.r;
      this.colorArray[i * 3 + 1] = stop.color.g;
      this.colorArray[i * 3 + 2] = stop.color.b;
      this.offsetArray[i] = stop.offset;
    });

    // Create gradient shader material
    this.material = new ShaderMaterial({
      side: BackSide,
      uniforms: {
        colorArray: { value: this.colorArray },
        offsetArray: { value: this.offsetArray },
        colorCount: { value: this.colorGroup.length }
      },
      vertexShader: `
        varying float vNormalizedY;
        
        void main() {
          vNormalizedY = normalize(position).y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float offsetArray[${this.colorGroup.length}];
        uniform vec3 colorArray[${this.colorGroup.length}];
        uniform int colorCount;
        
        varying float vNormalizedY;
        
        vec3 getColorAtOffset(float t) {
          for (int i = 0; i < colorCount - 1; i++) {
            float pos1 = offsetArray[i];
            float pos2 = offsetArray[i + 1];
            
            if (t >= pos1 && t <= pos2) {
              vec3 color1 = colorArray[i];
              vec3 color2 = colorArray[i + 1];
              float blend = (t - pos1) / (pos2 - pos1);
              return mix(color1, color2, blend);
            }
          }
          return vec3(1.0);
        }
        
        void main() {
          float t = vNormalizedY * 0.5 + 0.5;
          vec3 color = getColorAtOffset(t);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    // Add event listeners
    this.addEventListener('childadded', this.onChildAdded);

    // Update loading state
    this.isReady = true;
  }

  render(loop) {
    // Update tweens
    this.tweens.update(loop.delta);

    // Perform base entity render
    super.render(loop);
  }

  getColorGroup(colorValue) {
    let colorGroup;
    if (typeof colorValue === 'string') {
      // Set color group from existing color group
      if (EntitySkySphere.colorGroups[colorValue]) {
        colorGroup = EntitySkySphere.colorGroups[colorValue].map(colorStop => ({
          color: new Color(colorStop.color),
          offset: colorStop.offset
        }));
      }
      else {
        // Set color group from comma-separated string
        const colorArray = colorValue.split(','); 
        colorGroup = colorArray.map((color, index) => ({
          color: new Color(color.trim()),
          offset: index / (colorArray.length - 1)
        }));
      }
    }

    // Ensure items are sorted by offset
    if (colorGroup) colorGroup.sort((a, b) => a.offset - b.offset);

    // Return the color
    return colorGroup;
  }

  fadeTo(colorValue, duration = 5000) {
    // Implement fade to new color group over the specified duration
    const newColorGroup = this.getColorGroup(colorValue);
    if (!newColorGroup) return;

    // Animate each color stop
    newColorGroup.forEach((stop, i) => {
      const currentColor = this.colorGroup[i].color;
      const currentOffset = this.colorGroup[i].offset;
      const targetColor = new Color(stop.color);
      const targetOffset = stop.offset;

      this.tweens.tween({
        object: { 
          r: currentColor.r, 
          g: currentColor.g, 
          b: currentColor.b,
          offset: currentOffset
        },
        to: { 
          r: targetColor.r, 
          g: targetColor.g, 
          b: targetColor.b,
          offset: targetOffset
        },
        duration: duration,
        onUpdate: (values) => {
          // Update color object
          this.colorGroup[i].color.r = values.r;
          this.colorGroup[i].color.g = values.g;
          this.colorGroup[i].color.b = values.b;
          this.colorGroup[i].offset = values.offset;
          
          // Update shader uniform array
          this.colorArray[i * 3] = values.r;
          this.colorArray[i * 3 + 1] = values.g;
          this.colorArray[i * 3 + 2] = values.b;
          this.offsetArray[i] = values.offset;
        }
      });
    });
  }

  onChildAdded = event => {
    // Update material
    event.child.traverse(child => {
      if (child.isMesh) {
        child.material = this.material;
      }
    });
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.colors = this.colors;
    return json;
  }

  static colorGroups = {
    vibrant: [
      { color: '#001a4d', offset: 0.0 },
      { color: '#0052cc', offset: 0.45 },
      { color: '#1e90ff', offset: 0.5 },
      { color: '#42a5f5', offset: 0.55 },
      { color: '#e3f2fd', offset: 1.0 }
    ],
    cloudy: [
      { color: '#4a5568', offset: 0.0 },
      { color: '#667eaa', offset: 0.4 },
      { color: '#8a9fbf', offset: 0.5 },
      { color: '#b4c9e0', offset: 0.6 },
      { color: '#d1dce6', offset: 1.0 }
    ],
    sunset: [
      { color: '#0d1f2d', offset: 0.0 },
      { color: '#6b1d4d', offset: 0.45 },
      { color: '#d97706', offset: 0.5 },
      { color: '#f97316', offset: 0.55 },
      { color: '#fecaca', offset: 1.0 }
    ],
    night: [
      { color: '#000000', offset: 0.0 },
      { color: '#0f0f1e', offset: 0.25 },
      { color: '#1a1a3e', offset: 0.5 },
      { color: '#2d1b4e', offset: 0.75 },
      { color: '#1e3a5f', offset: 1.0 }
    ],
    creepy: [
      { color: '#1a0033', offset: 0.0 },
      { color: '#4c0080', offset: 0.33 },
      { color: '#9933cc', offset: 0.5 },
      { color: '#00cc00', offset: 0.67 },
      { color: '#99ff99', offset: 1.0 }
    ],
    spooky: [
      { color: '#1a0033', offset: 0.0 },
      { color: '#4c0080', offset: 0.25 },
      { color: '#9933cc', offset: 0.5 },
      { color: '#ff9933', offset: 0.75 },
      { color: '#ffcc99', offset: 1.0 }
    ],
    mystical: [
      { color: '#1a0033', offset: 0.0 },
      { color: '#5e0d73', offset: 0.25 },
      { color: '#00a896', offset: 0.5 },
      { color: '#00d9d9', offset: 0.75 },
      { color: '#c1f0f6', offset: 1.0 }
    ],
    hell: [
      { color: '#371c29', offset: 0.0 },
      { color: '#371c29', offset: 0.33 },
      { color: '#662a22', offset: 0.5 },
      { color: '#f65510', offset: 0.66 },
      { color: '#f65510', offset: 1.0 },
    ]
  }

  static template = {
    colors: 'vibrant',
    children: [
      {
        class: 'EntityMesh',
        scale: {
          x: 1000,
          y: 1000,
          z: 1000
        },
        geometry: {
          type: 'SphereGeometry',
          arguments: [0.5, 32, 32],
        },
        material: {
          type: 'MeshBasicMaterial'
        }
      }
    ]
  }
}

export { EntitySkySphere };