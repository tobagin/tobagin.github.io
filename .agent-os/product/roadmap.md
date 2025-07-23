# Product Roadmap

> Last Updated: 2025-01-25
> Version: 1.0.0
> Status: Planning

## Phase 0: Already Completed

The following features have been implemented:

- [x] **Portfolio Grid Layout** - Responsive grid displaying applications with icons and basic info `DONE`
- [x] **Individual App Pages** - Detailed pages generated automatically for each application `DONE`
- [x] **Dark/Light Theme Toggle** - System-aware theming with manual override capability `DONE`
- [x] **Responsive Design** - Mobile-first design with GNOME/Adwaita color system `DONE`
- [x] **Jekyll Plugin System** - Automatic page generation via custom app_generator.rb plugin `DONE`
- [x] **Flathub Integration** - Automatic fetching of app icons and screenshots from Flathub CDN `DONE`

## Phase 1: Enhanced Data Structure (2 weeks)

**Goal:** Implement comprehensive application data structure with full resource linking
**Success Criteria:** All apps have complete metadata including links to issues, docs, wikis, and discussions

### Must-Have Features

- [x] **Enhanced App Schema** - Add fields for docs_url, wiki_url, issues_url, discussions_url `DONE`
- [x] **Data Validation** - Implement YAML schema validation for app entries `DONE`
- [x] **Resource Link UI** - Display comprehensive resource links on app pages `DONE`
- [x] **Link Status Checking** - Validate that provided URLs are accessible `DONE`

### Should-Have Features

- [ ] **App Categories** - Categorization system for better organization `M`
- [ ] **Tag System** - Flexible tagging for cross-cutting concerns `S`

### Dependencies

- Complete Phase 0 features
- Access to app maintainer resources

## Phase 2: Search and Discovery (1 week)

**Goal:** Implement search functionality and improve app discoverability
**Success Criteria:** Users can quickly find apps by name, category, or tags

### Must-Have Features

- [ ] **Client-Side Search** - Fast search across app names and descriptions `M`
- [ ] **Category Filtering** - Filter apps by category with clean UI `S`
- [ ] **Tag-Based Filtering** - Multi-tag filtering with intersection logic `M`

### Should-Have Features

- [ ] **Search Analytics** - Track popular searches to improve content `S`
- [ ] **Keyboard Shortcuts** - Power user shortcuts for search and navigation `XS`

### Dependencies

- Phase 1 category system
- Enhanced app metadata

## Phase 3: Performance and SEO (1 week)

**Goal:** Optimize site performance and search engine visibility
**Success Criteria:** Core Web Vitals scores >90, indexed by search engines

### Must-Have Features

- [ ] **Image Optimization** - Optimized app screenshots and icons `M`
- [ ] **SEO Metadata** - Comprehensive meta tags and structured data `M`
- [ ] **Performance Monitoring** - Core Web Vitals tracking and optimization `L`

### Should-Have Features

- [ ] **Progressive Web App** - Service worker for offline app list viewing `L`
- [ ] **Lazy Loading** - Improve initial page load with progressive loading `S`

### Dependencies

- Stable app data structure
- Performance baseline measurements

## Phase 4: Analytics and Insights (2 weeks)

**Goal:** Implement privacy-respecting analytics and user insights
**Success Criteria:** Understand user behavior while respecting privacy

### Must-Have Features

- [ ] **Privacy-First Analytics** - Self-hosted or privacy-focused analytics solution `L`
- [ ] **App Popularity Tracking** - Track which apps are most viewed/clicked `M`
- [ ] **User Journey Analysis** - Understand how users discover and engage with apps `M`

### Should-Have Features

- [ ] **A/B Testing Framework** - Test layout and content variations `L`
- [ ] **Feedback Collection** - Gather user feedback on app recommendations `M`

### Dependencies

- Privacy policy review
- Analytics tool evaluation

## Phase 5: Community and Contribution (3 weeks)

**Goal:** Build community features and streamline contribution workflows
**Success Criteria:** External contributors can easily suggest new apps and improvements

### Must-Have Features

- [ ] **App Submission Workflow** - GitHub issue templates for app suggestions `S`
- [ ] **Contribution Guidelines** - Clear documentation for community contributions `M`
- [ ] **Automated App Onboarding** - Scripts to help validate and add new apps `L`

### Should-Have Features

- [ ] **Community Voting** - Let community vote on app suggestions `L`
- [ ] **Maintainer Dashboard** - Tools for app maintainers to update their info `XL`
- [ ] **Integration APIs** - Allow apps to self-register via API calls `XL`

### Dependencies

- Established community guidelines
- Moderation workflows
- Legal review for user-generated content