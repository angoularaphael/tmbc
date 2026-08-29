import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://toulouse-minimes-boxing-club.fr',
  trailingSlash: 'never',
  compressHTML: false,
  build: { format: 'directory' },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => !/\/(planning|tarifs|coachs|contact)\/?$/.test(page),
    }),
  ],
  devToolbar: { enabled: false },
});
