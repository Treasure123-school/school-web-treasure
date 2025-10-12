
const sharp = require('sharp');
const fs = require('fs');

async function compressImage() {
  try {
    await sharp('uploads/hero-classroom.jpg')
      .resize(1200, 800, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 80,
        progressive: true,
        mozjpeg: true
      })
      .toFile('uploads/hero-classroom-compressed.jpg');
    
    console.log('Image compressed successfully!');
    
    // Get file sizes
    const original = fs.statSync('uploads/hero-classroom.jpg');
    const compressed = fs.statSync('uploads/hero-classroom-compressed.jpg');
    
    console.log(`Original size: ${(original.size / 1024).toFixed(2)} KB`);
    console.log(`Compressed size: ${(compressed.size / 1024).toFixed(2)} KB`);
    console.log(`Savings: ${((1 - compressed.size / original.size) * 100).toFixed(2)}%`);
  } catch (error) {
    console.error('Error compressing image:', error);
  }
}

compressImage();
