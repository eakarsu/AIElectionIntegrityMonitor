import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ command, mode }) => {
  const configured = command === 'serve' ? loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), '') : {};
  const demoAvailable = Boolean(configured.DEMO_EMAIL && configured.DEMO_PASSWORD);
  return {
  plugins: [react()],
  // Local development only: use the existing configured demo account.
  // Production bundles never receive these credentials.
  define: command === 'serve' ? {
    'import.meta.env.VITE_DEMO_EMAIL': JSON.stringify(demoAvailable ? configured.DEMO_EMAIL : ''),
    'import.meta.env.VITE_DEMO_PASSWORD': JSON.stringify(demoAvailable ? configured.DEMO_PASSWORD : ''),
    'import.meta.env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL': JSON.stringify(String(demoAvailable))
  } : {},
  server: {
    port: parseInt(process.env.FRONTEND_PORT || process.env.CLIENT_PORT || '3000', 10),
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || process.env.SERVER_PORT || '3001'}`,
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (upstream, request, response) => {
            const abort = () => { if (!response.writableEnded) upstream.destroy(); };
            response.once('close', abort);
            upstream.once('close', () => response.removeListener('close', abort));
          });
        }
      }
    }
  },
  build: {
    outDir: 'build'
  }
  };
});
