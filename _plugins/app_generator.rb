# _plugins/app_generator.rb
puts "== plugin loaded =="

Jekyll::Hooks.register :site, :post_read do |site|
  puts "== hook fired, apps.yml contains #{site.data['apps'].size} entries =="

  site.data['apps']&.each do |app|
    slug = app['slug']
    puts "  generating /apps/#{slug}/index.html"

    page = Jekyll::PageWithoutAFile.new(
      site,
      site.source,
      File.join('apps', slug),
      'index.html'
    )
    page.content = ''
    page.data['layout'] = 'app'
    page.data['slug']  = slug
    site.pages << page
  end
end
