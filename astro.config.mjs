import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://toulouse-minimes-boxing-club.fr',
  trailingSlash: 'never',
  compressHTML: true,
  build: { format: 'directory' },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  devToolbar: { enabled: false },
});
