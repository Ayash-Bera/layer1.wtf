import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/l1beat': {
        target: 'https://whale-app-evtjn.ondigitalocean.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/l1beat/, '/api'),
        secure: true,
      },
    },
  },
});
