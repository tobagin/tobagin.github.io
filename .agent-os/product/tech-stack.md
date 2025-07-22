# Technical Stack

> Last Updated: 2025-01-25
> Version: 1.0.0

## Application Framework

- **Jekyll** ~4.3
- Static site generator with powerful templating and data processing capabilities

## Database System

- **YAML data files** (_data/app.yml)
- Static data storage for application metadata and configuration

## JavaScript Framework

- **Vanilla JavaScript**
- Lightweight, no-framework approach for minimal overhead and maximum compatibility

## Import Strategy

- **Direct script inclusion**
- Traditional script tags for simplicity and reliability

## CSS Framework

- **Custom SCSS** with GNOME/Adwaita design system
- Hand-crafted styles following GNOME Human Interface Guidelines

## UI Component Library

- **Custom components** following GNOME HIG
- Bespoke components designed specifically for GNOME aesthetic and usability

## Fonts Provider

- **System fonts** (Cantarell, Inter, system-ui)
- Native font stack for optimal GNOME integration and performance

## Icon Library

- **Flathub app icons** + emoji for UI elements
- Application icons sourced directly from Flathub CDN for consistency

## Application Hosting

- **GitHub Pages**
- Integrated hosting solution with automatic deployment from repository

## Database Hosting

- **N/A** (static YAML files)
- Data stored as static files in repository, no external database required

## Asset Hosting

- **GitHub Pages** + Flathub CDN
- Static assets served from GitHub Pages, app icons and screenshots from Flathub

## Deployment Solution

- **GitHub Actions**
- Automated build and deployment pipeline triggered by repository changes

## Code Repository URL

- **https://github.com/tobagin/tobagin.github.io**
- Public repository hosting all source code and content