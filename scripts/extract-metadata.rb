#!/usr/bin/env ruby

require 'yaml'
require 'net/http'
require 'uri'
require 'nokogiri'

# Load apps data
apps_data = YAML.load_file('_data/apps.yml')

# New structure for enhanced metadata
enhanced_apps = []

apps_data.each do |app|
  puts "Processing #{app['name']}..."
  
  # Try different possible paths for metainfo.xml
  metainfo_paths = [
    "https://raw.githubusercontent.com/#{app['github']}/main/data/#{app['flathub']}.metainfo.xml",
    "https://raw.githubusercontent.com/#{app['github']}/main/data/#{app['flathub']}.metainfo.xml.in",
    "https://raw.githubusercontent.com/#{app['github']}/main/data/metainfo.xml",
    "https://raw.githubusercontent.com/#{app['github']}/main/data/metainfo.xml.in",
    "https://raw.githubusercontent.com/#{app['github']}/main/#{app['flathub']}.metainfo.xml",
    "https://raw.githubusercontent.com/#{app['github']}/main/#{app['flathub']}.metainfo.xml.in",
    "https://raw.githubusercontent.com/#{app['github']}/main/metainfo.xml",
    "https://raw.githubusercontent.com/#{app['github']}/main/metainfo.xml.in"
  ]
  
  metainfo_content = nil
  successful_url = nil
  
  metainfo_paths.each do |url|
    begin
      uri = URI(url)
      response = Net::HTTP.get_response(uri)
      if response.code == '200'
        metainfo_content = response.body
        successful_url = url
        break
      end
    rescue => e
      puts "  Failed to fetch #{url}: #{e.message}"
    end
  end
  
  if metainfo_content
    puts "  Found metainfo at: #{successful_url}"
    
    # Parse XML
    doc = Nokogiri::XML(metainfo_content)
    
    # Extract screenshots
    screenshots = []
    doc.xpath('//screenshot').each_with_index do |screenshot, index|
      image_url = screenshot.xpath('image').text.strip
      caption = screenshot.xpath('caption').text.strip
      is_default = screenshot['type'] == 'default'
      
      if !image_url.empty?
        screenshots << {
          'url' => image_url,
          'caption' => caption,
          'default' => is_default,
          'index' => index
        }
      end
    end
    
    # Enhanced app data
    enhanced_app = app.dup
    enhanced_app['metainfo_screenshots'] = screenshots
    enhanced_app['icon_sizes'] = ['16', '32', '48', '64', '128', '256', '512']
    
    enhanced_apps << enhanced_app
    puts "  Found #{screenshots.length} screenshots"
  else
    puts "  No metainfo.xml found, using existing data"
    enhanced_apps << app
  end
end

# Write enhanced apps data
File.open('_data/apps_enhanced.yml', 'w') do |file|
  file.write(enhanced_apps.to_yaml)
end

puts "\nEnhanced metadata written to _data/apps_enhanced.yml"
puts "Found #{enhanced_apps.select { |app| app['metainfo_screenshots'] }.length} apps with metainfo screenshots"