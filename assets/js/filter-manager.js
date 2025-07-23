/**
 * FilterManager - Handles search and filtering functionality for the app grid
 * Part of the Search and Discovery System
 */
const FilterManager = {
  // Application state
  state: {
    searchTerm: '',
    selectedCategory: 'all',
    selectedTags: new Set()
  },

  // DOM elements cache
  elements: {
    apps: null,
    searchInput: null,
    categoryButtons: null,
    tagButtons: null,
    clearButton: null
  },

  /**
   * Initialize the FilterManager
   * @param {Object} options - Configuration options
   * @param {string} options.appSelector - CSS selector for app elements
   * @param {string} options.searchInputSelector - CSS selector for search input
   * @param {string} options.categoryButtonSelector - CSS selector for category buttons
   * @param {string} options.tagButtonSelector - CSS selector for tag buttons
   * @param {string} options.clearButtonSelector - CSS selector for clear button
   */
  init: function(options = {}) {
    const defaults = {
      appSelector: '.card',
      searchInputSelector: '#search-input',
      categoryButtonSelector: '.category-filter',
      tagButtonSelector: '.tag-filter',
      clearButtonSelector: '#clear-filters'
    };
    
    this.options = { ...defaults, ...options };
    this.cacheElements();
    this.bindEvents();
    this.addKeyboardNavigation();
    this.enhanceAccessibility();
    this.filterApps(); // Initial filter application
  },

  /**
   * Cache DOM elements for performance
   */
  cacheElements: function() {
    this.elements.apps = document.querySelectorAll(this.options.appSelector);
    this.elements.searchInput = document.querySelector(this.options.searchInputSelector);
    this.elements.categoryButtons = document.querySelectorAll(this.options.categoryButtonSelector);
    this.elements.tagButtons = document.querySelectorAll(this.options.tagButtonSelector);
    this.elements.clearButton = document.querySelector(this.options.clearButtonSelector);
  },

  /**
   * Bind event listeners
   */
  bindEvents: function() {
    // Search input
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.setSearchTerm(e.target.value);
      });
    }

    // Category buttons
    this.elements.categoryButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const category = button.dataset.category;
        this.setCategory(category);
        this.updateCategoryButtonStates(category);
      });
    });

    // Tag buttons
    this.elements.tagButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = button.dataset.tag;
        this.toggleTag(tag);
        button.classList.toggle('active');
      });
    });

    // Clear filters button
    if (this.elements.clearButton) {
      this.elements.clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearFilters();
        this.updateUIStates();
      });
    }
  },

  /**
   * Set search term and apply filters
   * @param {string} term - Search term
   */
  setSearchTerm: function(term) {
    this.state.searchTerm = term.toLowerCase().trim();
    this.filterApps();
    
    // Track search behavior if analytics is available
    if (window.PrivacyAnalytics && this.state.searchTerm.length >= 3) {
      const resultsCount = this.getVisibleCount();
      window.PrivacyAnalytics.trackSearchBehavior(this.state.searchTerm, resultsCount);
    }
  },

  /**
   * Set category filter
   * @param {string} category - Category to filter by
   */
  setCategory: function(category) {
    this.state.selectedCategory = category;
    this.filterApps();
    
    // Track filter usage if analytics is available
    if (window.PrivacyAnalytics) {
      const resultsCount = this.getVisibleCount();
      window.PrivacyAnalytics.trackFilterUsage('category', category, true, resultsCount);
    }
  },

  /**
   * Toggle tag filter
   * @param {string} tag - Tag to toggle
   */
  toggleTag: function(tag) {
    const wasActive = this.state.selectedTags.has(tag);
    if (wasActive) {
      this.state.selectedTags.delete(tag);
    } else {
      this.state.selectedTags.add(tag);
    }
    this.filterApps();
    
    // Track filter usage if analytics is available
    if (window.PrivacyAnalytics) {
      const resultsCount = this.getVisibleCount();
      window.PrivacyAnalytics.trackFilterUsage('tag', tag, !wasActive, resultsCount);
    }
  },

  /**
   * Clear all filters
   */
  clearFilters: function() {
    this.state.searchTerm = '';
    this.state.selectedCategory = 'all';
    this.state.selectedTags.clear();
    this.filterApps();
  },

  /**
   * Apply current filters to the app grid
   * Performance optimized with early exit and minimal DOM manipulation
   */
  filterApps: function() {
    if (!this.elements.apps || this.elements.apps.length === 0) return;

    const startTime = performance.now();
    let visibleCount = 0;

    // Cache filter state for performance
    const hasSearchTerm = Boolean(this.state.searchTerm);
    const hasCategory = this.state.selectedCategory !== 'all';
    const hasTags = this.state.selectedTags.size > 0;
    const selectedTagsArray = hasTags ? Array.from(this.state.selectedTags) : [];

    this.elements.apps.forEach(app => {
      // Cache data attributes to avoid repeated DOM access
      if (!app._cachedData) {
        app._cachedData = {
          name: app.dataset.name?.toLowerCase() || '',
          tagline: app.dataset.tagline?.toLowerCase() || '',
          category: app.dataset.category || '',
          tags: app.dataset.tags ? app.dataset.tags.split(',').map(t => t.trim()) : []
        };
      }

      const data = app._cachedData;
      let visible = true;

      // Apply search filter (early exit optimization)
      if (hasSearchTerm && visible) {
        const searchMatch = data.name.includes(this.state.searchTerm) || 
                           data.tagline.includes(this.state.searchTerm);
        visible = searchMatch;
      }

      // Apply category filter (early exit optimization)
      if (hasCategory && visible) {
        visible = data.category === this.state.selectedCategory;
      }

      // Apply tag filter (early exit optimization)
      if (hasTags && visible) {
        visible = selectedTagsArray.every(tag => data.tags.includes(tag));
      }

      // Apply visibility with animation (only if state changed)
      const wasVisible = !app.classList.contains('filtered-out');
      if (visible !== wasVisible) {
        this.setAppVisibility(app, visible);
      }
      
      if (visible) visibleCount++;
    });

    // Update results display
    this.updateResultsDisplay(visibleCount);

    // Performance logging (development only)
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`Filter operation took ${duration.toFixed(2)}ms (>100ms threshold)`);
    }

    // Update ARIA live region for screen readers
    this.updateAriaLiveRegion(visibleCount);
  },

  /**
   * Set app visibility with smooth animation
   * @param {HTMLElement} app - App element
   * @param {boolean} visible - Whether app should be visible
   */
  setAppVisibility: function(app, visible) {
    if (visible) {
      app.style.display = '';
      app.classList.remove('filtered-out');
      // Trigger animation
      requestAnimationFrame(() => {
        app.style.opacity = '1';
        app.style.transform = 'scale(1)';
      });
    } else {
      app.classList.add('filtered-out');
      app.style.opacity = '0.3';
      app.style.transform = 'scale(0.95)';
      // Hide after animation
      setTimeout(() => {
        if (app.classList.contains('filtered-out')) {
          app.style.display = 'none';
        }
      }, 200);
    }
  },

  /**
   * Update category button states
   * @param {string} activeCategory - Currently active category
   */
  updateCategoryButtonStates: function(activeCategory) {
    this.elements.categoryButtons.forEach(button => {
      if (button.dataset.category === activeCategory) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  },

  /**
   * Update all UI states after clearing filters
   */
  updateUIStates: function() {
    // Clear search input
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }

    // Reset category buttons
    this.updateCategoryButtonStates('all');

    // Reset tag buttons
    this.elements.tagButtons.forEach(button => {
      button.classList.remove('active');
    });
  },

  /**
   * Update results display
   * @param {number} count - Number of visible results
   */
  updateResultsDisplay: function(count) {
    // Update or create results counter
    let resultsElement = document.querySelector('#results-count');
    if (!resultsElement) {
      resultsElement = document.createElement('div');
      resultsElement.id = 'results-count';
      resultsElement.className = 'results-count';
      
      // Insert before the grid
      const grid = document.querySelector('.grid');
      if (grid && grid.parentNode) {
        grid.parentNode.insertBefore(resultsElement, grid);
      }
    }

    // Update results text
    if (count === this.elements.apps.length) {
      resultsElement.textContent = '';
      resultsElement.style.display = 'none';
    } else if (count === 0) {
      resultsElement.textContent = 'No applications found matching your criteria.';
      resultsElement.style.display = 'block';
    } else {
      resultsElement.textContent = `Showing ${count} of ${this.elements.apps.length} applications`;
      resultsElement.style.display = 'block';
    }
  },

  /**
   * Get number of visible apps
   * @returns {number} Number of visible apps
   */
  getVisibleCount: function() {
    if (!this.elements.apps) return 0;
    return Array.from(this.elements.apps)
      .filter(app => !app.classList.contains('filtered-out')).length;
  },

  /**
   * Get current filter state
   * @returns {Object} Current filter state
   */
  getState: function() {
    return {
      searchTerm: this.state.searchTerm,
      selectedCategory: this.state.selectedCategory,
      selectedTags: Array.from(this.state.selectedTags)
    };
  },

  /**
   * Update ARIA live region for screen readers
   * @param {number} count - Number of visible results
   */
  updateAriaLiveRegion: function(count) {
    let liveRegion = document.querySelector('#filter-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'filter-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    const totalApps = this.elements.apps.length;
    if (count === totalApps) {
      liveRegion.textContent = `Showing all ${totalApps} applications`;
    } else if (count === 0) {
      liveRegion.textContent = 'No applications match your search criteria';
    } else {
      liveRegion.textContent = `Showing ${count} of ${totalApps} applications`;
    }
  },

  /**
   * Add keyboard navigation support
   */
  addKeyboardNavigation: function() {
    // Add keyboard support for filter buttons
    document.addEventListener('keydown', (e) => {
      // Handle keyboard navigation for filter buttons
      if (e.target.matches('.category-filter, .tag-filter')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.target.click();
        }
      }

      // Handle keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            if (this.elements.searchInput) {
              this.elements.searchInput.focus();
            }
            break;
          case 'Escape':
            if (document.activeElement === this.elements.searchInput) {
              this.elements.searchInput.blur();
            }
            break;
        }
      }

      // Clear filters with Escape key
      if (e.key === 'Escape' && !e.target.matches('input')) {
        this.clearFilters();
        this.updateUIStates();
      }
    });

    // Add focus management for filter buttons
    const filterButtons = document.querySelectorAll('.category-filter, .tag-filter');
    filterButtons.forEach((button, index) => {
      button.addEventListener('keydown', (e) => {
        let nextIndex;
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            nextIndex = (index + 1) % filterButtons.length;
            filterButtons[nextIndex].focus();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            nextIndex = (index - 1 + filterButtons.length) % filterButtons.length;
            filterButtons[nextIndex].focus();
            break;
          case 'Home':
            e.preventDefault();
            filterButtons[0].focus();
            break;
          case 'End':
            e.preventDefault();
            filterButtons[filterButtons.length - 1].focus();
            break;
        }
      });
    });
  },

  /**
   * Add accessibility attributes to filter elements
   */
  enhanceAccessibility: function() {
    // Add ARIA attributes to search input
    if (this.elements.searchInput) {
      this.elements.searchInput.setAttribute('role', 'searchbox');
      this.elements.searchInput.setAttribute('aria-describedby', 'search-description');
      
      // Add search description
      let searchDesc = document.querySelector('#search-description');
      if (!searchDesc) {
        searchDesc = document.createElement('div');
        searchDesc.id = 'search-description';
        searchDesc.className = 'sr-only';
        searchDesc.textContent = 'Search applications by name or description. Use Ctrl+K to focus.';
        this.elements.searchInput.parentNode.appendChild(searchDesc);
      }
    }

    // Add ARIA attributes to filter sections
    const categorySection = document.querySelector('.category-filters');
    if (categorySection) {
      categorySection.setAttribute('role', 'radiogroup');
      categorySection.setAttribute('aria-labelledby', 'category-label');
      
      const categoryLabel = categorySection.querySelector('.filter-label');
      if (categoryLabel) {
        categoryLabel.id = 'category-label';
      }
    }

    const tagSection = document.querySelector('.tag-filters');
    if (tagSection) {
      tagSection.setAttribute('role', 'group');
      tagSection.setAttribute('aria-labelledby', 'tag-label');
      
      const tagLabel = tagSection.querySelector('.filter-label');
      if (tagLabel) {
        tagLabel.id = 'tag-label';
      }
    }

    // Add ARIA attributes to filter buttons
    this.elements.categoryButtons.forEach(button => {
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', button.classList.contains('active'));
    });

    this.elements.tagButtons.forEach(button => {
      button.setAttribute('role', 'checkbox');
      button.setAttribute('aria-checked', button.classList.contains('active'));
    });

    // Add clear filters button accessibility
    if (this.elements.clearButton) {
      this.elements.clearButton.setAttribute('aria-describedby', 'clear-description');
      
      let clearDesc = document.querySelector('#clear-description');
      if (!clearDesc) {
        clearDesc = document.createElement('div');
        clearDesc.id = 'clear-description';
        clearDesc.className = 'sr-only';
        clearDesc.textContent = 'Clear all search and filter selections. Keyboard shortcut: Escape';
        this.elements.clearButton.parentNode.appendChild(clearDesc);
      }
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a page with an app grid
    if (document.querySelector('.grid')) {
      FilterManager.init();
    }
  });
} else {
  // DOM is already ready
  if (document.querySelector('.grid')) {
    FilterManager.init();
  }
}