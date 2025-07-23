#!/usr/bin/env node

/**
 * SEO Validation Script
 * Validates SEO implementation across all generated pages
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const SITE_DIR = path.join(__dirname, '..', '_site');
const REQUIRED_META_TAGS = [
  'description',
  'keywords', 
  'author',
  'robots',
  'theme-color'
];

const REQUIRED_OG_TAGS = [
  'og:title',
  'og:description',
  'og:url',
  'og:type',
  'og:site_name'
];

async function validateSEO() {
  console.log('🔍 Starting SEO validation...\n');
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Find all HTML files
  const htmlFiles = findHTMLFiles(SITE_DIR);
  console.log(`Found ${htmlFiles.length} HTML files to validate\n`);
  
  for (const filePath of htmlFiles) {
    const relativePath = path.relative(SITE_DIR, filePath);
    console.log(`📄 Validating ${relativePath}...`);
    
    const { errors, warnings } = await validatePage(filePath, relativePath);
    totalErrors += errors;
    totalWarnings += warnings;
    
    if (errors === 0 && warnings === 0) {
      console.log('   ✅ All SEO checks passed\n');
    } else {
      console.log('');
    }
  }
  
  // Validate additional SEO files
  console.log('📋 Validating SEO infrastructure files...');
  const infraErrors = validateSEOInfrastructure();
  totalErrors += infraErrors;
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SEO VALIDATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total files validated: ${htmlFiles.length}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Total warnings: ${totalWarnings}`);
  
  if (totalErrors === 0) {
    console.log('\n🎉 SEO validation passed! All pages are properly optimized.');
    process.exit(0);
  } else {
    console.log(`\n❌ SEO validation failed with ${totalErrors} errors.`);
    process.exit(1);
  }
}

function findHTMLFiles(dir) {
  let htmlFiles = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip test directory
      if (item !== '_test') {
        htmlFiles = htmlFiles.concat(findHTMLFiles(fullPath));
      }
    } else if (item.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }
  
  return htmlFiles;
}

async function validatePage(filePath, relativePath) {
  let errors = 0;
  let warnings = 0;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(content);
    const document = dom.window.document;
    
    // Validate basic HTML structure
    const titleElement = document.querySelector('title');
    if (!titleElement || !titleElement.textContent.trim()) {
      console.log('   ❌ Missing or empty <title> tag');
      errors++;
    } else if (titleElement.textContent.length > 60) {
      console.log(`   ⚠️  Title too long (${titleElement.textContent.length} chars, recommend <60)`);
      warnings++;
    }
    
    // Validate meta tags
    for (const metaName of REQUIRED_META_TAGS) {
      const metaElement = document.querySelector(`meta[name="${metaName}"]`);
      if (!metaElement) {
        console.log(`   ❌ Missing meta tag: ${metaName}`);
        errors++;
      } else if (!metaElement.getAttribute('content')?.trim()) {
        console.log(`   ❌ Empty meta tag: ${metaName}`);
        errors++;
      }
    }
    
    // Validate description length
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      const descLength = descMeta.getAttribute('content')?.length || 0;
      if (descLength > 160) {
        console.log(`   ⚠️  Meta description too long (${descLength} chars, recommend <160)`);
        warnings++;
      } else if (descLength < 120) {
        console.log(`   ⚠️  Meta description too short (${descLength} chars, recommend 120-160)`);
        warnings++;
      }
    }
    
    // Validate Open Graph tags
    for (const ogProperty of REQUIRED_OG_TAGS) {
      const ogElement = document.querySelector(`meta[property="${ogProperty}"]`);
      if (!ogElement) {
        console.log(`   ❌ Missing Open Graph tag: ${ogProperty}`);
        errors++;
      } else if (!ogElement.getAttribute('content')?.trim()) {
        console.log(`   ❌ Empty Open Graph tag: ${ogProperty}`);
        errors++;
      }
    }
    
    // Validate Twitter Card tags
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      console.log('   ❌ Missing Twitter Card meta tag');
      errors++;
    }
    
    // Validate canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      console.log('   ❌ Missing canonical URL');
      errors++;
    } else {
      const href = canonical.getAttribute('href');
      if (!href || !href.startsWith('http')) {
        console.log('   ❌ Invalid canonical URL');
        errors++;
      }
    }
    
    // Validate structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    if (jsonLdScripts.length === 0) {
      console.log('   ❌ No structured data (JSON-LD) found');
      errors++;
    } else {
      for (let i = 0; i < jsonLdScripts.length; i++) {
        try {
          const jsonData = JSON.parse(jsonLdScripts[i].textContent);
          if (!jsonData['@context'] || !jsonData['@type']) {
            console.log(`   ❌ Invalid structured data schema ${i + 1}`);
            errors++;
          }
        } catch (e) {
          console.log(`   ❌ Malformed JSON-LD schema ${i + 1}`);
          errors++;
        }
      }
    }
    
    // Validate heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1s = document.querySelectorAll('h1');
    
    if (h1s.length === 0) {
      console.log('   ❌ No H1 heading found');
      errors++;
    } else if (h1s.length > 1) {
      console.log(`   ⚠️  Multiple H1 headings found (${h1s.length})`);
      warnings++;
    }
    
    // Validate images have alt text
    const images = document.querySelectorAll('img');
    let imagesWithoutAlt = 0;
    
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        imagesWithoutAlt++;
      }
    });
    
    if (imagesWithoutAlt > 0) {
      console.log(`   ⚠️  ${imagesWithoutAlt} images missing alt text`);
      warnings++;
    }
    
    // Validate lang attribute
    if (!document.documentElement.hasAttribute('lang')) {
      console.log('   ❌ Missing lang attribute on <html> element');
      errors++;
    }
    
    // Validate viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      console.log('   ❌ Missing viewport meta tag');
      errors++;
    }
    
  } catch (error) {
    console.log(`   ❌ Error parsing HTML: ${error.message}`);
    errors++;
  }
  
  return { errors, warnings };
}

function validateSEOInfrastructure() {
  let errors = 0;
  
  // Check sitemap.xml
  const sitemapPath = path.join(SITE_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.log('   ❌ sitemap.xml not found');
    errors++;
  } else {
    try {
      const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
      if (!sitemapContent.includes('<urlset')) {
        console.log('   ❌ Invalid sitemap.xml format');
        errors++;
      } else {
        console.log('   ✅ sitemap.xml is valid');
      }
    } catch (error) {
      console.log('   ❌ Error reading sitemap.xml');
      errors++;
    }
  }
  
  // Check robots.txt
  const robotsPath = path.join(SITE_DIR, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    console.log('   ❌ robots.txt not found');
    errors++;
  } else {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    if (!robotsContent.includes('Sitemap:')) {
      console.log('   ⚠️  robots.txt missing sitemap reference');
    } else {
      console.log('   ✅ robots.txt is valid');
    }
  }
  
  // Check web manifest
  const manifestPath = path.join(SITE_DIR, 'site.webmanifest');
  if (!fs.existsSync(manifestPath)) {
    console.log('   ❌ site.webmanifest not found');
    errors++;
  } else {
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      if (missingFields.length > 0) {
        console.log(`   ❌ Web manifest missing fields: ${missingFields.join(', ')}`);
        errors++;
      } else {
        console.log('   ✅ Web manifest is valid');
      }
    } catch (error) {
      console.log('   ❌ Invalid web manifest JSON');
      errors++;
    }
  }
  
  return errors;
}

// Run validation if called directly
if (require.main === module) {
  // Check if jsdom is available
  try {
    require('jsdom');
  } catch (error) {
    console.log('❌ jsdom not installed. Run: npm install --save-dev jsdom');
    process.exit(1);
  }
  
  validateSEO().catch(console.error);
}

module.exports = { validateSEO };