# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-07-22-search-discovery-system/spec.md

> Created: 2025-07-22
> Version: 1.0.0

## Schema Changes

### Add Category and Tags Fields to _data/apps.yml

**New Fields:**
```yaml
- slug: example-app
  name: "Example App"
  tagline: "Example tagline"
  github: username/repo
  flathub: com.example.app
  category: "Development"                    # NEW: Single category
  tags: ["gtk4", "rust", "networking"]       # NEW: Array of tags
  resources:
    # ... existing resources structure unchanged
```

### Category Specifications

**Predefined Categories:**
- `Development` - IDEs, text editors, version control tools, development utilities
- `Graphics` - Image editors, design tools, drawing applications, photo management
- `Productivity` - Office suites, note-taking, project management, calculators
- `System` - System utilities, file managers, disk tools, system monitors
- `Network` - Web browsers, email clients, chat applications, network tools
- `Entertainment` - Media players, games, streaming applications
- `Education` - Learning tools, reference applications, language tools
- `Accessibility` - Screen readers, magnifiers, accessibility utilities

**Validation Rules:**
- Category field is required for all apps
- Must be one of the predefined categories (enforced by Jekyll validation)
- Single category per app (no multi-category support)

### Tag Specifications

**Tag Structure:**
- Free-form strings for maximum flexibility
- Multiple tags per app supported (array format)
- Case-insensitive matching for user searches
- No predefined tag list (tags emerge organically)

**Suggested Tag Categories:**
- **Technologies:** `gtk4`, `gtk3`, `rust`, `python`, `c`, `vala`, `javascript`
- **Frameworks:** `libadwaita`, `webkit`, `gstreamer`, `flatpak`
- **Features:** `dark-mode`, `offline`, `sync`, `encryption`, `accessibility`
- **Patterns:** `responsive`, `adaptive`, `mobile-friendly`, `keyboard-shortcuts`

### Migration Strategy

**Phase 1: Add Fields to Existing Apps**
1. Add `category` field to all 6 existing apps based on their functionality:
   - Digger: "Network" (DNS lookup tool)
   - Karere: "Network" (Matrix chat client)
   - KeySmith: "System" (SSH key manager)
   - Secrets Manager: "System" (password manager)
   - Sonar: "Development" (webhook inspector)
   - Tempo: "Entertainment" (metronome)

2. Add relevant `tags` to each app:
   - Digger: `["networking", "dns", "gtk4", "rust"]`
   - Karere: `["chat", "matrix", "messaging", "gtk4"]`
   - KeySmith: `["ssh", "security", "keys", "gtk4"]`
   - Secrets Manager: `["password", "security", "encryption", "gtk4"]`
   - Sonar: `["development", "webhook", "networking", "debugging"]`
   - Tempo: `["music", "metronome", "gtk4", "audio"]`

**Phase 2: Update Jekyll Templates**
- Modify app page templates to display category and tags
- Add category and tag data to JSON output for JavaScript filtering
- Ensure backwards compatibility with apps missing category/tags fields

**Data Integrity Rules:**
- All new apps must include both category and tags fields
- Categories must match the predefined list exactly
- Tags should follow kebab-case naming convention for consistency
- Empty tags array is acceptable, but category field is required