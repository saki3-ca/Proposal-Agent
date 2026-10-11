import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

function copyTestDataPlugin(): Plugin {
  return {
    name: 'copy-test-data',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'test_data');
      const destDir = path.resolve(__dirname, 'dist', 'test_data');
      if (fs.existsSync(srcDir)) {
        try {
          console.log('[copy-test-data] Copying test_data to dist/test_data...');
          fs.cpSync(srcDir, destDir, { recursive: true });
          console.log('[copy-test-data] ✓ Successfully copied test_data to dist/test_data');
        } catch (err) {
          console.error('[copy-test-data] Error copying test_data:', err);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyTestDataPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/process-document': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
      '/analyze-reference-docx': 'http://127.0.0.1:8000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});