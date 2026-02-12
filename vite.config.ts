
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures paths work on GitHub Pages subfolders
  build: {
    outDir: 'dist',
  }
});
