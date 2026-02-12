import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // base: './' ensures that assets are loaded relative to the index.html,
  // which is required for GitHub Pages project sites (username.github.io/repo/).
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});