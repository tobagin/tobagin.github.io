---
layout: default
title: Home
---

# Tobagin Apps

A handful of open-source utilities built for GNOME and shipped as Flatpaks.

{% for app in site.data.apps %}
- **[{{ app.name }}](apps/{{ app.slug }})** — {{ app.tagline }}
{% endfor %}

## Contribute / Report Issues

All code lives on [GitHub](https://github.com/tobagin).
