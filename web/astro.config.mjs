import { defineConfig } from "astro/config";

/* Pages are written to dist/<name>/index.html and then copied to the repository root by sync.mjs, where the rest of
   the site lives. Links stay relative ("../assets/..."), exactly as in the hand-written pages, so a page works at any
   address the site is served from. */
export default defineConfig({
  outDir: "./dist",
  build: { format: "directory", inlineStylesheets: "never" },
  trailingSlash: "always",
  compressHTML: true,
  devToolbar: { enabled: false },
});
