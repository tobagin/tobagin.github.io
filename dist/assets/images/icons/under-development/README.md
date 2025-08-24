# Under Development App Icons

This directory contains icons for applications that are currently under development and not yet ready for the main portfolio.

## Structure

Each app should have its own subdirectory with optimized icons:

```
under-development/
├── app-name/
│   ├── icon-128w.jpg
│   └── icon-128w.webp
└── another-app/
    ├── icon-128w.jpg
    └── icon-128w.webp
```

## Guidelines

- **Icon Size**: 128x128 pixels optimized for web
- **Formats**: Both JPG and WebP versions for performance
- **Naming**: Use kebab-case for folder names (e.g., `my-awesome-app`)
- **Quality**: Follow the same optimization standards as production icons

## Moving to Production

When an app is ready for the main portfolio:

1. Move the icon folder from `under-development/` to the main `icons/` directory
2. Add the app entry to `src/data/apps.yml`
3. The build process will automatically include it in the site

## Notes

Icons in this directory are not included in the main site build but are preserved in the repository for development purposes.