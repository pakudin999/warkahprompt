import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './', // Wajib untuk GitHub Pages supaya aset diload dengan betul
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    // Ini PENTING: Define process.env supaya app tak crash (White Screen)
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {} 
    }
  };
});