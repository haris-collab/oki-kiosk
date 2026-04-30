import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// All env vars prefixed with VITE_ are auto-exposed via
// import.meta.env on both local dev and hosted builds.
// No define() / process.env trickery required.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
