import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Parse command line arguments {#UV61}
const [inputFile, size, outputFile] = process.argv.slice(2);

// Validate input {#QY23}
if (!fs.existsSync(inputFile)) {
  console.error('Input file does not exist.');
  process.exit(1);
}

const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
const inputExtension = path.extname(inputFile).toLowerCase();

if (!validExtensions.includes(inputExtension)) {
  console.error('Invalid image format.');
  process.exit(1);
}

const [width, height] = size.split('x').map(Number);
if (isNaN(width) || isNaN(height)) {
  console.error('Invalid size format. Use WIDTHxHEIGHT.');
  process.exit(1);
}

// Load image {#MD29}
const image = sharp(inputFile);

// Determine best algorithm {#KU58}
const resizeOptions = {
  fit: sharp.fit.inside,
  withoutEnlargement: true,
};

// Resize image {#OR24}
image.resize(width, height, resizeOptions);

// Save resized image {#IA42}
image.toFile(outputFile, (err) => {
  if (err) {
    console.error('Error saving resized image:', err);
    process.exit(1);
  }

  // Display success message {#DT13}
  console.log(`Resizing process complete. Output file: ${outputFile}`);
});
