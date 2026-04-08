import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const config = defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web-backoffice',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  preview: { port: 4200, host: 'localhost' },
  plugins: [react(), nxViteTsPaths()],
  build: {
    outDir: '../../dist/apps/web-backoffice',
    emptyOutDir: true,
    reportCompressedSize: true,
    target: 'es2020',
    commonjsOptions: { transformMixedEsModules: true },
  },
}));

export { config as default };
