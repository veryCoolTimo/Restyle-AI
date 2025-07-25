import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        'extractHtml-standalone': resolve(__dirname, 'src/content/extractHtml-standalone.ts'),
        'applyPatch-standalone': resolve(__dirname, 'src/content/applyPatch-standalone.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'extractHtml-standalone') return 'assets/extractHtml-standalone.js';
          if (chunkInfo.name === 'applyPatch-standalone') return 'assets/applyPatch-standalone.js';
          return 'assets/[name]-[hash].js';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
