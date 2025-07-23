#!/usr/bin/env node

/**
 * Image Optimization Script
 * 
 * This script optimizes images for the GNOME apps portfolio website:
 * - Converts images to WebP format for better compression
 * - Generates responsive image variants (multiple sizes)
 * - Creates fallback images for browsers without WebP support
 * - Optimizes image quality while minimizing file size
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configuration
const config = {
  // Output directory for optimized images
  outputDir: 'assets/images',
  
  // Responsive image breakpoints (widths in pixels)
  breakpoints: [320, 640, 1024, 1280],
  
  // Image quality settings
  quality: {
    webp: 85,
    jpeg: 90,
    png: 90
  },
  
  // Directory structure
  directories: {
    icons: 'icons',
    screenshots: 'screenshots'
  }
};

/**
 * Download image from URL to local buffer
 */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Create a placeholder image for demonstration purposes
 */
async function createPlaceholderImage(width, height, text) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 63, g: 135, b: 228, alpha: 1 } // GNOME blue
    }
  })
  .composite([{
    input: Buffer.from(`
      <svg width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#3f87e4"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              fill="white" font-family="sans-serif" font-size="${Math.min(width, height) / 8}">
          ${text}
        </text>
      </svg>
    `),
    top: 0,
    left: 0,
  }])
  .png()
  .toBuffer();
}

/**
 * Generate responsive image variants for a given image
 */
async function generateResponsiveVariants(inputBuffer, outputPath, baseName) {
  const variants = [];
  
  // Get original image metadata
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width;
  
  // Generate variants for each breakpoint that's smaller than original
  for (const width of config.breakpoints) {
    if (width <= originalWidth) {
      // WebP variant
      const webpPath = `${outputPath}/${baseName}-${width}w.webp`;
      await sharp(inputBuffer)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: config.quality.webp })
        .toFile(webpPath);
      
      // JPEG fallback
      const jpegPath = `${outputPath}/${baseName}-${width}w.jpg`;
      await sharp(inputBuffer)
        .resize(width, null, { withoutEnlargement: true })
        .jpeg({ quality: config.quality.jpeg })
        .toFile(jpegPath);
      
      variants.push({
        width,
        webp: webpPath,
        jpeg: jpegPath
      });
    }
  }
  
  // Always include original size as largest variant
  if (!config.breakpoints.includes(originalWidth)) {
    const webpPath = `${outputPath}/${baseName}-${originalWidth}w.webp`;
    await sharp(inputBuffer)
      .webp({ quality: config.quality.webp })
      .toFile(webpPath);
    
    const jpegPath = `${outputPath}/${baseName}-${originalWidth}w.jpg`;
    await sharp(inputBuffer)
      .jpeg({ quality: config.quality.jpeg })
      .toFile(jpegPath);
    
    variants.push({
      width: originalWidth,
      webp: webpPath,
      jpeg: jpegPath
    });
  }
  
  return variants;
}

/**
 * Process app icon
 */
async function processIcon(appSlug, iconUrl, appName) {
  console.log(`Processing icon for ${appSlug}...`);
  
  try {
    let imageBuffer;
    
    try {
      // Try to download icon
      imageBuffer = await downloadImage(iconUrl);
    } catch (downloadError) {
      // Create placeholder icon if download fails
      console.log(`Creating placeholder icon for ${appSlug} (download failed)`);
      imageBuffer = await createPlaceholderImage(128, 128, appName);
    }
    
    // Create output directory
    const outputDir = path.join(config.outputDir, config.directories.icons, appSlug);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate variants
    const variants = await generateResponsiveVariants(imageBuffer, outputDir, 'icon');
    
    console.log(`✓ Generated ${variants.length} variants for ${appSlug} icon`);
    return variants;
  } catch (error) {
    console.error(`✗ Failed to process icon for ${appSlug}:`, error.message);
    return [];
  }
}

/**
 * Process app screenshots
 */
async function processScreenshots(appSlug, screenshots, appName) {
  console.log(`Processing screenshots for ${appSlug}...`);
  
  const allVariants = [];
  
  for (let i = 0; i < screenshots.length; i++) {
    const screenshotUrl = screenshots[i];
    
    try {
      let imageBuffer;
      
      try {
        // Try to download screenshot
        imageBuffer = await downloadImage(screenshotUrl);
      } catch (downloadError) {
        // Create placeholder screenshot if download fails
        console.log(`Creating placeholder screenshot ${i + 1} for ${appSlug} (download failed)`);
        imageBuffer = await createPlaceholderImage(1024, 768, `${appName}\nScreenshot ${i + 1}`);
      }
      
      // Create output directory
      const outputDir = path.join(config.outputDir, config.directories.screenshots, appSlug);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Generate variants
      const variants = await generateResponsiveVariants(
        imageBuffer, 
        outputDir, 
        `screenshot-${i + 1}`
      );
      
      allVariants.push({
        index: i,
        variants
      });
      
      console.log(`✓ Generated ${variants.length} variants for ${appSlug} screenshot ${i + 1}`);
    } catch (error) {
      console.error(`✗ Failed to process screenshot ${i + 1} for ${appSlug}:`, error.message);
    }
  }
  
  return allVariants;
}

/**
 * Load apps data from YAML file
 */
async function loadAppsData() {
  const yaml = require('js-yaml');
  const yamlContent = await fs.readFile('_data/apps.yml', 'utf8');
  return yaml.load(yamlContent);
}

/**
 * Generate image manifest for Jekyll consumption
 */
async function generateImageManifest(processedApps) {
  const manifest = {
    generated: new Date().toISOString(),
    apps: {}
  };
  
  for (const app of processedApps) {
    manifest.apps[app.slug] = {
      icon: app.iconVariants,
      screenshots: app.screenshotVariants
    };
  }
  
  // Write manifest to _data directory for Jekyll
  await fs.writeFile(
    '_data/image_manifest.json',
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('✓ Generated image manifest for Jekyll');
}

/**
 * Main optimization function
 */
async function optimizeImages() {
  console.log('🖼️  Starting image optimization...\n');
  
  try {
    // Create base output directory
    await fs.mkdir(config.outputDir, { recursive: true });
    
    // Load apps data
    const apps = await loadAppsData();
    console.log(`Found ${apps.length} apps to process\n`);
    
    const processedApps = [];
    
    for (const app of apps) {
      console.log(`Processing ${app.name} (${app.slug})...`);
      
      // Process icon
      const iconUrl = `https://dl.flathub.org/media/${app.flathub}/icons/128x128/${app.flathub}.png`;
      const iconVariants = await processIcon(app.slug, iconUrl, app.name);
      
      // Process screenshots (if they exist)
      let screenshotVariants = [];
      if (app.screenshots && app.screenshots.length > 0) {
        const screenshotUrls = app.screenshots.map(screenshot => 
          `https://dl.flathub.org/media/${app.flathub}/screenshots/${screenshot}_orig.webp`
        );
        screenshotVariants = await processScreenshots(app.slug, screenshotUrls, app.name);
      }
      
      processedApps.push({
        slug: app.slug,
        iconVariants,
        screenshotVariants
      });
      
      console.log(`✓ Completed processing ${app.name}\n`);
    }
    
    // Generate manifest for Jekyll
    await generateImageManifest(processedApps);
    
    console.log('🎉 Image optimization complete!');
    console.log(`Processed ${processedApps.length} apps with optimized images`);
    
  } catch (error) {
    console.error('❌ Image optimization failed:', error);
    process.exit(1);
  }
}

// Install js-yaml if needed
async function ensureDependencies() {
  try {
    require('js-yaml');
  } catch (error) {
    console.log('Installing js-yaml dependency...');
    const { execSync } = require('child_process');
    execSync('npm install js-yaml', { stdio: 'inherit' });
  }
}

// Run the optimization
if (require.main === module) {
  ensureDependencies().then(() => optimizeImages());
}

module.exports = { optimizeImages, generateResponsiveVariants, processIcon, processScreenshots };