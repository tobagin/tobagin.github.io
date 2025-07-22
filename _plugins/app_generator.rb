# _plugins/app_generator.rb
Jekyll::Hooks.register :site, :post_read do |site|
  (site.data['apps'] || []).each do |app|
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
