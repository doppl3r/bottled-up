import { BufferAttribute, BufferGeometry, Points, ShaderMaterial, Texture } from 'three';

/*
  A particle system that supports sprite atlases for efficient
  rendering of many particles.
*/

class Particles extends Points {
  constructor(options) {
    // Set default options
    options = Object.assign({
      attenuation: 0.0,
      capacity: 1000
    }, options);

    // Inherit from Three.js Points
    super();
    
    // Update particle system properties
    this.capacity = options.capacity;
    this.count = 0;
    this.index = 0;
    this.atlasTexture = null;
    this.atlasHeight = 0;
    this.atlasWidth = 0;
    this.particleHeight = 16;
    this.particleWidth = 16;
    this.frustumCulled = false;
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.capacity * 3), 3));
    this.geometry.setAttribute('rgba', new BufferAttribute(new Float32Array(this.capacity * 4), 4));
    this.geometry.setAttribute('size', new BufferAttribute(new Float32Array(this.capacity), 1));
    this.geometry.setAttribute('texture', new BufferAttribute(new Float32Array(this.capacity), 1));
    this.geometry.setDrawRange(0, 0);
    this.material = new ShaderMaterial({
      transparent: true,
      depthWrite: true,
      uniforms: {
        atlasTexture: { value: null },
        atlasCount: { value: 0 },
        atlasHeight: { value: 0 },
        atlasWidth: { value: 0 },
        attenuation: { value: options.attenuation },
      },
      vertexShader: `
        attribute float texture;
        attribute vec4 rgba;
        attribute float size;
        varying float v_texture;
        varying vec4 v_rgba;
        uniform float attenuation;
        void main() {
          v_texture = texture;
          v_rgba = rgba;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          float v_attenuationFactor = 1.0 - (gl_Position.z / gl_Position.w) * attenuation;
          gl_PointSize = size * v_attenuationFactor;
        }
      `,
      fragmentShader: `
        uniform sampler2D atlasTexture;
        uniform float atlasCount;
        uniform float atlasWidth;
        uniform float atlasHeight;
        varying float v_texture;
        varying vec4 v_rgba;
        void main() {
          vec4 f_rgba = v_rgba;
          float f_textureIndex = v_texture;
          if (atlasCount > 0.0) {
            float f_textureTileIndex = floor(f_textureIndex + 0.5);
            float f_tileWidth = 1.0 / atlasCount;
            vec2 f_uv = vec2(gl_PointCoord.x * f_tileWidth + f_textureTileIndex * f_tileWidth, 1.0 - gl_PointCoord.y);
            f_rgba *= texture2D(atlasTexture, f_uv);
          }
          if (f_rgba.a == 0.0) discard;
          gl_FragColor = f_rgba;
        }
      `
    });
  }

  createAtlas(textures) {
    if (textures.length > 0) {
      // Update atlas uniform properties
      this.material.uniforms.atlasCount.value = textures.length;
      this.material.uniforms.atlasWidth.value = textures[0].image.width * textures.length;
      this.material.uniforms.atlasHeight.value = textures[0].image.height;

      if (textures.length === 1) {
        // Assign a single texture
        this.material.uniforms.atlasTexture.value = textures[0];
      }
      else {
        // Create canvas to build texture atlas
        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = this.material.uniforms.atlasWidth.value;
        atlasCanvas.height = this.material.uniforms.atlasHeight.value;

        // Draw each texture onto the atlas canvas
        const ctx = atlasCanvas.getContext('2d');
        textures.forEach((texture, i) => {
          ctx.drawImage(texture.image,
            i * texture.image.width,
            0,
            texture.image.width,
            this.material.uniforms.atlasHeight.value
          );
        });

        // Update atlas texture
        this.material.uniforms.atlasTexture.value = new Texture(atlasCanvas);
        this.material.uniforms.atlasTexture.value.colorSpace = 'srgb';
        this.material.uniforms.atlasTexture.value.needsUpdate = true;
      }
    }
  }

  add(options) {
    // Add new particle with options
    options = Object.assign({
      position: { x: 0, y: 0, z: 0 },
      rgba: [1.0, 1.0, 1.0, 1.0],
      texture: 0,
      size: 8.0
    }, options);

    // Increment draw count if the buffer is not full
    if (this.count < this.capacity) {
      this.count++;
      this.geometry.setDrawRange(0, this.count);
    }

    // Write particle data at current index
    this.update(this.index, options);

    // Increment and wrap index to ensure a circular buffer
    this.index = (this.index + 1) % this.capacity;
  }

  update(index, options = {}) {
    // Update position
    if (options.position !== undefined) {
      const position = this.geometry.getAttribute('position');
      position.setXYZ(index, options.position.x, options.position.y, options.position.z);
      position.needsUpdate = true;
    }

    // Update rgba value
    if (options.rgba !== undefined) {
      const rgba = this.geometry.getAttribute('rgba');
      rgba.setXYZW(index, options.rgba[0], options.rgba[1], options.rgba[2], options.rgba[3]);
      rgba.needsUpdate = true;
    }

    // Update texture index
    if (options.texture !== undefined) {
      const texture = this.geometry.getAttribute('texture');
      texture.setX(index, options.texture);
      texture.needsUpdate = true;
    }

    // Update size value
    if (options.size !== undefined) {
      const size = this.geometry.getAttribute('size');
      size.setX(index, options.size);
      size.needsUpdate = true;
    }
  }

  updateAll(options) {
    // Update all particles with options
    for (let i = 0; i < this.count; i++) {
      this.update(i, options);
    }
  }

  remove(index) {
    // "Swap and pop" with last particle (very fast)
    const last = this.count - 1;
    if (index !== last) {
      const position = this.geometry.getAttribute('position');
      const texture = this.geometry.getAttribute('texture');
      const rgba = this.geometry.getAttribute('rgba');
      const size = this.geometry.getAttribute('size');
      this.update(index, {
        position: {
          x: position.getX(last),
          y: position.getY(last),
          z: position.getZ(last)
        },
        texture: texture.getX(last),
        rgba: [
          rgba.getX(last),
          rgba.getY(last),
          rgba.getZ(last),
          rgba.getW(last)
        ],
        size: size.getX(last)
      });
    }

    // Decrement active count
    this.count--;
    this.geometry.setDrawRange(0, this.count);
  }

  removeAll() {
    this.count = 0;
    this.geometry.setDrawRange(0, 0);
  }

  translate(index, x, y, z) {
    // Update only position of particle at index
    const position = this.geometry.getAttribute('position');
    position.setXYZ(
      index,
      position.getX(index) + x,
      position.getY(index) + y,
      position.getZ(index) + z
    );
    position.needsUpdate = true;
  }

  translateAll(x, y, z) {
    // Translate all particles by delta
    for (let i = 0; i < this.count; i++) {
      this.translate(i, x, y, z);
    }
  }

  translateWrap(index, x, y, z, range) {
    const position = this.geometry.getAttribute('position');
    position.setX(index, (((position.getX(index) + x + (range / 2)) % range + range) % range) - (range / 2));
    position.setY(index, (((position.getY(index) + y + (range / 2)) % range + range) % range) - (range / 2));
    position.setZ(index, (((position.getZ(index) + z + (range / 2)) % range + range) % range) - (range / 2));
    position.needsUpdate = true;
  }

  translateWrapAll(x, y, z, range) {
    // Move all particles down by speed
    for (let i = 0; i < this.count; i++) {
      this.translateWrap(i, x, y, z, range);
    }
  }
}

export { Particles };