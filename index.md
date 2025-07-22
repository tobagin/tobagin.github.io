---
layout: default
title: Home
---

<div class="grid">
{% for app in site.data.apps %}
  <a class="card" href="apps/{{ app.slug }}">
    <img src="https://dl.flathub.org/media/{{ app.flathub | replace: '.', '/' }}/icons/128x128/{{ app.flathub }}.png"
         alt="{{ app.name }} icon">
    <div class="card-body">
      <h3>{{ app.name }}</h3>
      <p>{{ app.tagline }}</p>
    </div>
  </a>
{% endfor %}
</div>
