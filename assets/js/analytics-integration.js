/**
 * Analytics Integration for Jekyll Site
 * Ensures proper app identification and link tracking for privacy-first analytics
 */

(function() {
  'use strict';

  const AnalyticsIntegration = {
    init: function() {
      this.enhanceAppCards();
      this.enhanceAppLinks();
      this.setupPageTracking();
      this.setupNavigationTracking();
    },

    /**
     * Enhance app cards with proper data attributes and tracking
     */
    enhanceAppCards: function() {
      const appCards = document.querySelectorAll('.card[data-name]');
      
      appCards.forEach(card => {
        // Extract app ID from href or data-name
        const href = card.getAttribute('href');
        const dataName = card.getAttribute('data-name');
        let appId;

        if (href) {
          // Extract from href like "apps/digger" -> "digger"
          const pathParts = href.split('/');
          appId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
        } else if (dataName) {
          // Convert data-name to slug format
          appId = dataName.toLowerCase().replace(/\s+/g, '-');
        }

        if (appId) {
          card.setAttribute('data-app-id', appId);
          
          // Add click tracking
          card.addEventListener('click', (e) => {
            if (window.PrivacyAnalytics) {
              const category = card.getAttribute('data-category');
              const fromSearch = document.getElementById('search-input')?.value?.trim() || '';
              const activeFilters = document.querySelectorAll('.category-filter.active:not([data-category="all"]), .tag-filter.active').length;
              
              window.PrivacyAnalytics.trackAppClickEngagement(appId, 'card_click', {
                appName: dataName,
                category: category,
                fromSearch: fromSearch.length >= 3,
                filtersActive: activeFilters
              });
            }
          });
        }
      });
    },

    /**
     * Enhance app page links with proper tracking
     */
    enhanceAppLinks: function() {
      // Only run on app pages
      const isAppPage = window.location.pathname.includes('/apps/');
      if (!isAppPage) return;

      const appId = this.getCurrentAppId();
      const appName = document.querySelector('h1')?.textContent || 'Unknown App';

      // Track Flathub links
      const flathubLinks = document.querySelectorAll('a[href*="flathub.org"]');
      flathubLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          if (window.PrivacyAnalytics) {
            window.PrivacyAnalytics.trackLinkClickEngagement(appId, 'flathub', link.href, {
              appName: appName,
              linkText: link.textContent.trim()
            });
          }
        });
      });

      // Track GitHub links
      const githubLinks = document.querySelectorAll('a[href*="github.com"]');
      githubLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          if (window.PrivacyAnalytics) {
            let linkType = 'github';
            const href = link.href;
            
            if (href.includes('/wiki')) linkType = 'wiki';
            else if (href.includes('/issues')) linkType = 'issues';
            else if (href.includes('/discussions')) linkType = 'discussions';
            else if (href.includes('/releases')) linkType = 'releases';
            
            window.PrivacyAnalytics.trackLinkClickEngagement(appId, linkType, href, {
              appName: appName,
              linkText: link.textContent.trim()
            });
          }
        });
      });

      // Track documentation links
      const docLinks = document.querySelectorAll('a[href*="/docs"], a[href*="docs."], .resource-link[href*="docs"]');
      docLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          if (window.PrivacyAnalytics) {
            window.PrivacyAnalytics.trackLinkClickEngagement(appId, 'docs', link.href, {
              appName: appName,
              linkText: link.textContent.trim()
            });
          }
        });
      });
    },

    /**
     * Setup page view tracking
     */
    setupPageTracking: function() {
      if (window.PrivacyAnalytics) {
        // Track initial page view
        const appId = this.getCurrentAppId();
        const pageTitle = document.title;
        const pageType = this.getPageType();
        
        window.PrivacyAnalytics.trackPageViewEngagement(appId, {
          title: pageTitle,
          pageType: pageType,
          referrer: document.referrer ? 'external' : 'direct'
        });
      }
    },

    /**
     * Setup navigation tracking for theme toggle and internal navigation
     */
    setupNavigationTracking: function() {
      // Track theme toggle usage
      const themeToggle = document.querySelector('.theme-toggle');
      if (themeToggle && window.PrivacyAnalytics) {
        themeToggle.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          
          window.PrivacyAnalytics.track('theme_toggle', {
            from: currentTheme,
            to: newTheme,
            page: window.location.pathname
          });
        });
      }

      // Track internal navigation
      const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
      internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          if (window.PrivacyAnalytics) {
            const fromPage = window.location.pathname;
            const toPage = link.getAttribute('href');
            
            window.PrivacyAnalytics.trackNavigation(fromPage, toPage, 'click', {
              linkText: link.textContent.trim(),
              linkContext: this.getLinkContext(link)
            });
          }
        });
      });
    },

    /**
     * Get current app ID from URL
     * @returns {string} App ID or 'homepage'
     */
    getCurrentAppId: function() {
      const pathParts = window.location.pathname.split('/');
      
      if (pathParts.includes('apps') && pathParts.length > 2) {
        const appsIndex = pathParts.indexOf('apps');
        return pathParts[appsIndex + 1] || 'unknown';
      }
      
      return 'homepage';
    },

    /**
     * Get page type for analytics
     * @returns {string} Page type
     */
    getPageType: function() {
      const path = window.location.pathname;
      
      if (path === '/' || path === '/index.html') return 'homepage';
      if (path.includes('/apps/')) return 'app_detail';
      if (path.includes('/about')) return 'about';
      if (path.includes('/privacy')) return 'privacy';
      
      return 'other';
    },

    /**
     * Get context information for a link
     * @param {HTMLElement} link - Link element
     * @returns {string} Link context
     */
    getLinkContext: function(link) {
      // Check if link is in header, footer, navigation, etc.
      const header = link.closest('header');
      const nav = link.closest('nav');
      const footer = link.closest('footer');
      const card = link.closest('.card');
      const buttons = link.closest('.buttons');
      
      if (header) return 'header';
      if (nav) return 'navigation';
      if (footer) return 'footer';
      if (card) return 'app_card';
      if (buttons) return 'action_buttons';
      
      return 'content';
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for other scripts to load first
      setTimeout(() => {
        AnalyticsIntegration.init();
      }, 100);
    });
  } else {
    // DOM is already ready
    setTimeout(() => {
      AnalyticsIntegration.init();
    }, 100);
  }

  // Export for testing
  window.AnalyticsIntegration = AnalyticsIntegration;
})();