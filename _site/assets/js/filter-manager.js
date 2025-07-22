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
  },

  /**
   * Set category filter
   * @param {string} category - Category to filter by
   */
  setCategory: function(category) {
    this.state.selectedCategory = category;
    this.filterApps();
  },

  /**
   * Toggle tag filter
   * @param {string} tag - Tag to toggle
   */
  toggleTag: function(tag) {
    if (this.state.selectedTags.has(tag)) {
      this.state.selectedTags.delete(tag);
    } else {
      this.state.selectedTags.add(tag);
    }
    this.filterApps();
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
   */
  filterApps: function() {
    if (!this.elements.apps || this.elements.apps.length === 0) return;

    let visibleCount = 0;

    this.elements.apps.forEach(app => {
      const name = app.dataset.name?.toLowerCase() || '';
      const tagline = app.dataset.tagline?.toLowerCase() || '';
      const category = app.dataset.category || '';
      const tags = app.dataset.tags ? app.dataset.tags.split(',').map(t => t.trim()) : [];

      let visible = true;

      // Apply search filter
      if (this.state.searchTerm) {
        const searchMatch = name.includes(this.state.searchTerm) || 
                           tagline.includes(this.state.searchTerm);
        visible = visible && searchMatch;
      }

      // Apply category filter
      if (this.state.selectedCategory !== 'all') {
        visible = visible && (category === this.state.selectedCategory);
      }

      // Apply tag filter (AND logic - must have all selected tags)
      if (this.state.selectedTags.size > 0) {
        const hasAllTags = Array.from(this.state.selectedTags)
          .every(tag => tags.includes(tag));
        visible = visible && hasAllTags;
      }

      // Apply visibility with animation
      this.setAppVisibility(app, visible);
      
      if (visible) visibleCount++;
    });

    // Update results count or show no results message
    this.updateResultsDisplay(visibleCount);
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