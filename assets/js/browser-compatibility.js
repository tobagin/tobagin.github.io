/**
 * Browser Compatibility & Graceful Degradation Manager
 * Ensures optimal experience across different browsers and devices
 */

(function() {
  'use strict';

  const BrowserCompatibility = {
    // Browser detection and capabilities
    browser: {
      name: '',
      version: '',
      isModern: false,
      isLegacy: false,
      capabilities: {
        intersectionObserver: false,
        webVitals: false,
        serviceWorker: false,
        webGL: false,
        performanceObserver: false,
        requestIdleCallback: false,
        ES6: false,
        localStorage: false,
        sessionStorage: false
      }
    },

    // Fallback implementations
    fallbacks: new Map(),

    // Polyfill loading state
    polyfillsLoaded: false,

    init: function() {
      this.detectBrowser();
      this.detectCapabilities();
      this.setupGracefulDegradation();
      this.loadPolyfillsIfNeeded();
      this.setupFallbackFeatures();
      this.monitorCompatibility();
    },

    /**
     * Detect browser type and version
     */
    detectBrowser: function() {
      const ua = navigator.userAgent;
      
      // Chrome/Chromium detection
      if (ua.includes('Chrome/')) {
        this.browser.name = 'Chrome';
        const match = ua.match(/Chrome\/(\d+)/);
        this.browser.version = match ? parseInt(match[1]) : 0;
        this.browser.isModern = this.browser.version >= 90;
      }
      // Firefox detection
      else if (ua.includes('Firefox/')) {
        this.browser.name = 'Firefox';
        const match = ua.match(/Firefox\/(\d+)/);
        this.browser.version = match ? parseInt(match[1]) : 0;
        this.browser.isModern = this.browser.version >= 88;
      }
      // Safari detection
      else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
        this.browser.name = 'Safari';
        const match = ua.match(/Version\/(\d+)/);
        this.browser.version = match ? parseInt(match[1]) : 0;
        this.browser.isModern = this.browser.version >= 14;
      }
      // Edge detection
      else if (ua.includes('Edg/')) {
        this.browser.name = 'Edge';
        const match = ua.match(/Edg\/(\d+)/);
        this.browser.version = match ? parseInt(match[1]) : 0;
        this.browser.isModern = this.browser.version >= 90;
      }
      // Internet Explorer detection
      else if (ua.includes('MSIE') || ua.includes('Trident/')) {
        this.browser.name = 'Internet Explorer';
        this.browser.version = 11; // Assume IE11
        this.browser.isLegacy = true;
      }
      else {
        this.browser.name = 'Unknown';
        this.browser.version = 0;
      }

      console.log(`Detected browser: ${this.browser.name} ${this.browser.version}`);
    },

    /**
     * Detect browser capabilities
     */
    detectCapabilities: function() {
      const caps = this.browser.capabilities;

      // Core modern features
      caps.intersectionObserver = 'IntersectionObserver' in window;
      caps.performanceObserver = 'PerformanceObserver' in window;
      caps.requestIdleCallback = 'requestIdleCallback' in window;
      caps.serviceWorker = 'serviceWorker' in navigator;
      caps.webGL = this.detectWebGL();

      // Storage capabilities
      caps.localStorage = this.testLocalStorage();
      caps.sessionStorage = this.testSessionStorage();

      // ES6 support detection
      caps.ES6 = this.detectES6Support();

      // Web Vitals library support
      caps.webVitals = typeof webVitals !== 'undefined';

      // Add browser info to document for CSS targeting
      document.documentElement.setAttribute('data-browser', this.browser.name.toLowerCase());
      document.documentElement.setAttribute('data-browser-version', this.browser.version.toString());
      
      if (this.browser.isLegacy) {
        document.documentElement.classList.add('legacy-browser');
      } else if (this.browser.isModern) {
        document.documentElement.classList.add('modern-browser');
      }
    },

    /**
     * Detect WebGL support
     */
    detectWebGL: function() {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
      } catch (e) {
        return false;
      }
    },

    /**
     * Test localStorage availability
     */
    testLocalStorage: function() {
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Test sessionStorage availability
     */
    testSessionStorage: function() {
      try {
        const test = 'test';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Detect ES6 support
     */
    detectES6Support: function() {
      try {
        // Test arrow functions, template literals, const/let
        new Function('const test = (x) => `Hello ${x}`;');
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Setup graceful degradation strategies
     */
    setupGracefulDegradation: function() {
      // Intersection Observer fallback
      if (!this.browser.capabilities.intersectionObserver) {
        this.setupIntersectionObserverFallback();
      }

      // Performance Observer fallback
      if (!this.browser.capabilities.performanceObserver) {
        this.setupPerformanceObserverFallback();
      }

      // requestIdleCallback fallback
      if (!this.browser.capabilities.requestIdleCallback) {
        this.setupIdleCallbackFallback();
      }

      // localStorage fallback
      if (!this.browser.capabilities.localStorage) {
        this.setupStorageFallback();
      }

      // ES6 feature fallbacks
      if (!this.browser.capabilities.ES6) {
        this.setupES6Fallbacks();
      }
    },

    /**
     * Setup Intersection Observer fallback
     */
    setupIntersectionObserverFallback: function() {
      console.log('Setting up Intersection Observer fallback');
      
      // Create a simplified polyfill
      window.IntersectionObserver = function(callback, options) {
        this.callback = callback;
        this.options = options || {};
        this.observedElements = [];
        
        // Simple scroll-based detection
        const checkIntersection = () => {
          this.observedElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
            
            this.callback([{
              target: element,
              isIntersecting: isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0
            }]);
          });
        };

        this.observe = (element) => {
          this.observedElements.push(element);
          checkIntersection();
        };

        this.unobserve = (element) => {
          const index = this.observedElements.indexOf(element);
          if (index > -1) {
            this.observedElements.splice(index, 1);
          }
        };

        this.disconnect = () => {
          this.observedElements = [];
        };

        // Set up scroll listener for fallback
        let ticking = false;
        const scrollHandler = () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              checkIntersection();
              ticking = false;
            });
            ticking = true;
          }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
        window.addEventListener('resize', scrollHandler, { passive: true });
      };
    },

    /**
     * Setup Performance Observer fallback
     */
    setupPerformanceObserverFallback: function() {
      console.log('Setting up Performance Observer fallback');
      
      // Create a basic fallback that uses performance.getEntries()
      window.PerformanceObserver = function(callback) {
        this.callback = callback;
        this.entryTypes = [];
        
        this.observe = (options) => {
          this.entryTypes = options.entryTypes;
          
          // Use polling to check for new entries
          setInterval(() => {
            const entries = performance.getEntries().filter(entry => 
              this.entryTypes.includes(entry.entryType)
            );
            
            if (entries.length > 0) {
              this.callback({
                getEntries: () => entries
              });
            }
          }, 1000);
        };

        this.disconnect = () => {
          // Simple disconnect
        };
      };
    },

    /**
     * Setup requestIdleCallback fallback
     */
    setupIdleCallbackFallback: function() {
      console.log('Setting up requestIdleCallback fallback');
      
      window.requestIdleCallback = function(callback, options) {
        const opts = options || {};
        const timeout = opts.timeout || 5000;
        
        return setTimeout(() => {
          const start = performance.now();
          callback({
            didTimeout: false,
            timeRemaining: function() {
              return Math.max(0, 50 - (performance.now() - start));
            }
          });
        }, Math.min(timeout, 100));
      };

      window.cancelIdleCallback = function(id) {
        clearTimeout(id);
      };
    },

    /**
     * Setup storage fallback using cookies or memory
     */
    setupStorageFallback: function() {
      console.log('Setting up localStorage fallback');
      
      // Memory-based fallback
      const memoryStorage = {};
      
      window.localStorage = {
        getItem: function(key) {
          return memoryStorage[key] || null;
        },
        setItem: function(key, value) {
          memoryStorage[key] = value.toString();
        },
        removeItem: function(key) {
          delete memoryStorage[key];
        },
        clear: function() {
          Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
        },
        key: function(index) {
          return Object.keys(memoryStorage)[index] || null;
        },
        get length() {
          return Object.keys(memoryStorage).length;
        }
      };
    },

    /**
     * Setup ES6 feature fallbacks
     */
    setupES6Fallbacks: function() {
      console.log('Setting up ES6 fallbacks');
      
      // Array.includes polyfill
      if (!Array.prototype.includes) {
        Array.prototype.includes = function(searchElement, fromIndex) {
          return this.indexOf(searchElement, fromIndex) !== -1;
        };
      }

      // Object.assign polyfill
      if (!Object.assign) {
        Object.assign = function(target) {
          for (let i = 1; i < arguments.length; i++) {
            const source = arguments[i];
            for (const key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
      }

      // Promise polyfill (basic)
      if (!window.Promise) {
        window.Promise = function(executor) {
          const self = this;
          this.state = 'pending';
          this.value = undefined;
          this.handlers = [];

          function resolve(result) {
            if (self.state === 'pending') {
              self.state = 'fulfilled';
              self.value = result;
              self.handlers.forEach(handle);
              self.handlers = null;
            }
          }

          function reject(error) {
            if (self.state === 'pending') {
              self.state = 'rejected';
              self.value = error;
              self.handlers.forEach(handle);
              self.handlers = null;
            }
          }

          function handle(handler) {
            if (self.state === 'pending') {
              self.handlers.push(handler);
            } else {
              if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
                handler.onFulfilled(self.value);
              }
              if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
                handler.onRejected(self.value);
              }
            }
          }

          this.then = function(onFulfilled, onRejected) {
            return new Promise(function(resolve, reject) {
              handle({
                onFulfilled: function(result) {
                  try {
                    resolve(onFulfilled ? onFulfilled(result) : result);
                  } catch (ex) {
                    reject(ex);
                  }
                },
                onRejected: function(error) {
                  try {
                    resolve(onRejected ? onRejected(error) : error);
                  } catch (ex) {
                    reject(ex);
                  }
                }
              });
            });
          };

          executor(resolve, reject);
        };
      }
    },

    /**
     * Load polyfills if needed
     */
    loadPolyfillsIfNeeded: function() {
      const polyfillsNeeded = [];

      // Check for critical polyfills
      if (this.browser.isLegacy || !this.browser.capabilities.ES6) {
        polyfillsNeeded.push('es6');
      }

      if (!this.browser.capabilities.intersectionObserver && polyfillsNeeded.indexOf('intersection-observer') === -1) {
        // Our fallback handles this
      }

      if (polyfillsNeeded.length > 0) {
        this.loadPolyfills(polyfillsNeeded);
      }
    },

    /**
     * Load external polyfills
     */
    loadPolyfills: function(polyfills) {
      // For now, we'll use our built-in fallbacks
      // In a production environment, you might load polyfills from a CDN
      console.log('Polyfills handled by built-in fallbacks:', polyfills);
      this.polyfillsLoaded = true;
    },

    /**
     * Setup fallback features for missing functionality
     */
    setupFallbackFeatures: function() {
      // Disable features that require modern browser capabilities
      if (this.browser.isLegacy) {
        this.disableAdvancedFeatures();
      }

      // Setup alternative implementations
      this.setupAlternativeImplementations();
    },

    /**
     * Disable advanced features for legacy browsers
     */
    disableAdvancedFeatures: function() {
      console.log('Disabling advanced features for legacy browser');
      
      // Disable service worker registration
      if (!this.browser.capabilities.serviceWorker) {
        // Remove service worker registration code
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.textContent && script.textContent.includes('serviceWorker')) {
            script.textContent = script.textContent.replace(/navigator\.serviceWorker\.register[^}]+}/g, '');
          }
        });
      }

      // Simplify animations for better performance
      document.documentElement.style.setProperty('--transition-duration', '0s');
      
      // Disable complex visual effects
      document.documentElement.classList.add('no-effects');
    },

    /**
     * Setup alternative implementations
     */
    setupAlternativeImplementations: function() {
      // Alternative image loading for browsers without Intersection Observer
      if (!this.browser.capabilities.intersectionObserver) {
        this.setupFallbackImageLoading();
      }

      // Alternative analytics for browsers with limited capabilities
      this.setupFallbackAnalytics();
    },

    /**
     * Setup fallback image loading
     */
    setupFallbackImageLoading: function() {
      // Load all images immediately for legacy browsers
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(img => {
        img.removeAttribute('loading');
        img.classList.add('lazy-loaded');
      });
    },

    /**
     * Setup fallback analytics
     */
    setupFallbackAnalytics: function() {
      // Simplified analytics for legacy browsers
      if (this.browser.isLegacy && window.PrivacyAnalytics) {
        // Disable complex features
        window.PrivacyAnalytics.complexFeaturesEnabled = false;
        
        // Use simpler tracking methods
        const originalTrack = window.PrivacyAnalytics.track;
        window.PrivacyAnalytics.track = function(type, data) {
          // Simplified tracking that works in legacy browsers
          const simplifiedData = {
            type: type,
            timestamp: new Date().getTime(),
            url: window.location.href
          };
          return originalTrack.call(this, type, simplifiedData);
        };
      }
    },

    /**
     * Monitor compatibility issues
     */
    monitorCompatibility: function() {
      // Track JavaScript errors
      window.addEventListener('error', (e) => {
        this.trackCompatibilityIssue('javascript_error', {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          browser: this.browser.name,
          version: this.browser.version
        });
      });

      // Track unhandled promise rejections
      window.addEventListener('unhandledrejection', (e) => {
        this.trackCompatibilityIssue('promise_rejection', {
          reason: e.reason?.toString(),
          browser: this.browser.name,
          version: this.browser.version
        });
      });

      // Track feature usage and compatibility
      this.trackBrowserCapabilities();
    },

    /**
     * Track compatibility issues
     */
    trackCompatibilityIssue: function(type, data) {
      if (window.PrivacyAnalytics) {
        window.PrivacyAnalytics.track('compatibility_' + type, {
          ...data,
          userAgent: navigator.userAgent.substring(0, 100) // Truncated for privacy
        });
      }
    },

    /**
     * Track browser capabilities for analytics
     */
    trackBrowserCapabilities: function() {
      if (window.PrivacyAnalytics) {
        window.PrivacyAnalytics.track('browser_capabilities', {
          browser: this.browser.name,
          version: this.browser.version,
          isModern: this.browser.isModern,
          isLegacy: this.browser.isLegacy,
          intersectionObserver: this.browser.capabilities.intersectionObserver,
          performanceObserver: this.browser.capabilities.performanceObserver,
          serviceWorker: this.browser.capabilities.serviceWorker,
          localStorage: this.browser.capabilities.localStorage,
          ES6: this.browser.capabilities.ES6
        });
      }
    },

    /**
     * Get compatibility summary
     */
    getCompatibilitySummary: function() {
      return {
        browser: this.browser,
        polyfillsLoaded: this.polyfillsLoaded,
        fallbacksActive: this.fallbacks.size > 0,
        recommendedUpgrade: this.browser.isLegacy
      };
    }
  };

  // Initialize compatibility manager
  BrowserCompatibility.init();

  // Export for external access
  window.BrowserCompatibility = BrowserCompatibility;
})();