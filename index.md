---
layout: default
title: Home
---

<!-- Search and Filter Interface -->
<div class="search-filters">
  <div class="search-container">
    <input type="search" 
           id="search-input" 
           class="search-input"
           placeholder="Search applications..."
           aria-label="Search applications">
    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  </div>

  <div class="filter-container">
    <div class="category-filters">
      <h3 class="filter-label">Categories</h3>
      <div class="filter-buttons">
        <button class="category-filter active" data-category="all">All</button>
        {% assign categories = site.data.apps | map: 'category' | uniq | sort %}
        {% for category in categories %}
          <button class="category-filter" data-category="{{ category }}">{{ category }}</button>
        {% endfor %}
      </div>
    </div>

    <div class="tag-filters">
      <h3 class="filter-label">Tags</h3>
      <div class="filter-buttons">
        {% assign all_tags = site.data.apps | map: 'tags' | join: ',' | split: ',' | uniq | sort %}
        {% for tag in all_tags %}
          {% unless tag == blank %}
            <button class="tag-filter" data-tag="{{ tag | strip }}">{{ tag | strip }}</button>
          {% endunless %}
        {% endfor %}
      </div>
    </div>

    <button id="clear-filters" class="clear-filters">Clear All Filters</button>
  </div>
</div>

<!-- App Grid -->
<div class="grid">
{% for app in site.data.apps %}
  <a class="card" 
     href="apps/{{ app.slug }}"
     data-name="{{ app.name }}"
     data-tagline="{{ app.tagline }}"
     data-category="{{ app.category }}"
     data-tags="{{ app.tags | join: ',' }}">
    {% include responsive-image.html app=app type="icon" alt="App icon" %}
    <div class="card-body">
      <h3>{{ app.name }}</h3>
      <p>{{ app.tagline }}</p>
      <div class="app-meta">
        <span class="app-category">{{ app.category }}</span>
        <div class="app-tags">
          {% for tag in app.tags limit: 3 %}
            <span class="tag">{{ tag }}</span>
          {% endfor %}
          {% if app.tags.size > 3 %}
            <span class="tag-more">+{{ app.tags.size | minus: 3 }}</span>
          {% endif %}
        </div>
      </div>
    </div>
  </a>
{% endfor %}
</div>
