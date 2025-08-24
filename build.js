#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const ejs = require('ejs');
const { minify } = require('html-minifier-terser');
const CleanCSS = require('clean-css');

class ModernSiteGenerator {
  constructor() {
    this.srcDir = path.join(__dirname, 'src');
    this.distDir = path.join(__dirname, 'dist');
    this.templatesDir = path.join(this.srcDir, 'templates');
    this.stylesDir = path.join(this.srcDir, 'styles');
    this.dataDir = path.join(this.srcDir, 'data');
    this.assetsDir = path.join(this.srcDir, 'assets');
    
    this.apps = [];
    this.buildStartTime = Date.now();
  }

  async build() {
    console.log('🚀 Starting modern site generation...');
    
    try {
      // Clean and prepare dist directory
      await this.cleanDist();
      
      // Load data
      await this.loadData();
      
      // Generate pages
      await this.generatePages();
      
      // Process styles
      await this.processStyles();
      
      // Copy assets
      await this.copyAssets();
      
      // Generate sitemap and robots.txt
      await this.generateMeta();
      
      const buildTime = Date.now() - this.buildStartTime;
      console.log(`✅ Site generated successfully in ${buildTime}ms`);
      console.log(`📁 Output directory: ${this.distDir}`);
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async cleanDist() {
    await fs.emptyDir(this.distDir);
    console.log('🧹 Cleaned dist directory');
  }

  async loadData() {
    const appsFile = path.join(this.dataDir, 'apps.yml');
    const appsData = await fs.readFile(appsFile, 'utf8');
    this.apps = yaml.load(appsData) || [];
    
    // Sort apps alphabetically by name
    this.apps.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`📊 Loaded ${this.apps.length} apps (sorted alphabetically)`);
  }

  async generatePages() {
    console.log('📝 Generating pages...');
    
    // Generate home page
    await this.generateHomePage();
    
    // Generate individual app pages
    await this.generateAppPages();
    
    // Generate additional pages
    await this.generateAdditionalPages();
  }

  async generateHomePage() {
    const templatePath = path.join(this.templatesDir, 'index.ejs');
    const template = await fs.readFile(templatePath, 'utf8');
    
    const html = ejs.render(template, {
      apps: this.apps,
      title: 'Tobagin Apps - Modern GNOME Applications',
      description: 'Discover beautiful, modern open source applications for the GNOME desktop.',
      url: 'https://tobagin.github.io'
    }, {
      views: [this.templatesDir],
      filename: templatePath
    });

    const minifiedHtml = await minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true
    });

    await fs.writeFile(path.join(this.distDir, 'index.html'), minifiedHtml);
  }

  async generateAppPages() {
    const templatePath = path.join(this.templatesDir, 'app.ejs');
    const template = await fs.readFile(templatePath, 'utf8');
    
    await fs.ensureDir(path.join(this.distDir, 'apps'));
    
    for (const app of this.apps) {
      const html = ejs.render(template, {
        app,
        title: `${app.name} - ${app.tagline}`,
        description: app.tagline,
        url: `https://tobagin.github.io/apps/${app.slug}`
      }, {
        views: [this.templatesDir],
        filename: templatePath
      });

      const minifiedHtml = await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true
      });

      const appDir = path.join(this.distDir, 'apps', app.slug);
      await fs.ensureDir(appDir);
      await fs.writeFile(path.join(appDir, 'index.html'), minifiedHtml);
    }
  }

  async generateAdditionalPages() {
    // Generate privacy page (copy existing)
    if (await fs.pathExists('privacy.html')) {
      await fs.copy('privacy.html', path.join(this.distDir, 'privacy.html'));
    }
  }

  async processStyles() {
    console.log('🎨 Processing styles...');
    
    const mainStylePath = path.join(this.stylesDir, 'main.css');
    const mainStyle = await fs.readFile(mainStylePath, 'utf8');
    
    // Load component styles
    const componentsDir = path.join(this.stylesDir, 'components');
    let componentStyles = '';
    
    if (await fs.pathExists(componentsDir)) {
      const componentFiles = await fs.readdir(componentsDir);
      for (const file of componentFiles) {
        if (file.endsWith('.css')) {
          const componentStyle = await fs.readFile(path.join(componentsDir, file), 'utf8');
          componentStyles += `\n/* ${file} */\n${componentStyle}`;
        }
      }
    }

    const combinedCSS = mainStyle + componentStyles;
    
    // Minify CSS
    const cleanCSS = new CleanCSS({
      level: 2,
      returnPromise: true
    });
    
    const minified = await cleanCSS.minify(combinedCSS);
    
    await fs.ensureDir(path.join(this.distDir, 'styles'));
    await fs.writeFile(path.join(this.distDir, 'styles', 'main.css'), minified.styles);
  }

  async copyAssets() {
    console.log('📁 Copying assets...');
    
    if (await fs.pathExists(this.assetsDir)) {
      await fs.copy(this.assetsDir, path.join(this.distDir, 'assets'));
    }
    
    // Copy other static files
    const staticFiles = ['robots.txt', 'site.webmanifest', 'sw.js'];
    for (const file of staticFiles) {
      if (await fs.pathExists(file)) {
        await fs.copy(file, path.join(this.distDir, file));
      }
    }
  }

  async generateMeta() {
    console.log('🗺️ Generating sitemap...');
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tobagin.github.io/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;

    for (const app of this.apps) {
      sitemap += `
  <url>
    <loc>https://tobagin.github.io/apps/${app.slug}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    sitemap += '\n</urlset>';
    
    await fs.writeFile(path.join(this.distDir, 'sitemap.xml'), sitemap);
  }
}

// Run the generator
if (require.main === module) {
  const generator = new ModernSiteGenerator();
  generator.build();
}

module.exports = ModernSiteGenerator;