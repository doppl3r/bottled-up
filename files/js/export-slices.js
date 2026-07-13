import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AseParser from 'ase-parser';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Paths
const asepriteSrcDir = path.resolve(projectRoot, 'files/aseprite');

/**
 * Extract pixel data from a CEL and return as Uint8Array (RGBA)
 */
function extractCelPixels(cel, canvasWidth, canvasHeight) {
  const pixelData = new Uint8Array(canvasWidth * canvasHeight * 4);
  
  if (!cel || !cel.rawCelData) {
    // Fill with transparent black if no CEL data
    return pixelData;
  }

  // rawCelData is the pixel buffer for this CEL
  // We need to composite it onto the canvas at the CEL's position
  const celPixels = cel.rawCelData;
  const celWidth = cel.w;
  const celHeight = cel.h;
  const celX = cel.xpos || 0;
  const celY = cel.ypos || 0;
  
  // Copy CEL pixels into canvas at the appropriate position
  for (let y = 0; y < celHeight; y++) {
    for (let x = 0; x < celWidth; x++) {
      const celIdx = (y * celWidth + x) * 4;
      const canvasIdx = ((celY + y) * canvasWidth + (celX + x)) * 4;
      
      if (canvasIdx + 3 < pixelData.length && celIdx + 3 < celPixels.length) {
        pixelData[canvasIdx] = celPixels[celIdx];         // R
        pixelData[canvasIdx + 1] = celPixels[celIdx + 1]; // G
        pixelData[canvasIdx + 2] = celPixels[celIdx + 2]; // B
        pixelData[canvasIdx + 3] = celPixels[celIdx + 3]; // A
      }
    }
  }
  
  return pixelData;
}

/**
 * Create a PNG from pixel data and save it
 */
function savePNG(filename, width, height, pixelData) {
  return new Promise((resolve, reject) => {
    const png = new PNG({ width, height });
    
    // Copy RGBA data into PNG buffer
    for (let i = 0; i < pixelData.length; i++) {
      png.data[i] = pixelData[i];
    }
    
    const stream = fs.createWriteStream(filename);
    png.pack()
      .pipe(stream)
      .on('finish', () => {
        // Display relative path from project root
        const relativePath = path.relative(projectRoot, filename);
        console.log(`  ✓ Exported: ${relativePath}`);
        resolve();
      })
      .on('error', reject);
  });
}

/**
 * Process a single aseprite file and export its slices
 */
async function processAsepriteFile(filePath) {
  const filename = path.basename(filePath);
  
  try {
    // Read and parse the aseprite file
    const buffer = fs.readFileSync(filePath);
    const ase = new AseParser(buffer);
    ase.parse();
    
    if (!ase.slices || ase.slices.length === 0) {
      console.log(`  ⚠ No slices found in ${filename}`);
      return;
    }

    console.log(`\nProcessing: ${filename}`);
    console.log(`  Found ${ase.slices.length} slice(s)`);

    // Export each slice
    for (const slice of ase.slices) {
      const sliceName = slice.name;
      const sliceIndex = slice.keys[0]?.frameNumber || 0;
      
      // Get the frame data for this slice
      const frame = ase.frames[sliceIndex];
      if (!frame) {
        console.log(`  ⚠ Frame ${sliceIndex} not found for slice "${sliceName}"`);
        continue;
      }

      // Parse the slice name to extract path and filename
      let outputDir, outputFilename;
      
      if (sliceName.includes('/') || sliceName.includes('\\')) {
        // Slice name includes a path (e.g., "/files/blend/textures/grass.png")
        const normalizedPath = sliceName.replace(/\\/g, '/');
        const lastSlash = normalizedPath.lastIndexOf('/');
        const dirPart = normalizedPath.substring(0, lastSlash);
        const filePart = normalizedPath.substring(lastSlash + 1);
        
        // Resolve relative to project root
        outputDir = path.resolve(projectRoot, dirPart.startsWith('/') ? dirPart.substring(1) : dirPart);
        outputFilename = filePart.endsWith('.png') ? filePart : `${filePart}.png`;
      } else {
        // No path in slice name - export to the aseprite file's directory
        outputDir = path.dirname(filePath);
        outputFilename = `${sliceName}.png`;
      }

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Extract the slice region from the frame
      const x = slice.keys[0]?.x || 0;
      const y = slice.keys[0]?.y || 0;
      const width = slice.keys[0]?.width || ase.width;
      const height = slice.keys[0]?.height || ase.height;

      // Create a buffer for this slice
      const slicePixels = new Uint8Array(width * height * 4);
      
      // Get the full canvas pixels from the frame's CEL
      const canvasPixels = extractCelPixels(frame.cels[0], ase.width, ase.height);
      
      // Copy the slice region
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const srcIdx = ((y + py) * ase.width + (x + px)) * 4;
          const dstIdx = (py * width + px) * 4;
          
          if (srcIdx + 3 < canvasPixels.length) {
            slicePixels[dstIdx] = canvasPixels[srcIdx];         // R
            slicePixels[dstIdx + 1] = canvasPixels[srcIdx + 1]; // G
            slicePixels[dstIdx + 2] = canvasPixels[srcIdx + 2]; // B
            slicePixels[dstIdx + 3] = canvasPixels[srcIdx + 3]; // A
          }
        }
      }

      // Save the slice as PNG
      const fullOutputPath = path.join(outputDir, outputFilename);
      await savePNG(fullOutputPath, width, height, slicePixels);
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${filename}:`, error.message);
  }
}

/**
 * Main export function
 */
async function exportAllSlices() {
  console.log('🎨 Aseprite Slice Exporter');
  console.log(`Source directory: ${asepriteSrcDir}`);
  console.log('Output: determined by slice names (or aseprite directory if no path)\n');

  try {
    // Read all files in the aseprite directory
    const files = fs.readdirSync(asepriteSrcDir);
    const asepriteFiles = files.filter(f => f.endsWith('.aseprite'));

    if (asepriteFiles.length === 0) {
      console.log('⚠ No .aseprite files found.');
      return;
    }

    console.log(`Found ${asepriteFiles.length} aseprite file(s)\n`);

    // Process each file
    for (const file of asepriteFiles) {
      const filePath = path.join(asepriteSrcDir, file);
      await processAsepriteFile(filePath);
    }

    console.log('\n✅ Export complete!');
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the exporter
exportAllSlices();
