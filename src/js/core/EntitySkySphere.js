import { Color, ShaderMaterial, BackSide } from 'three';
import { Entity } from './Entity.js';

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
    const colorArray = new Float32Array(colorStops.length * 3);
    const positionArray = new Float32Array(colorStops.length);

    this.colors.forEach((stop, i) => {
      colorArray[i * 3] = stop.color.r;
      colorArray[i * 3 + 1] = stop.color.g;
      colorArray[i * 3 + 2] = stop.color.b;
      positionArray[i] = stop.position;
    });

    // Create gradient shader material
    this.material = new ShaderMaterial({
      side: BackSide,
      uniforms: {
        colorArray: { value: colorArray },
        positionArray: { value: positionArray },
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

  onChildAdded = event => {
    // Update material
    event.child.traverse(child => {
      if (child.isMesh) {
        child.material = this.material;
      }
    });
  }

  render(loop) {
    // Perform base entity render
    super.render(loop);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.colors = this.colors;
    return json;
  }

  static template = {
    colors: [
      { color: '#102A43', position: 0.0 },
      { color: '#102A43', position: 0.25 },
      { color: '#486581', position: 0.5 },
      { color: '#F0F4F8', position: 0.75 },
      { color: '#F0F4F8', position: 1.0 }
    ],
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