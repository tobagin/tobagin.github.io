/**
 * Privacy-First Analytics for Tobagin Apps - GDPR compliant, <5KB
 */

(function() {
  'use strict';

  // Privacy-first analytics implementation
  class PrivacyAnalytics {
    constructor() {
      this.version = '1.0.0';
      this.enabled = this.shouldTrack();
      this.events = [];
      this.sessionId = this.generateSessionId();
      this.startTime = Date.now();
      this.maxEvents = 50; // Limit memory usage
      
      // App engagement tracking
      this.pageViews = new Map();
      this.appClicks = new Map();
      this.linkClicks = new Map();
      this.currentPageStartTime = Date.now();
      this.engagementEvents = [];
      
      // User journey tracking  
      this.navigationHistory = [];
      this.searchQueries = [];
      this.filterUsage = new Map();
      this.referrerData = new Map();
      this.entryPoints = new Map();
      this.exitPoints = new Map();
      
      // Initialize if tracking is enabled
      if (this.enabled) {
        this.init();
      }
    }

    shouldTrack() {
      if (this.getDoNotTrack()) return false;
      if (this.isOptedOut()) return false;
      return true;
    }

    getDoNotTrack() {
      return navigator.doNotTrack === '1' || 
             navigator.doNotTrack === 'yes' || 
             navigator.msDoNotTrack === '1' ||
             window.doNotTrack === '1';
    }

    isOptedOut() {
      try {
        return localStorage.getItem('tobagin-analytics-opt-out') === 'true';
      } catch (e) {
        return true;
      }
    }

    optOut() {
      try {
        localStorage.setItem('tobagin-analytics-opt-out', 'true');
        this.enabled = false;
        this.events = [];
        window.dispatchEvent(new CustomEvent('analytics-opt-out'));
      } catch (e) {}
    }

    optIn() {
      try {
        localStorage.removeItem('tobagin-analytics-opt-out');
        this.enabled = !this.getDoNotTrack();
        if (this.enabled) this.init();
        window.dispatchEvent(new CustomEvent('analytics-opt-in'));
      } catch (e) {}
    }

    generateSessionId() {
      const h = Math.floor(Date.now() / 3600000);
      const r = Math.floor(Math.random() * 10000);
      return `s_${h}_${r}`;
    }

    init() {
      this.trackInitialReferrer();
      this.trackPageViewEngagement();
      this.setupEventListeners();
    }

    setupEventListeners() {
      document.addEventListener('click', (e) => {
        const card = e.target.closest('.card[data-name]');
        if (card) {
          const id = card.getAttribute('href')?.split('/').pop() || 
                     card.getAttribute('data-name')?.toLowerCase().replace(/\s+/g, '-');
          const toPage = card.getAttribute('href') || `/apps/${id}/`;
          const searchActive = !!document.getElementById('search-input')?.value?.trim();
          const activeFilters = document.querySelectorAll('.category-filter.active, .tag-filter.active').length;
          this.trackNavigation(location.pathname, toPage, 'click', {
            searchActive,
            filtersActive: activeFilters,
            category: card.getAttribute('data-category')
          });
          this.trackAppClickEngagement(id, 'card_click', {
            appName: card.getAttribute('data-name'),
            fromSearch: searchActive,
            category: card.getAttribute('data-category')
          });
        }
        
        const link = e.target.closest('a[href]');
        if (link) {
          const href = link.href;
          const appId = this.getCurrentAppId();
          const name = document.querySelector('h1')?.textContent;
          
          if (href.includes('flathub.org')) {
            this.trackLinkClickEngagement(appId, 'flathub', href, {appName: name});
          } else if (href.includes('github.com')) {
            let type = 'github';
            if (href.includes('/wiki')) type = 'wiki';
            else if (href.includes('/issues')) type = 'issues';
            else if (href.includes('/discussions')) type = 'discussions';
            this.trackLinkClickEngagement(appId, type, href, {appName: name});
          } else if (href.includes('/docs') || href.match(/docs?\./)) {
            this.trackLinkClickEngagement(appId, 'docs', href, {appName: name});
          }
        }
      });
      
      const search = document.getElementById('search-input');
      if (search) {
        let t;
        search.addEventListener('input', (e) => {
          clearTimeout(t);
          t = setTimeout(() => {
            const q = e.target.value.trim();
            if (q.length >= 3) {
              const results = document.querySelectorAll('.card:not([style*="display: none"])').length;
              this.trackSearchBehavior(q, results);
            }
          }, 1000);
        });
      }
      
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-filter')) {
          const active = e.target.classList.contains('active');
          const results = document.querySelectorAll('.card:not([style*="display: none"])').length;
          this.trackFilterUsage('category', e.target.getAttribute('data-category'), active, results);
        }
        if (e.target.classList.contains('tag-filter')) {
          const active = e.target.classList.contains('active');
          const results = document.querySelectorAll('.card:not([style*="display: none"])').length;
          this.trackFilterUsage('tag', e.target.getAttribute('data-tag'), active, results);
        }
      });
    }

    extractAppIdFromUrl(url) {
      try {
        const u = new URL(url);
        if (u.hostname.includes('flathub.org')) return u.pathname.split('/').pop();
        if (u.hostname.includes('github.com')) {
          const p = u.pathname.split('/');
          return p[p.length - 1] || p[p.length - 2];
        }
      } catch (e) {}
      return 'unknown';
    }

    getCurrentAppId() {
      const p = window.location.pathname.split('/');
      return p.includes('apps') && p.length > 2 ? p[p.indexOf('apps') + 1] : 'homepage';
    }


    anonymizeData(data) {
      const d = { ...data };
      if (d.userAgent) d.userAgent = this.anonymizeUserAgent(d.userAgent);
      if (d.referrer) d.referrer = this.anonymizeReferrer(d.referrer);
      if (d.timestamp) d.timestamp = Math.floor(d.timestamp / 300000) * 300000;
      delete d.ip; delete d.userId; delete d.email;
      return d;
    }

    anonymizeUserAgent(ua) {
      return ua.replace(/\d+\.\d+\.\d+/g, 'x.x.x').replace(/\([^)]*\)/g, '(...)').substring(0, 100);
    }

    anonymizeReferrer(ref) {
      try { return new URL(ref).hostname; } catch (e) { return 'direct'; }
    }

    track(type, data = {}) {
      if (!this.enabled) return false;
      try {
        const event = this.anonymizeData({
          type,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          url: location.pathname,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenSize: `${screen.width}x${screen.height}`,
          viewportSize: `${innerWidth}x${innerHeight}`,
          language: navigator.language,
          ...data
        });
        this.events.push(event);
        if (this.events.length > this.maxEvents) {
          this.events = this.events.slice(-Math.floor(this.maxEvents * 0.8));
        }
        return true;
      } catch (e) {
        return false;
      }
    }

    trackPageView(data = {}) { return this.track('page_view', {title: document.title, ...data}); }
    trackAppClick(data = {}) { return this.track('app_click', data); }
    trackSearch(data = {}) { return this.track('search', data); }
    trackFilter(data = {}) { return this.track('filter', data); }
    trackCustom(name, data = {}) { return this.track(name, data); }

    trackPageViewEngagement(appId = null, meta = {}) {
      if (!appId) {
        const p = location.pathname.split('/');
        appId = p.includes('apps') && p.length > 2 ? p[p.indexOf('apps') + 1] : 'homepage';
      }
      const c = this.pageViews.get(appId) || 0;
      this.pageViews.set(appId, c + 1);
      this.engagementEvents.push({type: 'page_view', appId, timestamp: Date.now()});
      this.trackPageView({ appId, ...meta });
    }

    trackAppClickEngagement(appId, clickType, meta = {}) {
      const key = `${appId}:${clickType}`;
      const c = this.appClicks.get(key) || 0;
      this.appClicks.set(key, c + 1);
      this.engagementEvents.push({type: 'app_click', appId, timestamp: Date.now()});
      this.trackAppClick({ appId, clickType, ...meta });
    }

    trackLinkClickEngagement(appId, linkType, url, meta = {}) {
      const key = `${appId}:${linkType}`;
      const c = this.linkClicks.get(key) || 0;
      this.linkClicks.set(key, c + 1);
      this.engagementEvents.push({type: 'link_click', appId, timestamp: Date.now()});
    }

    anonymizeUrl(url) {
      try { const u = new URL(url); return `${u.protocol}//${u.hostname}${u.pathname}`; } catch { return 'invalid-url'; }
    }

    calculateEngagementMetrics() {
      const pv = Array.from(this.pageViews.values()).reduce((s, c) => s + c, 0);
      const ac = Array.from(this.appClicks.values()).reduce((s, c) => s + c, 0);
      const lc = Array.from(this.linkClicks.values()).reduce((s, c) => s + c, 0);
      const uv = this.pageViews.size;
      const uc = new Set(Array.from(this.appClicks.keys()).map(k => k.split(':')[0])).size;
      const sd = Date.now() - this.startTime;
      return {
        totalPageViews: pv, totalAppClicks: ac, totalLinkClicks: lc,
        uniqueAppsViewed: uv, uniqueAppsClicked: uc, sessionDuration: sd,
        avgTimePerApp: uv > 0 ? sd / uv : 0,
        popularApps: this.getPopularApps(),
        engagementScore: pv + (ac * 3) + (lc * 5),
        conversionRate: pv > 0 ? (ac / pv) * 100 : 0
      };
    }

    getPopularApps() {
      const apps = new Map();
      this.pageViews.forEach((v, id) => { const c = apps.get(id) || {views: 0, clicks: 0}; c.views = v; apps.set(id, c); });
      this.appClicks.forEach((c, key) => { 
        const id = key.split(':')[0]; 
        const curr = apps.get(id) || {views: 0, clicks: 0}; 
        curr.clicks += c; apps.set(id, curr); 
      });
      return Array.from(apps.entries())
        .map(([id, d]) => ({appId: id, ...d, score: d.views + (d.clicks * 2)}))
        .sort((a, b) => b.score - a.score);
    }

    // User journey tracking methods
    trackInitialReferrer() {
      const ref = document.referrer;
      const entry = location.pathname;
      const classification = this.classifyReferrer(ref);
      const refKey = classification.type;
      const refCount = this.referrerData.get(refKey) || 0;
      this.referrerData.set(refKey, refCount + 1);
      const entryCount = this.entryPoints.get(entry) || 0;
      this.entryPoints.set(entry, entryCount + 1);
    }

    trackNavigation(fromPage, toPage, method = 'click', metadata = {}) {
      const nav = {
        from: this.anonymizePage(fromPage),
        to: this.anonymizePage(toPage),
        method,
        time: Date.now() - this.currentPageStartTime,
        timestamp: Date.now(),
        ...metadata
      };
      this.navigationHistory.push(nav);
      if (this.isExternalUrl(toPage)) {
        const exitCount = this.exitPoints.get(nav.from) || 0;
        this.exitPoints.set(nav.from, exitCount + 1);
      }
      this.currentPageStartTime = Date.now();
    }

    trackSearchBehavior(query, resultsCount = 0) {
      if (!query || query.length < 2) return;
      const search = {
        query: this.anonymizeQuery(query),
        length: query.length,
        words: query.trim().split(/\s+/).length,
        results: resultsCount,
        refinement: this.isSearchRefinement(query),
        timestamp: Date.now()
      };
      this.searchQueries.push(search);
      this.track('search_enhanced', search);
    }

    trackFilterUsage(type, value, active, results = 0) {
      const key = `${type}:${value}`;
      const count = this.filterUsage.get(key) || 0;
      this.filterUsage.set(key, count + 1);
      this.track('filter_enhanced', {type, value, active, results});
    }

    classifyReferrer(ref) {
      if (!ref) return {type: 'direct', domain: null};
      try {
        const u = new URL(ref);
        const d = u.hostname.toLowerCase();
        if (d.includes('google.') || d.includes('bing.') || d.includes('duckduckgo.')) 
          return {type: 'search', domain: d};
        if (d.includes('twitter.') || d.includes('facebook.') || d.includes('reddit.')) 
          return {type: 'social', domain: d};
        if (d.includes('github.') || d.includes('flathub.')) 
          return {type: 'tech', domain: d};
        return {type: 'external', domain: d};
      } catch { return {type: 'unknown', domain: 'invalid'}; }
    }

    anonymizePage(page) {
      return page ? page.split('?')[0].split('#')[0] : 'unknown';
    }

    anonymizeQuery(query) {
      return query.toLowerCase().replace(/\d+/g, 'N').replace(/[^\w\s]/g, '').trim().substring(0, 30);
    }

    isExternalUrl(url) {
      return url && url.startsWith('http') && !url.includes(location.hostname);
    }

    isSearchRefinement(query) {
      if (this.searchQueries.length === 0) return false;
      const last = this.searchQueries[this.searchQueries.length - 1];
      const timeDiff = Date.now() - last.timestamp;
      return timeDiff < 30000 && (query.includes(last.query) || last.query.includes(query));
    }

    analyzeUserFlow() {
      return { entries: Array.from(this.entryPoints.entries()).sort(([,a], [,b]) => b - a).slice(0, 3), exits: Array.from(this.exitPoints.entries()).sort(([,a], [,b]) => b - a).slice(0, 3), sessionLength: Date.now() - this.startTime };
    }



    getAggregatedData() {
      const em = this.calculateEngagementMetrics();
      const data = {
        totalEvents: this.events.length,
        sessionDuration: Math.floor((Date.now() - this.startTime) / 1000),
        eventTypes: {},
        popularApps: {},
        timestamp: Date.now(),
        engagement: {
          pageViews: em.totalPageViews,
          appClicks: em.totalAppClicks,
          linkClicks: em.totalLinkClicks,
          uniqueViewed: em.uniqueAppsViewed,
          uniqueClicked: em.uniqueAppsClicked,
          avgTime: Math.floor(em.avgTimePerApp / 1000),
          score: em.engagementScore,
          conversion: Math.round(em.conversionRate * 10) / 10,
          topApps: em.popularApps.slice(0, 3)
        },
        journey: {
          navigations: this.navigationHistory.length,
          searches: this.searchQueries.length,
          filters: this.filterUsage.size,
          refinements: this.searchQueries.filter(q => q.refinement).length,
          referrers: Object.fromEntries(this.referrerData)
        }
      };
      this.events.forEach(e => {
        data.eventTypes[e.type] = (data.eventTypes[e.type] || 0) + 1;
        if (e.type === 'app_click' && e.appId) data.popularApps[e.appId] = (data.popularApps[e.appId] || 0) + 1;
      });
      return data;
    }


    exportData() {
      return { version: this.version, enabled: this.enabled, data: this.getAggregatedData(), privacy: { doNotTrack: this.getDoNotTrack(), optedOut: this.isOptedOut(), cookies: false, persistent: false } };
    }

    getPrivacyStatus() {
      return { enabled: this.enabled, dnt: this.getDoNotTrack(), opted: this.isOptedOut(), events: this.events.length, session: this.sessionId };
    }

    exportEngagementData() {
      return { summary: this.calculateEngagementMetrics(), detailedData: { pageViews: Object.fromEntries(this.pageViews), appClicks: Object.fromEntries(this.appClicks), linkClicks: Object.fromEntries(this.linkClicks), events: this.engagementEvents.slice(-50) }, timestamp: Date.now(), version: this.version, privacy: { cookiesUsed: false, persistentIdUsed: false, dataAnonymized: true } };
    }

    exportJourneyData() {
      return { navs: this.navigationHistory.length, searches: this.searchQueries.length, filters: this.filterUsage.size, duration: Date.now() - this.startTime, refinements: this.searchQueries.filter(q => q.refinement).length, referrers: Object.fromEntries(this.referrerData), entries: Array.from(this.entryPoints.entries()).sort(([,a], [,b]) => b - a).slice(0, 3), exits: Array.from(this.exitPoints.entries()).sort(([,a], [,b]) => b - a).slice(0, 3), timestamp: Date.now(), privacy: { anon: true, cookies: false } };
    }



    resetEngagementData() {
      this.pageViews.clear();
      this.appClicks.clear();
      this.linkClicks.clear();
      this.engagementEvents = [];
      this.navigationHistory = [];
      this.searchQueries = [];
      this.filterUsage.clear();
      this.referrerData.clear();
      this.entryPoints.clear();
      this.exitPoints.clear();
      this.currentPageStartTime = Date.now();
    }
  }

  // Initialize global analytics instance
  window.PrivacyAnalytics = new PrivacyAnalytics();
  
  window.analyticsOptOut = () => window.PrivacyAnalytics.optOut();
  window.analyticsOptIn = () => window.PrivacyAnalytics.optIn();
  window.getAnalyticsStatus = () => window.PrivacyAnalytics.getPrivacyStatus();
  window.getEngagementMetrics = () => window.PrivacyAnalytics.calculateEngagementMetrics();
  window.exportEngagementData = () => window.PrivacyAnalytics.exportEngagementData();
  window.getPopularApps = () => window.PrivacyAnalytics.getPopularApps();
  window.exportJourneyData = () => window.PrivacyAnalytics.exportJourneyData();
  window.trackSearchBehavior = (q, r) => window.PrivacyAnalytics.trackSearchBehavior(q, r);
  window.trackNavigation = (f, t, m) => window.PrivacyAnalytics.trackNavigation(f, t, m);
  window.analyzeUserFlow = () => window.PrivacyAnalytics.analyzeUserFlow();
  
  const showBanner = () => {
    if (window.PrivacyAnalytics.enabled && !localStorage.getItem('analytics-banner-seen')) {
      const b = document.createElement('div');
      b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:var(--bg-alt,#fff);border-top:1px solid #ddd;padding:1rem;z-index:1000;font-size:0.9rem';
      b.innerHTML = '<div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between"><div><strong>🔒 Privacy Analytics</strong><br>Anonymous usage data, no cookies.</div><div><button onclick="acceptAnalytics()" style="background:#3584e4;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;margin-right:0.5rem">Got it</button><button onclick="optOutAnalytics()" style="background:transparent;border:1px solid #ccc;padding:0.5rem 1rem;border-radius:6px;cursor:pointer">Opt out</button></div></div>';
      document.body.appendChild(b);
      window.acceptAnalytics = () => { localStorage.setItem('analytics-banner-seen', 'true'); b.remove(); };
      window.optOutAnalytics = () => { window.analyticsOptOut(); localStorage.setItem('analytics-banner-seen', 'true'); b.remove(); };
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(showBanner, 2000));
  } else {
    setTimeout(showBanner, 2000);
  }

})();