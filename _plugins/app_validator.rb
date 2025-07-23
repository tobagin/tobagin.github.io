# _plugins/app_validator.rb
# Validation helper for enhanced app schema

module AppValidator
  # Validate URL format
  def self.valid_url?(url)
    return false if url.nil? || url.empty?
    return true if url.match?(/\Ahttps?:\/\/[^\s]+\z/)
    false
  end

  # Validate app entry structure
  def self.validate_app(app)
    errors = []
    
    # Check required fields
    required_fields = ['slug', 'name', 'tagline', 'github', 'flathub']
    required_fields.each do |field|
      if app[field].nil? || app[field].empty?
        errors << "Missing required field: #{field}"
      end
    end
    
    # Validate resources section if present
    if app['resources']
      resources = app['resources']
      ['docs_url', 'wiki_url', 'issues_url', 'discussions_url'].each do |field|
        if resources[field] && !valid_url?(resources[field])
          errors << "Invalid URL format for #{field}: #{resources[field]}"
        end
      end
    end
    
    errors
  end

  # Validate all apps and print warnings
  def self.validate_all_apps(site)
    return unless site.data['apps']
    
    site.data['apps'].each_with_index do |app, index|
      errors = validate_app(app)
      if errors.any?
        Jekyll.logger.warn "App #{index + 1} (#{app['name'] || 'Unknown'}) validation errors:"
        errors.each { |error| Jekyll.logger.warn "  - #{error}" }
      end
    end
  end
end

# Hook into Jekyll build process to validate apps
Jekyll::Hooks.register :site, :post_read do |site|
  AppValidator.validate_all_apps(site)
end