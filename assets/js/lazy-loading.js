/**
 * Enhanced Lazy Loading & Performance Manager
 * 
 * Implements optimized lazy loading with priority loading, resource preloading,
 * performance monitoring, and adaptive optimization strategies.
 */

// Performance monitoring utilities
const PerformanceOptimizer = {
  connectionType: null,
  deviceMemory: null,
  isLowEnd: false,
  
  init: function() {
    // Detect connection type
    if ('connection' in navigator) {
      this.connectionType = navigator.connection.effectiveType;
    }
    
    // Detect device memory
    if ('deviceMemory' in navigator) {
      this.deviceMemory = navigator.deviceMemory;
      this.isLowEnd = navigator.deviceMemory <= 2; // 2GB or less
    }
    
    // Detect slow connection
    if (this.connectionType === 'slow-2g' || this.connectionType === '2g') {
      this.isLowEnd = true;
    }
  },
  
  shouldOptimizeAggressively: function() {
    return this.isLowEnd || this.connectionType === 'slow-2g' || this.connectionType === '2g';
  },
  
  getOptimalImageQuality: function() {
    if (this.shouldOptimizeAggressively()) return 60;
    if (this.connectionType === '3g') return 75;
    return 85; // High quality for fast connections
  }
};

const LazyImageLoader = {
  // Configuration
  config: {
    rootMargin: '50px 0px',
    threshold: 0.01,
    loadingClass: 'lazy-loading',
    loadedClass: 'lazy-loaded',
    errorClass: 'lazy-error',
    priorityClass: 'priority-load',
    aboveFoldMargin: '20px 0px',
    maxConcurrentLoads: 3
  },
  
  // State tracking
  currentlyLoading: 0,
  loadQueue: [],
  performanceMetrics: {
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    avgLoadTime: 0,
    loadTimes: []
  },

  // Intersection Observer instance
  observer: null,

  /**
   * Initialize enhanced lazy loading system
   */
  init: function() {
    // Initialize performance optimizer
    PerformanceOptimizer.init();
    
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images immediately
      this.loadAllImages();
      return;
    }

    // Create priority observer for above-fold images
    this.priorityObserver = new IntersectionObserver(
      this.handlePriorityIntersection.bind(this),
      {
        rootMargin: this.config.aboveFoldMargin,
        threshold: 0.1
      }
    );

    // Create main intersection observer
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold
      }
    );

    // Start observing images
    this.observeImages();
    this.preloadCriticalResources();
    this.setupPerformanceMonitoring();
  },

  /**
   * Handle intersection observer entries
   */
  handleIntersection: function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  },

  /**
   * Start observing all lazy-loadable images with priority handling
   */
  observeImages: function() {
    // Find all images with loading="lazy" attribute
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    this.performanceMetrics.totalImages = lazyImages.length;
    
    lazyImages.forEach((img, index) => {
      // Add loading class for styling
      img.classList.add(this.config.loadingClass);
      
      // Determine if image is above the fold or high priority
      const rect = img.getBoundingClientRect();
      const isAboveFold = rect.top < window.innerHeight;
      const isPriority = img.classList.contains(this.config.priorityClass) || index < 3;
      
      if (isAboveFold || isPriority) {
        // Use priority observer for critical images
        img.classList.add(this.config.priorityClass);
        this.priorityObserver.observe(img);
      } else {
        // Use regular observer for below-fold images
        this.observer.observe(img);
      }
    });

    console.log(`Started lazy loading for ${lazyImages.length} images (${document.querySelectorAll('.' + this.config.priorityClass).length} priority)`);
  },

  /**
   * Priority intersection handler for above-fold images
   */
  handlePriorityIntersection: function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target, true); // Priority loading
        this.priorityObserver.unobserve(entry.target);
      }
    });
  },

  /**
   * Enhanced image loading with performance tracking and queue management
   */
  loadImage: function(img, isPriority = false) {
    // Respect concurrent loading limits for non-priority images
    if (!isPriority && this.currentlyLoading >= this.config.maxConcurrentLoads) {
      this.loadQueue.push(img);
      return;
    }
    
    this.currentlyLoading++;
    const loadStartTime = performance.now();
    
    // Add loading state
    img.classList.add(this.config.loadingClass);

    // Handle load success
    const handleLoad = () => {
      const loadTime = performance.now() - loadStartTime;
      this.trackLoadSuccess(loadTime);
      
      img.classList.remove(this.config.loadingClass);
      img.classList.add(this.config.loadedClass);
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      
      this.currentlyLoading--;
      this.processQueue();
    };

    // Handle load error
    const handleError = () => {
      this.trackLoadError();
      
      img.classList.remove(this.config.loadingClass);
      img.classList.add(this.config.errorClass);
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      
      // Set fallback image or placeholder
      this.setFallbackImage(img);
      
      this.currentlyLoading--;
      this.processQueue();
    };

    // Add event listeners
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // Optimize image source for connection type
    this.optimizeImageSource(img);
  },
  
  /**
   * Process queued images when capacity becomes available
   */
  processQueue: function() {
    if (this.loadQueue.length > 0 && this.currentlyLoading < this.config.maxConcurrentLoads) {
      const nextImage = this.loadQueue.shift();
      this.loadImage(nextImage, false);
    }
  },
  
  /**
   * Optimize image source based on connection and device capabilities
   */
  optimizeImageSource: function(img) {
    const originalSrc = img.getAttribute('data-src') || img.src;
    
    if (PerformanceOptimizer.shouldOptimizeAggressively()) {
      // Use lower quality or smaller images for slow connections/low-end devices
      const optimizedSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '_compressed.$1');
      if (img.src !== optimizedSrc) {
        img.src = optimizedSrc;
      }
    }
  },
  
  /**
   * Set fallback image for loading errors
   */
  setFallbackImage: function(img) {
    // Create a simple SVG placeholder
    const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3E📷%3C/text%3E%3C/svg%3E';
    img.src = placeholder;
  },
  
  /**
   * Track successful image load
   */
  trackLoadSuccess: function(loadTime) {
    this.performanceMetrics.loadedImages++;
    this.performanceMetrics.loadTimes.push(loadTime);
    
    // Calculate running average
    const total = this.performanceMetrics.loadTimes.reduce((sum, time) => sum + time, 0);
    this.performanceMetrics.avgLoadTime = total / this.performanceMetrics.loadTimes.length;
    
    // Track in analytics if available
    if (window.PrivacyAnalytics) {
      window.PrivacyAnalytics.track('image_load_success', {
        loadTime: Math.round(loadTime),
        connectionType: PerformanceOptimizer.connectionType,
        deviceMemory: PerformanceOptimizer.deviceMemory
      });
    }
  },
  
  /**
   * Track failed image load
   */
  trackLoadError: function() {
    this.performanceMetrics.failedImages++;
    
    // Track in analytics if available
    if (window.PrivacyAnalytics) {
      window.PrivacyAnalytics.track('image_load_error', {
        connectionType: PerformanceOptimizer.connectionType,
        deviceMemory: PerformanceOptimizer.deviceMemory
      });
    }
  },

  /**
   * Fallback: load all images immediately (for unsupported browsers)
   */
  loadAllImages: function() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    lazyImages.forEach(img => {
      img.classList.add(this.config.loadedClass);
    });

    console.log('Lazy loading not supported, loaded all images immediately');
  },

  /**
   * Preload critical resources
   */
  preloadCriticalResources: function() {
    // Preload above-fold images if connection is fast enough
    if (!PerformanceOptimizer.shouldOptimizeAggressively()) {
      const criticalImages = document.querySelectorAll('.hero img, .card:nth-child(-n+3) img');
      criticalImages.forEach(img => {
        if (img.src && !img.complete) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = img.src;
          document.head.appendChild(link);
        }
      });
    }
  },
  
  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring: function() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const stats = this.getStats();
        if (window.PrivacyAnalytics) {
          window.PrivacyAnalytics.track('lazy_loading_summary', {
            totalImages: stats.total,
            loadedImages: stats.loaded,
            failedImages: stats.errors,
            avgLoadTime: Math.round(this.performanceMetrics.avgLoadTime),
            connectionType: PerformanceOptimizer.connectionType
          });
        }
      }, 2000);
    });
  },
  
  /**
   * Get enhanced loading statistics
   */
  getStats: function() {
    const loading = document.querySelectorAll(`.${this.config.loadingClass}`).length;
    const loaded = document.querySelectorAll(`.${this.config.loadedClass}`).length;
    const errors = document.querySelectorAll(`.${this.config.errorClass}`).length;
    const priority = document.querySelectorAll(`.${this.config.priorityClass}`).length;
    
    return { 
      loading, 
      loaded, 
      errors, 
      priority,
      total: loading + loaded + errors,
      avgLoadTime: this.performanceMetrics.avgLoadTime,
      successRate: this.performanceMetrics.totalImages > 0 ? 
        (this.performanceMetrics.loadedImages / this.performanceMetrics.totalImages) * 100 : 0
    };
  },

  /**
   * Manually trigger loading of remaining images
   */
  loadRemaining: function() {
    if (this.observer) {
      const unloadedImages = document.querySelectorAll(`.${this.config.loadingClass}`);
      unloadedImages.forEach(img => {
        this.loadImage(img);
        this.observer.unobserve(img);
      });
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    LazyImageLoader.init();
  });
} else {
  // DOM is already ready
  LazyImageLoader.init();
}

// Export for manual control if needed
window.LazyImageLoader = LazyImageLoader;