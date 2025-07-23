/**
 * Performance Optimizer
 * Advanced performance optimization strategies for the Jekyll site
 */

(function() {
  'use strict';

  const PerformanceManager = {
    // Performance configuration
    config: {
      maxScriptLoadTime: 3000, // 3 seconds
      maxStyleLoadTime: 2000,  // 2 seconds
      criticalCSSThreshold: 1000, // 1KB
      prefetchDelay: 2000,     // 2 seconds after load
      idleCallbackTimeout: 5000 // 5 seconds
    },

    // Performance metrics
    metrics: {
      scriptLoadTimes: new Map(),
      resourceLoadTimes: new Map(),
      domContentLoadedTime: 0,
      firstContentfulPaint: 0,
      timeToInteractive: 0
    },

    // Resource loading state
    loadingState: {
      criticalCSS: false,
      deferredScripts: [],
      prefetchQueue: [],
      idleQueue: []
    },

    init: function() {
      this.measurePerformance();
      this.optimizeScriptLoading();
      this.setupResourceHints();
      this.setupIdleOptimizations();
      this.monitorResourceLoading();
    },

    /**
     * Measure key performance metrics
     */
    measurePerformance: function() {
      // Measure DOM Content Loaded time
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.metrics.domContentLoadedTime = performance.now();
          this.trackMetric('dom_content_loaded', this.metrics.domContentLoadedTime);
        });
      } else {
        this.metrics.domContentLoadedTime = 0; // Already loaded
      }

      // Measure First Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              if (entry.name === 'first-contentful-paint') {
                this.metrics.firstContentfulPaint = entry.startTime;
                this.trackMetric('first_contentful_paint', entry.startTime);
              }
            });
          });
          observer.observe({ entryTypes: ['paint'] });
        } catch (e) {
          console.warn('Performance Observer not supported for paint metrics');
        }
      }

      // Estimate Time to Interactive
      window.addEventListener('load', () => {
        // TTI is approximately when all critical resources are loaded
        // and main thread is available
        setTimeout(() => {
          this.metrics.timeToInteractive = performance.now();
          this.trackMetric('time_to_interactive', this.metrics.timeToInteractive);
        }, 100);
      });
    },

    /**
     * Optimize script loading strategies
     */
    optimizeScriptLoading: function() {
      // Monitor existing script loading
      this.monitorScriptPerformance();

      // Implement dynamic script loading for non-critical scripts
      this.setupDynamicScriptLoading();

      // Preload critical scripts
      this.preloadCriticalScripts();
    },

    /**
     * Monitor script loading performance
     */
    monitorScriptPerformance: function() {
      const scripts = document.querySelectorAll('script[src]');
      
      scripts.forEach(script => {
        const startTime = performance.now();
        const src = script.src;

        script.addEventListener('load', () => {
          const loadTime = performance.now() - startTime;
          this.metrics.scriptLoadTimes.set(src, loadTime);
          
          if (loadTime > this.config.maxScriptLoadTime) {
            console.warn(`Slow script load detected: ${src} took ${loadTime.toFixed(2)}ms`);
            this.trackMetric('slow_script_load', loadTime, { script: src });
          }
        });

        script.addEventListener('error', () => {
          console.error(`Script failed to load: ${src}`);
          this.trackMetric('script_load_error', 0, { script: src });
        });
      });
    },

    /**
     * Setup dynamic script loading for enhanced performance
     */
    setupDynamicScriptLoading: function() {
      // Load non-critical scripts after initial page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.loadDeferredScripts();
        }, this.config.prefetchDelay);
      });
    },

    /**
     * Load deferred scripts based on user interaction or idle time
     */
    loadDeferredScripts: function() {
      const deferredScripts = [
        // Additional analytics scripts can be loaded here
        // { src: '/assets/js/additional-analytics.js', condition: 'idle' },
        // { src: '/assets/js/advanced-features.js', condition: 'interaction' }
      ];

      deferredScripts.forEach(scriptConfig => {
        if (scriptConfig.condition === 'idle') {
          this.loadOnIdle(scriptConfig.src);
        } else if (scriptConfig.condition === 'interaction') {
          this.loadOnInteraction(scriptConfig.src);
        }
      });
    },

    /**
     * Load script when browser is idle
     */
    loadOnIdle: function(src) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.dynamicLoadScript(src);
        }, { timeout: this.config.idleCallbackTimeout });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          this.dynamicLoadScript(src);
        }, this.config.prefetchDelay);
      }
    },

    /**
     * Load script on first user interaction
     */
    loadOnInteraction: function(src) {
      const events = ['click', 'scroll', 'keydown', 'touchstart'];
      let loaded = false;

      const loadScript = () => {
        if (!loaded) {
          loaded = true;
          this.dynamicLoadScript(src);
          events.forEach(event => {
            document.removeEventListener(event, loadScript);
          });
        }
      };

      events.forEach(event => {
        document.addEventListener(event, loadScript, { once: true, passive: true });
      });
    },

    /**
     * Dynamically load a script
     */
    dynamicLoadScript: function(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        
        const startTime = performance.now();

        script.onload = () => {
          const loadTime = performance.now() - startTime;
          this.metrics.scriptLoadTimes.set(src, loadTime);
          this.trackMetric('dynamic_script_load', loadTime, { script: src });
          resolve();
        };

        script.onerror = () => {
          this.trackMetric('dynamic_script_error', 0, { script: src });
          reject(new Error(`Failed to load script: ${src}`));
        };

        document.head.appendChild(script);
      });
    },

    /**
     * Preload critical scripts for better performance
     */
    preloadCriticalScripts: function() {
      const criticalScripts = [
        '/assets/js/privacy-analytics.js',
        '/assets/js/filter-manager.js'
      ];

      // Only preload on fast connections
      if (this.isFastConnection()) {
        criticalScripts.forEach(src => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'script';
          link.href = src;
          document.head.appendChild(link);
        });
      }
    },

    /**
     * Setup resource hints for improved loading
     */
    setupResourceHints: function() {
      // DNS prefetch for external domains
      const externalDomains = [
        'flathub.org',
        'github.com',
        'unpkg.com'
      ];

      externalDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = `//${domain}`;
        document.head.appendChild(link);
      });

      // Preconnect to critical external resources
      this.setupPreconnect();

      // Prefetch likely next pages
      this.setupPrefetching();
    },

    /**
     * Setup preconnect hints for critical external resources
     */
    setupPreconnect: function() {
      const criticalExternalResources = [
        'https://unpkg.com' // Web Vitals library
      ];

      if (this.isFastConnection()) {
        criticalExternalResources.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = url;
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        });
      }
    },

    /**
     * Setup intelligent prefetching
     */
    setupPrefetching: function() {
      // Wait for page to be interactive before prefetching
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.prefetchLikelyPages();
        }, this.config.prefetchDelay);
      });
    },

    /**
     * Prefetch likely next pages based on user behavior
     */
    prefetchLikelyPages: function() {
      if (!this.isFastConnection()) return;

      // Prefetch app pages when hovering over app cards
      const appCards = document.querySelectorAll('.card[href^="/apps"], .card[href^="apps"]');
      
      appCards.forEach(card => {
        let prefetched = false;
        
        card.addEventListener('mouseenter', () => {
          if (!prefetched && this.shouldPrefetch()) {
            prefetched = true;
            this.prefetchPage(card.href);
          }
        }, { passive: true });

        // Also prefetch on focus for keyboard users
        card.addEventListener('focus', () => {
          if (!prefetched && this.shouldPrefetch()) {
            prefetched = true;
            this.prefetchPage(card.href);
          }
        }, { passive: true });
      });
    },

    /**
     * Prefetch a specific page
     */
    prefetchPage: function(url) {
      // Use link prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);

      this.trackMetric('page_prefetch', 0, { url: url });
    },

    /**
     * Setup idle-time optimizations
     */
    setupIdleOptimizations: function() {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.performIdleOptimizations();
        }, { timeout: this.config.idleCallbackTimeout });
      }
    },

    /**
     * Perform optimizations during idle time
     */
    performIdleOptimizations: function() {
      // Optimize images during idle time
      this.optimizeIdleImages();
      
      // Cleanup unused resources
      this.cleanupUnusedResources();
      
      // Prepare analytics data export
      this.prepareAnalyticsExport();
    },

    /**
     * Optimize images during idle time
     */
    optimizeIdleImages: function() {
      const unloadedImages = document.querySelectorAll('img[loading="lazy"]:not(.lazy-loaded)');
      
      // Preload a few more images if connection is good
      if (this.isFastConnection() && unloadedImages.length > 0) {
        const imagesToPreload = Array.from(unloadedImages).slice(0, 3);
        imagesToPreload.forEach(img => {
          if (window.LazyImageLoader) {
            window.LazyImageLoader.loadImage(img);
          }
        });
      }
    },

    /**
     * Cleanup unused resources during idle time
     */
    cleanupUnusedResources: function() {
      // Remove completed link prefetch elements
      const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
      prefetchLinks.forEach(link => {
        // Remove old prefetch links to free up memory
        if (link.href && performance.getEntriesByName(link.href).length > 0) {
          link.remove();
        }
      });
    },

    /**
     * Prepare analytics data export during idle time
     */
    prepareAnalyticsExport: function() {
      if (window.PrivacyAnalytics) {
        // Pre-calculate engagement metrics during idle time
        window.PrivacyAnalytics.calculateEngagementMetrics();
        
        // Clean expired data during idle time
        if (typeof window.PrivacyAnalytics.cleanExpiredData === 'function') {
          window.PrivacyAnalytics.cleanExpiredData();
        }
      }
    },

    /**
     * Monitor resource loading performance
     */
    monitorResourceLoading: function() {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              if (entry.duration > 1000) { // Slow resource (>1s)
                this.trackMetric('slow_resource_load', entry.duration, {
                  resource: entry.name,
                  type: entry.initiatorType
                });
              }
            });
          });
          observer.observe({ entryTypes: ['resource'] });
        } catch (e) {
          console.warn('Performance Observer not supported for resource monitoring');
        }
      }
    },

    /**
     * Check if connection is fast enough for aggressive optimizations
     */
    isFastConnection: function() {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        return connection.effectiveType === '4g' || 
               (connection.effectiveType === '3g' && connection.downlink > 1.5);
      }
      // Assume fast connection if we can't detect
      return true;
    },

    /**
     * Check if we should prefetch resources
     */
    shouldPrefetch: function() {
      // Don't prefetch on slow connections or if data saver is enabled
      if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.saveData || 
            connection.effectiveType === 'slow-2g' || 
            connection.effectiveType === '2g') {
          return false;
        }
      }
      return true;
    },

    /**
     * Track performance metrics
     */
    trackMetric: function(name, value, metadata = {}) {
      if (window.PrivacyAnalytics) {
        window.PrivacyAnalytics.track('performance_' + name, {
          value: Math.round(value),
          connectionType: navigator.connection?.effectiveType,
          deviceMemory: navigator.deviceMemory,
          ...metadata
        });
      }
    },

    /**
     * Get performance summary
     */
    getPerformanceSummary: function() {
      return {
        metrics: {
          domContentLoaded: this.metrics.domContentLoadedTime,
          firstContentfulPaint: this.metrics.firstContentfulPaint,
          timeToInteractive: this.metrics.timeToInteractive
        },
        scriptLoadTimes: Object.fromEntries(this.metrics.scriptLoadTimes),
        connectionInfo: {
          type: navigator.connection?.effectiveType,
          downlink: navigator.connection?.downlink,
          rtt: navigator.connection?.rtt,
          saveData: navigator.connection?.saveData
        },
        deviceInfo: {
          memory: navigator.deviceMemory,
          cores: navigator.hardwareConcurrency
        }
      };
    }
  };

  // Initialize performance manager
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PerformanceManager.init();
    });
  } else {
    PerformanceManager.init();
  }

  // Export for external access
  window.PerformanceManager = PerformanceManager;
})();