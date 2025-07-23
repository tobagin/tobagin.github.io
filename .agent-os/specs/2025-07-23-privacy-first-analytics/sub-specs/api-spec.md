# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-07-23-privacy-first-analytics/spec.md

> Created: 2025-07-23
> Version: 1.0.0

## Endpoints

### GET /analytics/beacon (Optional Future Enhancement)

**Purpose:** Optional endpoint for collecting anonymous analytics data if GitHub Pages eventually supports server-side functionality
**Parameters:** 
- `event`: string (page_view, app_click, search, category_filter)
- `path`: string (anonymized page path)
- `timestamp`: string (ISO timestamp)
**Response:** 
```json
{
  "status": "recorded",
  "message": "Anonymous event logged"
}
```
**Errors:** 
- 400: Invalid event type
- 429: Rate limiting exceeded

## Client-Side Implementation

Since this is a static Jekyll site on GitHub Pages, the primary implementation will be client-side JavaScript with these interfaces:

### Analytics Object API

```javascript
// Core analytics interface
window.GnomeAnalytics = {
  track: function(event, data) {},
  pageView: function(path) {},
  appClick: function(appId, linkType) {},
  search: function(query, resultsCount) {},
  optOut: function() {},
  getStats: function() {}
}
```

### Event Types

**Page View Events**
```javascript
{
  type: 'page_view',
  path: '/apps/gedit',
  timestamp: '2025-07-23T10:30:00Z',
  referrer: 'search' | 'direct' | 'category' | 'external'
}
```

**App Interaction Events**
```javascript
{
  type: 'app_click',
  appId: 'org.gnome.gedit',
  linkType: 'flathub' | 'github' | 'docs' | 'wiki' | 'issues',
  timestamp: '2025-07-23T10:30:00Z'
}
```

**Search Events**
```javascript
{
  type: 'search',
  queryLength: 5, // Query length only, not actual query
  resultsCount: 12,
  timestamp: '2025-07-23T10:30:00Z'
}
```

## Data Export Interface

### Analytics Report Generation

For periodic insights, the system will generate anonymous reports that can be committed to the repository:

```javascript
// Report structure for manual analysis
{
  "reportDate": "2025-07-23",
  "timeRange": "7days",
  "pageViews": {
    "/": 1250,
    "/apps/gedit": 145,
    "/apps/evince": 98
  },
  "popularApps": {
    "org.gnome.gedit": 145,
    "org.gnome.evince": 98,
    "org.gnome.calculator": 87
  },
  "searchMetrics": {
    "totalSearches": 234,
    "averageResultsShown": 8.5,
    "searchesWithResults": 201
  }
}
```

## Privacy Implementation

### Consent Management
- Automatic detection of Do Not Track headers
- Respect for GDPR consent requirements
- Local storage of opt-out preferences
- No tracking without explicit consent in EU regions

### Data Anonymization
- No IP address collection or storage
- No user agent fingerprinting
- Session-only data collection (no cross-session tracking)
- Aggregated data only, no individual user profiles