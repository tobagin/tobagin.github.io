/**
 * Lazy Loading Image Manager
 * 
 * Implements intersection observer-based lazy loading for optimized images
 * with progressive enhancement and fallback support.
 */

const LazyImageLoader = {
  // Configuration
  config: {
    rootMargin: '50px 0px',
    threshold: 0.01,
    loadingClass: 'lazy-loading',
    loadedClass: 'lazy-loaded',
    errorClass: 'lazy-error'
  },

  // Intersection Observer instance
  observer: null,

  /**
   * Initialize lazy loading system
   */
  init: function() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images immediately
      this.loadAllImages();
      return;
    }

    // Create intersection observer
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold
      }
    );

    // Start observing lazy images
    this.observeImages();
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
   * Start observing all lazy-loadable images
   */
  observeImages: function() {
    // Find all images with loading="lazy" attribute
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    lazyImages.forEach(img => {
      // Add loading class for styling
      img.classList.add(this.config.loadingClass);
      
      // Start observing
      this.observer.observe(img);
    });

    console.log(`Started lazy loading for ${lazyImages.length} images`);
  },

  /**
   * Load a specific image
   */
  loadImage: function(img) {
    // Add loading state
    img.classList.add(this.config.loadingClass);

    // Handle load success
    const handleLoad = () => {
      img.classList.remove(this.config.loadingClass);
      img.classList.add(this.config.loadedClass);
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };

    // Handle load error
    const handleError = () => {
      img.classList.remove(this.config.loadingClass);
      img.classList.add(this.config.errorClass);
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      
      console.warn('Failed to load image:', img.src);
    };

    // Add event listeners
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // The browser will automatically load the image since we already set loading="lazy"
    // and the image is now in the viewport
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
   * Get loading statistics
   */
  getStats: function() {
    const loading = document.querySelectorAll(`.${this.config.loadingClass}`).length;
    const loaded = document.querySelectorAll(`.${this.config.loadedClass}`).length;
    const errors = document.querySelectorAll(`.${this.config.errorClass}`).length;
    
    return { loading, loaded, errors, total: loading + loaded + errors };
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