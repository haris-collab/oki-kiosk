import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv reads .env files — used during local dev.
  const fileEnv = loadEnv(mode, process.cwd(), '');
  // Hosts like Netlify / Vercel inject env vars as actual process.env
  // values, not .env files. Fall back to those at build time so the
  // deployed bundle gets the real key.
  const geminiKey = fileEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Expose under both names for legacy import paths.
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      'process.env.API_KEY': JSON.stringify(geminiKey),
    },
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
  };
});
