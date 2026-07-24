import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.FRONTEND_PORT || process.env.CLIENT_PORT || '3000', 10),
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || process.env.SERVER_PORT || '3001'}`,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'build'
  }
});
