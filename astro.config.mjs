import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://frames.wpkerala.org',
  output: 'static',
  build: {
    format: 'directory'
  }
});
