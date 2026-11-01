
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dev-csp-meta',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          if (command !== 'serve') return html;
          return html.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>\s*/i, '');
        },
      },
    },
  ],
  resolve: {
    alias: {
      '@': workspaceRoot,
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
