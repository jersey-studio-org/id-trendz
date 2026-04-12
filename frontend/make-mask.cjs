const Jimp = require('jimp');
const fs = require('fs');

async function processMask(inputFile, outputFile) {
  try {
    const image = await Jimp.read(inputFile);
    
    // Iterate over all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const alpha = this.bitmap.data[idx + 3];
      
      // If the pixel is not fully transparent, make it solid white
      if (alpha > 0) {
        this.bitmap.data[idx + 0] = 255; // R
        this.bitmap.data[idx + 1] = 255; // G
        this.bitmap.data[idx + 2] = 255; // B
        // Alpha remains so it contours perfectly
      }
    });

    await image.writeAsync(outputFile);
    console.log(`Successfully created ${outputFile}`);
  } catch (err) {
    console.error(`Error processing ${inputFile}:`, err);
  }
}

async function main() {
  await processMask('public/assets/jersey-front.png', 'public/assets/jersey-mask-front.png');
  await processMask('public/assets/jersey-back.png', 'public/assets/jersey-mask-back.png');
}

main();
