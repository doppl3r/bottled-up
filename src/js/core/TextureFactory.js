import { CubeTexture, SRGBColorSpace, Texture } from 'three';

class TextureFactory {
  static createTextureCube(images) {
    const textureCube = new CubeTexture(images);
    textureCube.colorSpace = SRGBColorSpace;
    textureCube.needsUpdate = true;
    return textureCube;
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