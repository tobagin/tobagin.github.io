# frozen_string_literal: true

Jekyll::Hooks.register :site, :post_read do |site|
  site.data['apps']&.each do |app|
    slug = app['slug']
    site.pages << Jekyll::PageWithoutAFile.new(
      site,
      site.source,
      File.join('apps', slug),
      'index.html'
    ).tap do |page|
      page.content = ''
      page.data['layout'] = 'app'
      page.data['slug']  = slug
    end
  end
end
