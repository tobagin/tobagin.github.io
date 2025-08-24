
# GNOME Portfolio

A modern Node.js static site generator showcasing quality GNOME applications with comprehensive resource links and unified access to project documentation, issues, and community discussions.

## Features

- **Curated App Collection**: Carefully selected GNOME applications following design guidelines
- **Unified Resource Access**: One-click access to documentation, wikis, issues, and discussions
- **Responsive Design**: Optimized experience across desktop, tablet, and mobile
- **GNOME Design System**: Authentic Adwaita colors, typography, and interaction patterns
- **Dark/Light Theme Support**: System-aware theming with manual override

## Data Schema

### App Entry Structure

Each app in `src/data/apps.yml` follows this schema:

```yaml
- slug: app-identifier          # Required: URL-friendly identifier
  name: "App Display Name"      # Required: Human-readable name
  tagline: "Brief description"  # Required: One-line app description
  github: "username/repo"       # Required: GitHub repository
  flathub: "app.id.on.flathub"  # Required: Flathub application ID
  resources:                    # Optional: Additional resource links
    docs_url: "https://..."     # Optional: Documentation URL
    wiki_url: "https://..."     # Optional: Project wiki URL
    issues_url: "https://..."   # Optional: Issue tracker URL
    discussions_url: "https://..." # Optional: Discussions/forum URL
```

### Required Fields

- **slug**: Unique identifier used in URLs (kebab-case recommended)
- **name**: Display name shown to users
- **tagline**: Brief, compelling description (recommended: under 60 characters)
- **github**: GitHub repository in "username/repository" format
- **flathub**: Flathub application ID for installation links

### Optional Resource Fields

The `resources` section allows linking to additional project resources:

- **docs_url**: Link to project documentation (README, user guides, API docs)
- **wiki_url**: Link to project wiki or knowledge base
- **issues_url**: Link to issue tracker for bug reports and feature requests
- **discussions_url**: Link to community discussions, forums, or Q&A

All resource URLs are optional and will only display if provided. URLs should be valid HTTPS links.

### Schema Validation

- URLs must start with `https://` for security
- GitHub usernames and repositories are validated against standard patterns
- Flathub IDs follow reverse-domain notation (e.g., `com.example.AppName`)
- All fields support Unicode characters for international app names

## How to Add a New App

1. **Add Entry**: Create a new entry in `src/data/apps.yml` following the schema above
2. **Validate Data**: Ensure all required fields are present and URLs are accessible
3. **Test Locally**: Run `node build.js` and serve the `dist/` directory to preview changes
4. **Commit Changes**: Push to the repository
5. **Auto-Deploy**: GitHub Actions will rebuild and deploy the site
6. **Access Page**: Your app page will be live at `https://tobagin.github.io/apps/<slug>/`

### Example Entry

```yaml
- slug: example-app
  name: "Example GNOME App"
  tagline: "A sample application demonstrating the schema"
  github: "username/example-app"
  flathub: "io.github.username.ExampleApp"
  resources:
    docs_url: "https://username.github.io/example-app/docs"
    wiki_url: "https://github.com/username/example-app/wiki"
    issues_url: "https://github.com/username/example-app/issues"
    discussions_url: "https://github.com/username/example-app/discussions"
```

## Development

### Local Setup

```bash
# Clone the repository
git clone https://github.com/tobagin/tobagin.github.io.git
cd tobagin.github.io

# Install dependencies
npm install

# Build the site
node build.js

# Serve locally (you can use any static server)
npx serve dist
# or
python -m http.server 8000 --directory dist

# Open in browser
open http://localhost:3000  # for serve
# or
open http://localhost:8000  # for python server
```

### Project Structure

```
.
├── src/
│   ├── data/
│   │   └── apps.yml          # App data following the schema
│   ├── templates/
│   │   ├── index.ejs         # Homepage template
│   │   ├── app.ejs           # Individual app page template
│   │   └── partials/         # Reusable template components
│   ├── styles/
│   │   ├── main.css          # Main stylesheet
│   │   └── components/       # Component-specific styles
│   └── assets/
│       └── images/           # Optimized app icons and screenshots
├── dist/                     # Generated site (deployment target)
├── build.js                  # Static site generator
├── package.json              # Node.js dependencies
└── .github/workflows/        # GitHub Actions deployment
```

### Architecture

The site uses a custom Node.js static site generator that:

- Loads app data from YAML files
- Renders pages using EJS templates
- Processes and minifies CSS and HTML
- Optimizes images and generates responsive variants
- Creates sitemaps and PWA manifests
- Builds everything into a deployable `dist/` directory

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Add your app following the data schema
4. Test locally to ensure proper rendering
5. Submit a pull request with a clear description

### Quality Guidelines

Apps included should demonstrate:

- **GNOME Design Adherence**: Follow Human Interface Guidelines
- **Active Maintenance**: Regular updates and responsive maintainers
- **Quality Documentation**: Clear README and user guides
- **Flathub Presence**: Available through the official Flathub store
- **Open Source**: Publicly available source code on GitHub
