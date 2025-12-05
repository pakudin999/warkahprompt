import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Wajib untuk GitHub Pages supaya aset tidak 404
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});