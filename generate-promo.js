#!/usr/bin/env node

/**
 * Generate promotional tile PNG from SVG
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'images');

async function generatePromo() {
  console.log('🎨 Generating promotional tile (440×280)...\n');

  const svgPath = path.join(IMAGES_DIR, 'promotional-tile.svg');
  const outputPath = path.join(IMAGES_DIR, 'promotional-tile.png');

  if (!fs.existsSync(svgPath)) {
    console.error('❌ Error: promotional-tile.svg not found');
    process.exit(1);
  }

  const svgContent = fs.readFileSync(svgPath);

  await sharp(svgContent)
    .resize(440, 280)
    .png()
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`✅ Generated: promotional-tile.png`);
  console.log(`   Dimensions: 440×280 pixels`);
  console.log(`   Size: ${sizeKB} KB`);
  console.log(`   Location: images/promotional-tile.png`);
  console.log('\n✨ Promotional tile ready for Chrome Web Store!');
}

generatePromo().catch(err => {
  console.error('❌ Error generating promotional tile:', err);
  process.exit(1);
});
