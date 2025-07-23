#!/usr/bin/env node

/**
 * Generate PWA icons script
 * Creates all required PWA icon sizes from a source image
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const PWA_ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Screenshot sizes for PWA manifest
const SCREENSHOT_SIZES = [
  { width: 1280, height: 720, name: 'screenshot-wide.png' },
  { width: 750, height: 1334, name: 'screenshot-narrow.png' }
];

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');
const SOURCE_ICON_PATH = path.join(ASSETS_DIR, 'site-logo.png');

async function generatePWAIcons() {
  console.log('Generating PWA icons...');
  
  // Ensure assets directory exists
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Check if source icon exists, if not create placeholder
  if (!fs.existsSync(SOURCE_ICON_PATH)) {
    console.log('Creating placeholder source icon...');
    await createPlaceholderIcon();
  }

  // Generate icon sizes
  for (const iconConfig of PWA_ICON_SIZES) {
    const outputPath = path.join(ASSETS_DIR, iconConfig.name);
    
    try {
      await sharp(SOURCE_ICON_PATH)
        .resize(iconConfig.size, iconConfig.size, {
          fit: 'contain',
          background: { r: 246, g: 245, b: 244, alpha: 1 } // GNOME light background
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${iconConfig.name} (${iconConfig.size}x${iconConfig.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${iconConfig.name}:`, error.message);
    }
  }

  // Generate screenshots if they don't exist
  await generatePlaceholderScreenshots();

  console.log('PWA icon generation complete!');
}

async function createPlaceholderIcon() {
  // Create a simple GNOME-style app icon
  const iconSvg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle with GNOME blue -->
      <circle cx="256" cy="256" r="240" fill="#3584e4" stroke="#1c71d8" stroke-width="8"/>
      
      <!-- App grid pattern -->
      <g fill="white" opacity="0.9">
        <!-- Row 1 -->
        <rect x="180" y="180" width="40" height="40" rx="8"/>
        <rect x="236" y="180" width="40" height="40" rx="8"/>
        <rect x="292" y="180" width="40" height="40" rx="8"/>
        
        <!-- Row 2 -->
        <rect x="180" y="236" width="40" height="40" rx="8"/>
        <rect x="236" y="236" width="40" height="40" rx="8"/>
        <rect x="292" y="236" width="40" height="40" rx="8"/>
        
        <!-- Row 3 -->
        <rect x="180" y="292" width="40" height="40" rx="8"/>
        <rect x="236" y="292" width="40" height="40" rx="8"/>
        <rect x="292" y="292" width="40" height="40" rx="8"/>
      </g>
      
      <!-- Central highlight -->
      <circle cx="256" cy="256" r="20" fill="white" opacity="0.3"/>
    </svg>
  `;

  await sharp(Buffer.from(iconSvg))
    .png()
    .toFile(SOURCE_ICON_PATH);
  
  console.log('✓ Created placeholder source icon');
}

async function generatePlaceholderScreenshots() {
  for (const screenshot of SCREENSHOT_SIZES) {
    const outputPath = path.join(ASSETS_DIR, screenshot.name);
    
    if (fs.existsSync(outputPath)) {
      console.log(`Screenshot ${screenshot.name} already exists, skipping...`);
      continue;
    }

    // Create SVG for screenshot
    const screenshotSvg = `
      <svg width="${screenshot.width}" height="${screenshot.height}" viewBox="0 0 ${screenshot.width} ${screenshot.height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#f6f5f4"/>
        
        <!-- Header -->
        <rect x="0" y="0" width="100%" height="80" fill="#ffffff" stroke="#deddda" stroke-width="1"/>
        <text x="40" y="50" font-family="system-ui" font-size="24" font-weight="600" fill="#241f31">Tobagin Apps</text>
        
        <!-- App grid simulation -->
        <g transform="translate(40, 120)">
          ${generateGridItems(screenshot.width - 80, screenshot.height - 200)}
        </g>
        
        <!-- Title -->
        <text x="${screenshot.width/2}" y="${screenshot.height - 40}" text-anchor="middle" font-family="system-ui" font-size="16" fill="#5e5c64">GNOME Application Portfolio</text>
      </svg>
    `;

    try {
      await sharp(Buffer.from(screenshotSvg))
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${screenshot.name} (${screenshot.width}x${screenshot.height})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${screenshot.name}:`, error.message);
    }
  }
}

function generateGridItems(width, height) {
  const cardWidth = Math.min(200, width / 3 - 20);
  const cardHeight = cardWidth * 1.4;
  const cols = Math.floor(width / (cardWidth + 20));
  const rows = Math.floor(height / (cardHeight + 20));
  
  let items = '';
  
  for (let row = 0; row < Math.min(rows, 3); row++) {
    for (let col = 0; col < Math.min(cols, 4); col++) {
      const x = col * (cardWidth + 20);
      const y = row * (cardHeight + 20);
      
      items += `
        <g transform="translate(${x}, ${y})">
          <!-- Card background -->
          <rect width="${cardWidth}" height="${cardHeight}" rx="12" fill="white" stroke="#deddda" stroke-width="1"/>
          
          <!-- App icon placeholder -->
          <rect x="20" y="20" width="60" height="60" rx="8" fill="#3584e4"/>
          
          <!-- App name -->
          <rect x="20" y="100" width="${cardWidth - 40}" height="16" rx="4" fill="#241f31" opacity="0.8"/>
          
          <!-- App description -->
          <rect x="20" y="125" width="${cardWidth - 60}" height="12" rx="4" fill="#5e5c64" opacity="0.6"/>
          <rect x="20" y="145" width="${cardWidth - 80}" height="12" rx="4" fill="#5e5c64" opacity="0.4"/>
        </g>
      `;
    }
  }
  
  return items;
}

// Run the script
if (require.main === module) {
  generatePWAIcons().catch(console.error);
}

module.exports = { generatePWAIcons };