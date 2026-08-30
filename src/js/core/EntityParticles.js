import { BufferAttribute, BufferGeometry, Points, ShaderMaterial, Texture } from 'three';
import { Entity } from './Entity.js';

/*
  EntityParticles adds a buffered particle system to an entity.
*/

class EntityParticles extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Update particle system properties
    this.capacity = options.capacity;
    this.count = 0;
    this.index = 0;
    this.atlasTexture = null;
    this.atlasHeight = 0;
    this.atlasWidth = 0;
    this.frustumCulled = false;

    // Create geometry for particles
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.capacity * 3), 3));
    geometry.setAttribute('rgba', new BufferAttribute(new Float32Array(this.capacity * 4), 4));
    geometry.setAttribute('size', new BufferAttribute(new Float32Array(this.capacity), 1));
    geometry.setAttribute('texture', new BufferAttribute(new Float32Array(this.capacity), 1));
    geometry.setDrawRange(0, 0);

    // Create shader material for particles
    const material = new ShaderMaterial({
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

    // Declare entity components
    this.points = new Points(geometry, material);
    this.points.layers.set(0);
    this.add(this.points);

    // Add particles component if entity is an instance of EntityParticles
    if (options.urls) {
      this.urls = options.urls;
      core.assets.loadBatch(options.urls, textures => {
        this.setTextures(textures, options);
        this.ready();
      });
    }
    else {
      this.ready();
    }
  }

  setTextures(textures, options) {
    // Add textures to entity
    this.urls = options.urls;

    // Add particles as child of entity
    this.createAtlas(textures);

    // Update texture properties
    this.points.material.uniforms.atlasTexture.value.magFilter = 1003;
    this.points.material.uniforms.atlasTexture.value.minFilter = 1003;
  }

  createAtlas(textures) {
    if (textures.length > 0) {
      // Update atlas uniform properties
      this.points.material.uniforms.atlasCount.value = textures.length;
      this.points.material.uniforms.atlasWidth.value = textures[0].image.width * textures.length;
      this.points.material.uniforms.atlasHeight.value = textures[0].image.height;

      if (textures.length === 1) {
        // Assign a single texture
        this.points.material.uniforms.atlasTexture.value = textures[0];
      }
      else {
        // Create canvas to build texture atlas
        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = this.points.material.uniforms.atlasWidth.value;
        atlasCanvas.height = this.points.material.uniforms.atlasHeight.value;

        // Draw each texture onto the atlas canvas
        const ctx = atlasCanvas.getContext('2d');
        textures.forEach((texture, i) => {
          ctx.drawImage(texture.image,
            i * texture.image.width,
            0,
            texture.image.width,
            this.points.material.uniforms.atlasHeight.value
          );
        });

        // Update atlas texture
        this.points.material.uniforms.atlasTexture.value = new Texture(atlasCanvas);
        this.points.material.uniforms.atlasTexture.value.colorSpace = 'srgb';
        this.points.material.uniforms.atlasTexture.value.needsUpdate = true;
      }
    }
  }

  update(index, options = {}) {
    // Update position
    if (options.position !== undefined) {
      const position = this.points.geometry.getAttribute('position');
      position.setXYZ(index, options.position.x, options.position.y, options.position.z);
      position.needsUpdate = true;
    }

    // Update rgba value
    if (options.rgba !== undefined) {
      const rgba = this.points.geometry.getAttribute('rgba');
      rgba.setXYZW(index, options.rgba[0], options.rgba[1], options.rgba[2], options.rgba[3]);
      rgba.needsUpdate = true;
    }

    // Update texture index
    if (options.texture !== undefined) {
      const texture = this.points.geometry.getAttribute('texture');
      texture.setX(index, options.texture);
      texture.needsUpdate = true;
    }

    // Update size value
    if (options.size !== undefined) {
      const size = this.points.geometry.getAttribute('size');
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

  addParticle(options) {
    // Add new particle with options
    options = Object.assign({
      position: { x: 0, y: 0, z: 0 },
      rgba: [1.0, 1.0, 1.0, 1.0],
      texture: 0,
      size: 16.0
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
      const texture = this.points.geometry.getAttribute('texture');
      const rgba = this.points.geometry.getAttribute('rgba');
      const size = this.points.geometry.getAttribute('size');
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

  translateAll(x, y, z) {
    // Translate all particles by delta
    for (let i = 0; i < this.count; i++) {
      this.translate(i, x, y, z);
    }
  }

  translateWrap(index, x, y, z, range) {
    const position = this.points.geometry.getAttribute('position');
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

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.urls = this.urls;
    return json;
  }

  static template = {
    attenuation: 0.0,
    capacity: 1000
  }
}

export { EntityParticles };