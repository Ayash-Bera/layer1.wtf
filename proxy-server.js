import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = 3001;
const TARGET_URL = 'https://node-api.uptn.io/v1/ext/rpc';

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // Only handle POST requests to /proxy/uptn
  if (req.method === 'POST' && req.url === '/proxy/uptn') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const targetUrl = new URL(TARGET_URL);
      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 443,
        path: targetUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      };

      const proxyReq = https.request(options, (proxyRes) => {
        // Set CORS headers
        res.writeHead(proxyRes.statusCode, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Content-Type': 'application/json',
        });

        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});

