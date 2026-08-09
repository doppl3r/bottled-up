import {
  CubeTexture, SRGBColorSpace, Texture, CanvasTexture,
  EquirectangularReflectionMapping
} from 'three';

class TextureFactory {
  static createTextureCube(images) {
    const textureCube = new CubeTexture(images);
    textureCube.colorSpace = SRGBColorSpace;
    textureCube.needsUpdate = true;
    return textureCube;
  }

  static generateSkySphereTexture(options = {}) {
    const { width = 2048, height = 1024, colors = ['#ffffff', '#000000'] } = options;

    //Create a 2:1 canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // Draw a vertical gradient (North Pole to South Pole)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create the canvas texture
    const texture = new CanvasTexture(canvas);
    texture.mapping = EquirectangularReflectionMapping;
    return texture;
  }

  static emojiToPNG(emoji, width = 64, height = 64) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    // Update context
    ctx.font = `${height}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, width / 2, height / 2);
    
    // Return Base64 PNG string
    return canvas.toDataURL('image/png');
  }

  static emojiToTexture(emoji, width = 64, height = 64) {
    const pngDataURL = this.emojiToPNG(emoji, width, height);
    const texture = new Texture();
    const image = new Image();
    image.src = pngDataURL;
    texture.colorSpace = SRGBColorSpace;
    texture.image = image;
    texture.needsUpdate = true;
    return texture;
  }
}

export { TextureFactory };