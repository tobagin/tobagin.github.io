#!/usr/bin/env node

/**
 * Performance Testing Script
 * Uses Puppeteer to run automated performance tests and measure Core Web Vitals
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Performance test configuration
const config = {
  baseUrl: process.env.TEST_URL || 'http://localhost:4000',
  outputDir: '_test/results',
  testPages: [
    { path: '/', name: 'Homepage' },
    { path: '/apps/sonar/', name: 'App Page - Sonar' },
    { path: '/apps/digger/', name: 'App Page - Digger' }
  ],
  thresholds: {
    LCP: 2500,    // Largest Contentful Paint
    FID: 100,     // First Input Delay  
    CLS: 0.1,     // Cumulative Layout Shift
    FCP: 1800,    // First Contentful Paint
    TTFB: 800     // Time to First Byte
  },
  viewport: {
    width: 1200,
    height: 800
  }
};

class PerformanceTester {
  constructor() {
    this.browser = null;
    this.results = {};
    this.errors = [];
  }

  async init() {
    console.log('🚀 Starting performance testing...');
    
    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-gpu',
        '--no-first-run'
      ]
    });

    console.log('✅ Browser launched');
  }

  async testPage(testPage) {
    const page = await this.browser.newPage();
    const url = `${config.baseUrl}${testPage.path}`;
    
    console.log(`📊 Testing ${testPage.name}: ${url}`);

    try {
      // Set viewport and user agent
      await page.setViewport(config.viewport);
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Enable performance monitoring
      await page.setCacheEnabled(false);

      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);

      // Measure Core Web Vitals
      const webVitals = await this.measureWebVitals(page);
      
      // Get additional performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(page);
      
      // Lighthouse audit
      const lighthouseScore = await this.runLighthouseAudit(page);

      // Resource analysis
      const resourceAnalysis = await this.analyzeResources(page);

      const result = {
        url,
        name: testPage.name,
        timestamp: new Date().toISOString(),
        webVitals,
        performanceMetrics,
        lighthouseScore,
        resourceAnalysis,
        passed: this.evaluateResults(webVitals)
      };

      this.results[testPage.name] = result;
      console.log(`✅ ${testPage.name} completed`);

    } catch (error) {
      console.error(`❌ Error testing ${testPage.name}:`, error.message);
      this.errors.push({
        page: testPage.name,
        url,
        error: error.message
      });
    } finally {
      await page.close();
    }
  }

  async measureWebVitals(page) {
    // Wait for web-vitals library and measurements
    await page.waitForTimeout(3000);

    return await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // Try to get metrics from our PerformanceUtils
        if (typeof PerformanceUtils !== 'undefined') {
          vitals.fromUtils = PerformanceUtils.getMetrics();
        }

        // Fallback measurements using Performance API
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          vitals.TTFB = navigation.responseStart - navigation.requestStart;
          vitals.domLoad = navigation.domContentLoadedEventEnd - navigation.navigationStart;
          vitals.pageLoad = navigation.loadEventEnd - navigation.navigationStart;
        }

        // FCP measurement
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
          vitals.FCP = fcpEntry.startTime;
        }

        // LCP measurement
        let lcpValue = 0;
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcpValue = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // CLS measurement
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Wait a bit then resolve
        setTimeout(() => {
          lcpObserver.disconnect();
          clsObserver.disconnect();
          
          vitals.LCP = lcpValue;
          vitals.CLS = clsValue;
          
          resolve(vitals);
        }, 2000);
      });
    });
  }

  async getPerformanceMetrics(page) {
    const metrics = await page.metrics();
    return {
      JSHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024 * 100) / 100, // MB
      JSHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024 * 100) / 100, // MB
      JSEventListeners: metrics.JSEventListeners,
      Nodes: metrics.Nodes,
      RecalcStyleCount: metrics.RecalcStyleCount,
      LayoutCount: metrics.LayoutCount
    };
  }

  async runLighthouseAudit(page) {
    // Simple lighthouse-style scoring based on our thresholds
    const vitals = this.results[Object.keys(this.results).pop()]?.webVitals || {};
    
    let score = 100;
    const deductions = {
      LCP: vitals.LCP > config.thresholds.LCP ? 20 : 0,
      FCP: vitals.FCP > config.thresholds.FCP ? 15 : 0,
      CLS: vitals.CLS > config.thresholds.CLS ? 25 : 0,
      TTFB: vitals.TTFB > config.thresholds.TTFB ? 10 : 0
    };

    score -= Object.values(deductions).reduce((sum, val) => sum + val, 0);
    
    return {
      performance: Math.max(0, score),
      deductions,
      category: score >= 90 ? 'good' : score >= 50 ? 'needs-improvement' : 'poor'
    };
  }

  async analyzeResources(page) {
    return await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      
      const analysis = {
        total: resources.length,
        totalSize: 0,
        byType: {
          stylesheet: { count: 0, size: 0 },
          script: { count: 0, size: 0 },
          image: { count: 0, size: 0 },
          font: { count: 0, size: 0 },
          other: { count: 0, size: 0 }
        },
        slow: [],
        renderBlocking: []
      };

      resources.forEach(resource => {
        const size = resource.transferSize || 0;
        const duration = resource.responseEnd - resource.startTime;
        
        analysis.totalSize += size;

        // Categorize by type
        let type = 'other';
        if (resource.name.includes('.css')) type = 'stylesheet';
        else if (resource.name.includes('.js')) type = 'script';
        else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) type = 'image';
        else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) type = 'font';

        analysis.byType[type].count++;
        analysis.byType[type].size += size;

        // Track slow resources (>1s)
        if (duration > 1000) {
          analysis.slow.push({
            name: resource.name.split('/').pop(),
            duration: Math.round(duration),
            size: Math.round(size / 1024)
          });
        }

        // Track render-blocking resources
        if ((type === 'stylesheet' || type === 'script') && resource.responseEnd < 1000) {
          analysis.renderBlocking.push({
            name: resource.name.split('/').pop(),
            type,
            duration: Math.round(duration)
          });
        }
      });

      // Convert sizes to KB
      analysis.totalSize = Math.round(analysis.totalSize / 1024);
      Object.keys(analysis.byType).forEach(type => {
        analysis.byType[type].size = Math.round(analysis.byType[type].size / 1024);
      });

      return analysis;
    });
  }

  evaluateResults(webVitals) {
    const results = {
      LCP: webVitals.LCP <= config.thresholds.LCP,
      FCP: webVitals.FCP <= config.thresholds.FCP,
      CLS: webVitals.CLS <= config.thresholds.CLS,
      TTFB: webVitals.TTFB <= config.thresholds.TTFB
    };

    const passedCount = Object.values(results).filter(Boolean).length;
    return {
      individual: results,
      overall: passedCount >= 3, // Pass if at least 3/4 metrics pass
      score: Math.round((passedCount / 4) * 100)
    };
  }

  async generateReport() {
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        totalPages: config.testPages.length,
        errors: this.errors.length,
        passed: Object.values(this.results).filter(r => r.passed.overall).length
      },
      thresholds: config.thresholds,
      results: this.results,
      errors: this.errors
    };

    // Save detailed JSON report
    const jsonPath = path.join(config.outputDir, 'performance-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(config.outputDir, 'performance-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    console.log(`📊 Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);

    return report;
  }

  generateHTMLReport(report) {
    const results = Object.values(report.results);
    const avgScore = results.length > 0 ? 
      Math.round(results.reduce((sum, r) => sum + r.passed.score, 0) / results.length) : 0;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Test Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card { background: white; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric { display: inline-block; margin: 0.5rem; padding: 0.5rem 1rem; border-radius: 4px; }
    .good { background: #d1e7dd; color: #0f5132; }
    .warning { background: #fff3cd; color: #664d03; }
    .poor { background: #f8d7da; color: #842029; }
    .score { font-size: 2rem; font-weight: bold; text-align: center; margin: 1rem 0; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Performance Test Report</h1>
    <div class="card">
      <h2>Summary</h2>
      <div class="score ${avgScore >= 90 ? 'good' : avgScore >= 50 ? 'warning' : 'poor'}">${avgScore}/100</div>
      <p><strong>Generated:</strong> ${report.summary.timestamp}</p>
      <p><strong>Pages Tested:</strong> ${report.summary.totalPages}</p>
      <p><strong>Pages Passed:</strong> ${report.summary.passed}/${report.summary.totalPages}</p>
      <p><strong>Errors:</strong> ${report.summary.errors}</p>
    </div>

    <div class="card">
      <h2>Test Results</h2>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>LCP (ms)</th>
            <th>FCP (ms)</th>
            <th>CLS</th>
            <th>TTFB (ms)</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(result => `
            <tr>
              <td>${result.name}</td>
              <td class="${result.webVitals.LCP <= config.thresholds.LCP ? 'good' : 'poor'}">${Math.round(result.webVitals.LCP || 0)}</td>
              <td class="${result.webVitals.FCP <= config.thresholds.FCP ? 'good' : 'poor'}">${Math.round(result.webVitals.FCP || 0)}</td>
              <td class="${result.webVitals.CLS <= config.thresholds.CLS ? 'good' : 'poor'}">${(result.webVitals.CLS || 0).toFixed(3)}</td>
              <td class="${result.webVitals.TTFB <= config.thresholds.TTFB ? 'good' : 'poor'}">${Math.round(result.webVitals.TTFB || 0)}</td>
              <td class="${result.passed.overall ? 'good' : 'poor'}">${result.passed.score}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${report.errors.length > 0 ? `
    <div class="card">
      <h2>Errors</h2>
      <ul>
        ${report.errors.map(error => `<li><strong>${error.page}:</strong> ${error.error}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async run() {
    try {
      await this.init();

      // Test each page
      for (const testPage of config.testPages) {
        await this.testPage(testPage);
      }

      // Generate report
      const report = await this.generateReport();

      // Print summary
      console.log('\n📈 Performance Test Summary:');
      console.log(`   Average Score: ${Math.round(Object.values(this.results).reduce((sum, r) => sum + r.passed.score, 0) / Object.keys(this.results).length)}%`);
      console.log(`   Pages Passed: ${Object.values(this.results).filter(r => r.passed.overall).length}/${config.testPages.length}`);
      console.log(`   Errors: ${this.errors.length}`);

      return report;

    } catch (error) {
      console.error('❌ Performance testing failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.run()
    .then(report => {
      const avgScore = Object.values(report.results).reduce((sum, r) => sum + r.passed.score, 0) / Object.keys(report.results).length;
      process.exit(avgScore >= 90 ? 0 : 1);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = PerformanceTester;