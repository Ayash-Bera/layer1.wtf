import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/rpc': {
        target: 'https://idx6.solokhin.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rpc/, '/api'),
        secure: true,
        ws: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/l1beat': {
        target: 'https://whale-app-evtjn.ondigitalocean.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/l1beat/, '/api'),
        secure: true,
      },
      '/api/proxy/uptn': {
        target: 'https://node-api.uptn.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/uptn/, '/v1/ext/rpc'),
        secure: true,
        ws: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Make it look like a direct request
            proxyReq.setHeader('Host', 'node-api.uptn.io');
            proxyReq.setHeader('Origin', 'https://node-api.uptn.io');
            proxyReq.setHeader('Referer', 'https://node-api.uptn.io/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            // Remove proxy identification headers
            proxyReq.removeHeader('x-forwarded-for');
            proxyReq.removeHeader('x-forwarded-host');
            proxyReq.removeHeader('x-forwarded-proto');
            proxyReq.removeHeader('via');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Add CORS headers
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'POST, GET, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Accept';
          });
        },
      }
    },
  },
});