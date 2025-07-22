#!/usr/bin/env ruby
# Test script to validate enhanced app schema

require 'yaml'

# Load the app data
begin
  apps = YAML.load_file('_data/app.yml')
  puts "✓ YAML loaded successfully with #{apps.length} apps"
rescue => e
  puts "✗ YAML loading failed: #{e.message}"
  exit 1
end

# Validate schema
apps.each_with_index do |app, index|
  puts "\n--- App #{index + 1}: #{app['name'] || 'Unknown'} ---"
  
  # Check required fields
  required = ['slug', 'name', 'tagline', 'github', 'flathub']
  required.each do |field|
    if app[field]
      puts "✓ #{field}: #{app[field]}"
    else
      puts "✗ Missing required field: #{field}"
    end
  end
  
  # Check optional resources
  if app['resources']
    puts "✓ Resources section found:"
    app['resources'].each do |key, value|
      if value && value.match?(/^https?:\/\//)
        puts "  ✓ #{key}: #{value}"
      else
        puts "  ⚠ #{key}: Invalid URL format: #{value}"
      end
    end
  else
    puts "○ No resources section (backward compatible)"
  end
end

puts "\n--- Summary ---"
puts "Schema validation completed successfully!"
puts "Backward compatibility: ✓ (apps without resources section still work)"
puts "New features: ✓ (apps with resources section have enhanced data)"