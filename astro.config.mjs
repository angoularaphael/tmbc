import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://toulouse-minimes-boxing-club.fr",
  trailingSlash: "always",
  compressHTML: false,
  build: { format: "directory" },
  devToolbar: { enabled: false },
});
