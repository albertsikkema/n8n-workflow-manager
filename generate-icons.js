#!/usr/bin/env node

/**
 * Generate PNG icons from SVG source
 * Generates icon16.png, icon48.png, icon128.png for Chrome extension
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'icons');
const SIZES = [16, 48, 128];

async function generateIcons() {
  console.log('🎨 Generating icon PNGs from SVG...\n');

  // Generate active icons
  const activeSvg = fs.readFileSync(path.join(ICONS_DIR, 'icon.svg'));

  for (const size of SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon${size}.png`);

    await sharp(activeSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✅ Generated: icon${size}.png`);
  }

  // Generate inactive icons (grayscale)
  const inactiveSvg = fs.readFileSync(path.join(ICONS_DIR, 'icon-inactive.svg'));

  for (const size of SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon${size}-inactive.png`);

    await sharp(inactiveSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✅ Generated: icon${size}-inactive.png`);
  }

  console.log('\n✨ All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
