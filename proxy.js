const http = require('http');

const PROXY_PORT = 8085;
const DJANGO_PORT = 8000;

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const options = {
    hostname: '127.0.0.1',
    port: DJANGO_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  options.headers.host = `127.0.0.1:${DJANGO_PORT}`;

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`Error en proxy: ${e.message}`);
    res.writeHead(500);
    res.end();
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Node.js Proxy corriendo en http://0.0.0.0:${PROXY_PORT}`);
  console.log(`Reenviando todo el trafico a Django en http://127.0.0.1:${DJANGO_PORT}`);
});
