import { Color, ShaderMaterial, BackSide } from 'three';
import { Entity } from './Entity.js';
import { Tweens } from './Tweens.js';

/*
  EntitySkySphere adds a sphere mesh background to scene with a custom gradient shader.
  Accepts an array of color stops with hex colors and float positions (0.0 to 1.0).
*/

class EntitySkySphere extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      
    }, options);

    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.colors = [];
    this.material = null;
    this.colorArray = null;
    this.positionArray = null;

    // Animations
    this.tweens = new Tweens();

    // Add event listeners
    this.addEventListener('childadded', this.onChildAdded);
  }

  init(options, core) {
    // Parse color stops from options or template
    const colorStops = options.colors || EntitySkySphere.template.colors;
    this.colors = colorStops.map(stop => ({
      color: new Color(stop.color),
      position: stop.position
    }));

    // Create uniform arrays for shader
    this.colorArray = new Float32Array(colorStops.length * 3);
    this.positionArray = new Float32Array(colorStops.length);

    this.colors.forEach((stop, i) => {
      this.colorArray[i * 3] = stop.color.r;
      this.colorArray[i * 3 + 1] = stop.color.g;
      this.colorArray[i * 3 + 2] = stop.color.b;
      this.positionArray[i] = stop.position;
    });

    // Create gradient shader material
    this.material = new ShaderMaterial({
      side: BackSide,
      uniforms: {
        colorArray: { value: this.colorArray },
        positionArray: { value: this.positionArray },
        colorCount: { value: colorStops.length }
      },
      vertexShader: `
        varying float vNormalizedY;
        
        void main() {
          vNormalizedY = normalize(position).y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float positionArray[${colorStops.length}];
        uniform vec3 colorArray[${colorStops.length}];
        uniform int colorCount;
        
        varying float vNormalizedY;
        
        vec3 getColorAtPosition(float t) {
          for (int i = 0; i < colorCount - 1; i++) {
            float pos1 = positionArray[i];
            float pos2 = positionArray[i + 1];
            
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
          vec3 color = getColorAtPosition(t);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    // Get the sphere mesh child and apply the material
    super.init(options, core);
  }

  render(loop) {
    // Update tweens
    this.tweens.update(loop.delta);

    // Perform base entity render
    super.render(loop);
  }

  fadeTo(colorGroup, duration = 5000) {
    // Implement fade to new color group over the specified duration
    const newColors = EntitySkySphere.colorGroups[colorGroup];
    if (!newColors) return;

    // Animate each color stop
    newColors.forEach((stop, i) => {
      const currentColor = this.colors[i].color;
      const currentPosition = this.colors[i].position;
      const targetColor = new Color(stop.color);
      const targetPosition = stop.position;

      this.tweens.tween({
        object: { 
          r: currentColor.r, 
          g: currentColor.g, 
          b: currentColor.b,
          position: currentPosition
        },
        to: { 
          r: targetColor.r, 
          g: targetColor.g, 
          b: targetColor.b,
          position: targetPosition
        },
        duration: duration,
        onUpdate: (values) => {
          // Update color object
          this.colors[i].color.r = values.r;
          this.colors[i].color.g = values.g;
          this.colors[i].color.b = values.b;
          this.colors[i].position = values.position;
          
          // Update shader uniform array
          this.colorArray[i * 3] = values.r;
          this.colorArray[i * 3 + 1] = values.g;
          this.colorArray[i * 3 + 2] = values.b;
          this.positionArray[i] = values.position;
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
      { color: '#001a4d', position: 0.0 },
      { color: '#0052cc', position: 0.45 },
      { color: '#1e90ff', position: 0.5 },
      { color: '#42a5f5', position: 0.55 },
      { color: '#e3f2fd', position: 1.0 }
    ],
    cloudy: [
      { color: '#4a5568', position: 0.0 },
      { color: '#667eaa', position: 0.33 },
      { color: '#8a9fbf', position: 0.5 },
      { color: '#b4c9e0', position: 0.66 },
      { color: '#d1dce6', position: 1.0 }
    ],
    sunset: [
      { color: '#0d1f2d', position: 0.0 },
      { color: '#6b1d4d', position: 0.45 },
      { color: '#d97706', position: 0.5 },
      { color: '#f97316', position: 0.55 },
      { color: '#fecaca', position: 1.0 }
    ],
    night: [
      { color: '#000000', position: 0.0 },
      { color: '#0f0f1e', position: 0.25 },
      { color: '#1a1a3e', position: 0.5 },
      { color: '#2d1b4e', position: 0.75 },
      { color: '#1e3a5f', position: 1.0 }
    ],
    creepy: [
      { color: '#1a0033', position: 0.0 },
      { color: '#4c0080', position: 0.33 },
      { color: '#9933cc', position: 0.5 },
      { color: '#00cc00', position: 0.67 },
      { color: '#99ff99', position: 1.0 }
    ],
    spooky: [
      { color: '#1a0033', position: 0.0 },
      { color: '#4c0080', position: 0.25 },
      { color: '#9933cc', position: 0.5 },
      { color: '#ff9933', position: 0.75 },
      { color: '#ffcc99', position: 1.0 }
    ],
    mystical: [
      { color: '#1a0033', position: 0.0 },
      { color: '#5e0d73', position: 0.25 },
      { color: '#00a896', position: 0.5 },
      { color: '#00d9d9', position: 0.75 },
      { color: '#c1f0f6', position: 1.0 }
    ],
  }

  static template = {
    colors: EntitySkySphere.colorGroups['vibrant'],
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