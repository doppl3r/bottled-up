import { BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';
import { Entity } from './Entity.js';

/*
  EntityParticles adds a buffered particle system to an entity.
*/

class EntityParticles extends Entity {
  constructor(options, core) {
    const {
      capacity = 1000,
      size = 1.0,
      url,
      magFilter = 1003,
      minFilter = 1003,
      alphaTest = 0.001,
      sizeAttenuation = true,
      transparent = true,
      depthWrite = false
    } = options;

    // Inherit Entity properties
    super(options, core);

    // Update particle system properties
    this.capacity = capacity;
    this.size = size;
    this.count = 0;
    this.index = 0;
    this.url = url;
    this.magFilter = magFilter;
    this.minFilter = minFilter;

    // Create geometry for particles
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.capacity * 3), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.capacity * 4), 4));
    geometry.setAttribute('scale', new BufferAttribute(new Float32Array(this.capacity), 1));
    geometry.setAttribute('angle', new BufferAttribute(new Float32Array(this.capacity), 1));
    geometry.setDrawRange(0, 0);

    // Build shader defines
    const defines = {};
    if (sizeAttenuation) defines.USE_SIZEATTENUATION = '';
    if (alphaTest > 0) defines.USE_ALPHATEST = '';
    if (url) defines.USE_MAP = '';

    // Calculate initial scale factor based on renderer height (fallback 300.0)
    const scaleFactor = core?.renderer?.domElement?.clientHeight ? core.renderer.domElement.clientHeight / 2.0 : 300.0;

    // Create shader material for particles
    const material = new ShaderMaterial({
      transparent,
      depthWrite,
      defines,
      uniforms: {
        map: { value: null },
        size: { value: this.size },
        scaleFactor: { value: scaleFactor },
        alphaTest: { value: alphaTest }
      },
      vertexShader: `
        attribute vec4 color;
        attribute float scale;
        attribute float angle;

        varying vec4 vColor;
        varying vec2 vCosSin;

        uniform float size;

        #ifdef USE_SIZEATTENUATION
          uniform float scaleFactor;
        #endif

        void main() {
          vColor = color;
          vCosSin = vec2(cos(angle), sin(angle));

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          #ifdef USE_SIZEATTENUATION
            gl_PointSize = size * scale * (scaleFactor / -mvPosition.z) * ${Math.SQRT2};
          #else
            gl_PointSize = size * scale * ${Math.SQRT2};
          #endif
        }
      `,
      fragmentShader: `
        #ifdef USE_MAP
          uniform sampler2D map;
        #endif
        uniform float alphaTest;

        varying vec4 vColor;
        varying vec2 vCosSin;

        void main() {
          vec2 pt = vec2(gl_PointCoord.x - 0.5, 0.5 - gl_PointCoord.y) * ${Math.SQRT2};
          vec2 uv = vec2(
            pt.x * vCosSin.x + pt.y * vCosSin.y,
            -pt.x * vCosSin.y + pt.y * vCosSin.x
          ) + vec2(0.5);

          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

          vec4 diffuseColor = vColor;

          #ifdef USE_MAP
            vec4 mapTexel = texture2D(map, uv);
            diffuseColor *= mapTexel;
          #endif

          #ifdef USE_ALPHATEST
            if (diffuseColor.a < alphaTest) discard;
          #endif

          gl_FragColor = diffuseColor;
        }
      `
    });

    // Declare entity components
    this.points = new Points(geometry, material);
    this.points.frustumCulled = false;
    this.points.layers.set(0);
    this.add(this.points);

    // Update scaleFactor on window resize if core is present
    if (core?.renderer?.domElement) {
      window.addEventListener('resize', () => {
        const height = core.renderer.domElement.clientHeight;
        if (height > 0) {
          this.points.material.uniforms.scaleFactor.value = height / 2.0;
        }
      });
    }

    // Load texture or assign directly if map is provided
    if (url) {
      core.assets.load(url, texture => {
        this.setTexture(texture);
        this.ready();
      });
    }
    else {
      this.ready();
    }
  }

  setTexture(texture) {
    if (this.magFilter) texture.magFilter = this.magFilter;
    if (this.minFilter) texture.minFilter = this.minFilter;
    this.points.material.uniforms.map.value = texture;
    texture.needsUpdate = true;
  }

  update(index, options = {}) {
    const { position, color, rgba, scale, size, angle } = options;

    // Update position [x, y, z] or { x, y, z }
    if (position) {
      const positionAttr = this.points.geometry.getAttribute('position');
      if (Array.isArray(options.position)) positionAttr.setXYZ(index, options.position[0], options.position[1], options.position[2]);
      else positionAttr.setXYZ(index, options.position.x, options.position.y, options.position.z);
      positionAttr.needsUpdate = true;
    }

    // Update color / opacity value [r, g, b, a] (supports color or rgba alias)
    const colorValues = color || rgba;
    if (colorValues) {
      const colorAttr = this.points.geometry.getAttribute('color');
      colorAttr.setXYZW(index, colorValues[0], colorValues[1], colorValues[2], colorValues[3]);
      colorAttr.needsUpdate = true;
    }

    // Update scale value (supports scale or size alias)
    const scaleValue = scale || size;
    if (scaleValue) {
      const scaleAttr = this.points.geometry.getAttribute('scale');
      scaleAttr.setX(index, scaleValue);
      scaleAttr.needsUpdate = true;
    }

    // Update angle value
    if (angle) {
      const angleAttr = this.points.geometry.getAttribute('angle');
      angleAttr.setX(index, angle);
      angleAttr.needsUpdate = true;
    }
  }

  addParticle(options) {
    // Add new particle with options
    options = Object.assign({
      position: [0.0, 0.0, 0.0],
      color: [1.0, 1.0, 1.0, 1.0],
      scale: 1.0,
      angle: 0.0
    }, options);

    // Increment draw count if the buffer is not full
    if (this.count < this.capacity) {
      this.count++;
      this.points.geometry.setDrawRange(0, this.count);
    }

    // Write particle data at current index
    this.update(this.index, options);

    // Increment and wrap index to ensure a circular buffer
    this.index = (this.index + 1) % this.capacity;
  }

  removeParticle(index) {
    // "Swap and pop" with last particle (very fast)
    const last = this.count - 1;
    if (index !== last) {
      const position = this.points.geometry.getAttribute('position');
      const color = this.points.geometry.getAttribute('color');
      const scale = this.points.geometry.getAttribute('scale');
      const angle = this.points.geometry.getAttribute('angle');

      this.update(index, {
        position: [
          position.getX(last),
          position.getY(last),
          position.getZ(last)
        ],
        color: [
          color.getX(last),
          color.getY(last),
          color.getZ(last),
          color.getW(last)
        ],
        scale: scale.getX(last),
        angle: angle.getX(last)
      });
    }

    // Decrement active count
    this.count--;
    this.points.geometry.setDrawRange(0, this.count);
  }

  removeAll() {
    this.count = 0;
    this.points.geometry.setDrawRange(0, 0);
  }

  translate(index, x, y, z) {
    // Update only position of particle at index
    const position = this.points.geometry.getAttribute('position');
    position.setXYZ(
      index,
      position.getX(index) + x,
      position.getY(index) + y,
      position.getZ(index) + z
    );
    position.needsUpdate = true;
  }

  translateWrap(index, x, y, z, range) {
    const position = this.points.geometry.getAttribute('position');
    position.setX(index, (((position.getX(index) + x + (range / 2)) % range + range) % range) - (range / 2));
    position.setY(index, (((position.getY(index) + y + (range / 2)) % range + range) % range) - (range / 2));
    position.setZ(index, (((position.getZ(index) + z + (range / 2)) % range + range) % range) - (range / 2));
    position.needsUpdate = true;
  }

  rotate(index, angle) {
    // Update only angle of particle at index
    const angleAttr = this.points.geometry.getAttribute('angle');
    angleAttr.setX(index, angleAttr.getX(index) + angle);
    angleAttr.needsUpdate = true;
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.url = this.url;
    json.size = this.size;
    json.capacity = this.capacity;
    json.magFilter = this.magFilter;
    json.minFilter = this.minFilter;
    return json;
  }

  static template = {
    alphaTest: 0.001,
    capacity: 1000,
    depthWrite: false,
    magFilter: 1003,
    minFilter: 1003,
    size: 1.0,
    sizeAttenuation: true,
    transparent: true,
    url: null
  }
}

export { EntityParticles };