# _plugins/app_generator.rb
# Generates one HTML file per app at build time

Jekyll::Hooks.register :site, :post_read do |site|
  site.data['apps']&.each do |app|
    slug = app['slug']
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
