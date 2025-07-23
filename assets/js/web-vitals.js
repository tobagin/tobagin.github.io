/**
 * Web Vitals Integration
 * Measures and reports Core Web Vitals metrics
 */

// Import web-vitals functions (loaded via CDN in template)
let webVitalsLoaded = false;

// Performance data collection
const PerformanceTracker = {
  metrics: {},
  
  init: function() {
    // Check if web-vitals is available
    if (typeof webVitals !== 'undefined') {
      this.setupWebVitals();
      webVitalsLoaded = true;
    } else {
      // Fallback to manual measurement
      this.setupFallbackMeasurement();
    }
    
    // Send metrics when page is about to unload
    this.setupReporting();
  },

  setupWebVitals: function() {
    // Measure Core Web Vitals
    webVitals.getCLS(this.onMetric.bind(this));
    webVitals.getFID(this.onMetric.bind(this));
    webVitals.getFCP(this.onMetric.bind(this));
    webVitals.getLCP(this.onMetric.bind(this));
    webVitals.getTTFB(this.onMetric.bind(this));
  },

  setupFallbackMeasurement: function() {
    // Fallback measurements using Performance API
    this.measureFCP();
    this.measureLCP();
    this.measureCLS();
    this.measureTTFB();
  },

  onMetric: function(metric) {
    // Store the metric
    this.metrics[metric.name] = {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now()
    };

    // Log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
    }

    // Real-time performance monitoring hook
    this.onMetricUpdate(metric);
  },

  onMetricUpdate: function(metric) {
    // Custom event for real-time monitoring
    window.dispatchEvent(new CustomEvent('webvital', {
      detail: metric
    }));

    // Update performance display if it exists
    const perfDisplay = document.getElementById('performance-metrics');
    if (perfDisplay) {
      this.updatePerformanceDisplay(perfDisplay);
    }
  },

  measureFCP: function() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.onMetric({
            name: 'FCP',
            value: entry.startTime,
            rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor',
            delta: entry.startTime,
            id: 'fcp-fallback'
          });
        }
      });
    });
    observer.observe({ entryTypes: ['paint'] });
  },

  measureLCP: function() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.onMetric({
        name: 'LCP',
        value: lastEntry.startTime,
        rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor',
        delta: lastEntry.startTime,
        id: 'lcp-fallback'
      });
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  },

  measureCLS: function() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.onMetric({
        name: 'CLS',
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
        delta: clsValue,
        id: 'cls-fallback'
      });
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  },

  measureTTFB: function() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.onMetric({
        name: 'TTFB',
        value: ttfb,
        rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor',
        delta: ttfb,
        id: 'ttfb-fallback'
      });
    }
  },

  setupReporting: function() {
    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });

    // Send metrics on visibility change (for SPA navigation)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics();
      }
    });

    // Periodic reporting for long sessions
    setInterval(() => {
      this.sendMetrics();
    }, 30000); // Every 30 seconds
  },

  sendMetrics: function() {
    if (Object.keys(this.metrics).length === 0) return;

    const payload = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      metrics: this.metrics,
      performance: this.getAdditionalMetrics()
    };

    // In development, just log the metrics
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Performance metrics:', payload);
      return;
    }

    // Send to analytics endpoint (implement as needed)
    this.sendToAnalytics(payload);
  },

  sendToAnalytics: function(payload) {
    // Send to privacy-first analytics if available
    if (window.PrivacyAnalytics && window.PrivacyAnalytics.enabled) {
      Object.keys(payload.metrics).forEach(metricName => {
        const metric = payload.metrics[metricName];
        window.PrivacyAnalytics.track('web_vital', {
          metric: metricName,
          value: Math.round(metric.value),
          rating: metric.rating,
          connectionType: payload.connection?.effectiveType,
          userAgent: this.anonymizeUserAgent(payload.userAgent)
        });
      });
    }
    
    // Development logging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Web Vitals sent to privacy analytics:', payload);
    }
  },

  getConnectionInfo: function() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  },

  getAdditionalMetrics: function() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return {};

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      domInteractive: navigation.domInteractive - navigation.navigationStart,
      redirectTime: navigation.redirectEnd - navigation.redirectStart,
      dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
      connectTime: navigation.connectEnd - navigation.connectStart,
      requestTime: navigation.responseEnd - navigation.requestStart
    };
  },
  
  anonymizeUserAgent: function(userAgent) {
    if (!userAgent) return 'unknown';
    // Anonymize user agent to protect privacy
    return userAgent.replace(/\d+\.\d+\.\d+/g, 'x.x.x')
                    .replace(/\([^)]*\)/g, '(...)')
                    .substring(0, 100);
  },

  updatePerformanceDisplay: function(container) {
    const metricsHtml = Object.keys(this.metrics).map(name => {
      const metric = this.metrics[name];
      const ratingClass = `rating-${metric.rating}`;
      return `
        <div class="metric ${ratingClass}">
          <span class="metric-name">${name}</span>
          <span class="metric-value">${Math.round(metric.value)}${name === 'CLS' ? '' : 'ms'}</span>
          <span class="metric-rating">${metric.rating}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <h3>Performance Metrics</h3>
      <div class="metrics-grid">${metricsHtml}</div>
    `;
  },

  // Public API
  getMetrics: function() {
    return this.metrics;
  },

  getScore: function() {
    const metrics = Object.values(this.metrics);
    if (metrics.length === 0) return null;

    const goodCount = metrics.filter(m => m.rating === 'good').length;
    return Math.round((goodCount / metrics.length) * 100);
  }
};

// Performance monitoring utilities
window.PerformanceUtils = {
  // Get current performance score
  getScore: function() {
    return PerformanceTracker.getScore();
  },

  // Get all metrics
  getMetrics: function() {
    return PerformanceTracker.getMetrics();
  },

  // Force metric reporting
  sendMetrics: function() {
    PerformanceTracker.sendMetrics();
  },

  // Add custom metric
  addCustomMetric: function(name, value, rating = 'good') {
    PerformanceTracker.onMetric({
      name: name,
      value: value,
      rating: rating,
      delta: value,
      id: `custom-${name}`,
      timestamp: Date.now()
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PerformanceTracker.init();
  });
} else {
  PerformanceTracker.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceTracker, PerformanceUtils };
}