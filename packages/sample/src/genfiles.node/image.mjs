import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Parse command line arguments {#UV61}
const [_, __, inputFile, size, outputFile] = process.argv;

// Validate Input {#QY23}
if (!inputFile || !size || !outputFile) {
  console.error('Missing arguments. Usage: node image.mjs <inputFile> <size> <outputFile>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error('Input file does not exist.');
  process.exit(1);
}

const dimensions = size.split('x');
if (dimensions.length !== 2 || isNaN(dimensions[0]) || isNaN(dimensions[1])) {
  console.error('Invalid dimensions. Use format: <width>x<height>');
  process.exit(1);
}

const ext = path.extname(outputFile).toLowerCase();
if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
  console.error('Invalid output file format. Supported formats: jpg, jpeg, png, webp');
  process.exit(1);
}

// Load image {#MD29}
sharp(inputFile)
  .metadata()
  .then(({ width, height }) => {
    // Determine Optimal Algorithm {#KU58}
    const algorithm = width * height > dimensions[0] * dimensions[1] ? 'lanczos3' : 'mitchell';

    // Resize image {#OR24}
    return sharp(inputFile)
      .resize(parseInt(dimensions[0]), parseInt(dimensions[1]), { kernel: algorithm })
      .toBuffer();
  })
  .then((buffer) => {
    // Save resized image {#IA42}
    return fs.promises.writeFile(outputFile, buffer);
  })
  .then(() => {
    // Display success message {#DT13}
    console.log(`Resizing complete. Output file: ${outputFile}`);
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
