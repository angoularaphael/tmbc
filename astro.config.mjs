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
      filter: (page) => !/\/(coachs)\/?$/.test(page),
      serialize(item) {
        if (item.url === 'https://toulouse-minimes-boxing-club.fr' || item.url === 'https://toulouse-minimes-boxing-club.fr/') {
          item.priority = 1.0;
        }
        if (/\/club-boxe-toulouse-minimes|\/boxe-anglaise-toulouse|\/essai-boxe-toulouse|\/boxing-center-minimes/.test(item.url)) {
          item.priority = 0.9;
        }
        return item;
      },
    }),
  ],
  devToolbar: { enabled: false },
});
