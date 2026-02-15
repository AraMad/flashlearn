import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /flashlearn/, so we must set this base
  base: '/flashlearn/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Ensure manifest and other root files are included in the build
    rollupOptions: {
      input: {
        main: './index.html',
      },
    }
  }
});