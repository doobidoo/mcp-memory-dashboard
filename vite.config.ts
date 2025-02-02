import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'fs';
import electron from 'vite-plugin-electron';
import path from 'path';

const writePort = () => ({
  name: 'write-port',
  configureServer(server: any) {
    const port = server.config.server.port;
    writeFileSync('.vite-port', port.toString());
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    writePort(),
    electron({
      entry: [
        'electron/main.ts',
        'electron/preload.ts'
      ],
      vite: {
        build: {
          outDir: 'dist/electron',
          rollupOptions: {
            external: ['electron', 'fs', 'path', 'util']
          }
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist'
  },
  server: {
    port: 5173
  }
});