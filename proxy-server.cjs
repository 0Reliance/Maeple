/**
 * MAEPLE Proxy Server
 * 
 * Serves the frontend build and proxies API requests to the backend
 */

const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');

const app = express();
const PORT = process.env.PROXY_PORT || 8083;
const API_TARGET = process.env.API_TARGET || 'http://maeple-api:3001';

// Add body parsing middleware FIRST
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Parse the API target URL
const targetUrl = new URL(API_TARGET);
const isHttps = targetUrl.protocol === 'https:';
const httpModule = isHttps ? https : http;

// Enhanced proxy function with proper body handling
function proxyRequest(req, res) {
  const targetUrl = new URL(req.originalUrl, API_TARGET);
  
  console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
  console.log(`[PROXY] Request body:`, req.body);
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (isHttps ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.hostname
    }
  };
  
  // Set proper content-length if we have a body
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyData = JSON.stringify(req.body);
    options.headers['content-length'] = Buffer.byteLength(bodyData);
  }
  
  const proxyReq = httpModule.request(options, (proxyRes) => {
    console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
    
    // Copy headers from the proxied response
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    // Pipe the response body
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('[PROXY] Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ 
        error: 'Bad Gateway', 
        details: 'Failed to connect to API service',
        proxyError: err.message 
      });
    }
  });
  
  // Write request body if it exists
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[PROXY] Writing body:`, JSON.stringify(req.body));
    proxyReq.write(JSON.stringify(req.body));
  } else {
    console.log(`[PROXY] No body to write`);
  }
  
  proxyReq.end();
}

// Enable request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint - must come before static files
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'maeple-proxy',
    version: '1.1.1'
  });
});

// Proxy API requests - handle both /api and /api/ patterns
app.use('/api', (req, res) => {
  console.log(`[API ROUTE] ${req.method} ${req.originalUrl} -> proxy`);
  console.log(`[DEBUG] Request body:`, req.body);
  console.log(`[DEBUG] About to call proxyRequest function`);
  proxyRequest(req, res);
  console.log(`[DEBUG] proxyRequest function called`);
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist'), {
  index: 'index.html'
}));

// Handle SPA routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  console.log(`[SPA ROUTE] Serving index.html for ${req.path}`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           MAEPLE Proxy Server v1.1.1               ║
║═══════════════════════════════════════════════════║
║  Frontend:  http://localhost:${PORT}                ║
║  API Proxy: /api -> ${API_TARGET}                    ║
║                                                   ║
║  Features:                                         ║
║    ✓ Static file serving                           ║
║    ✓ API request proxying                         ║
║    ✓ SPA routing support                           ║
║    ✓ Detailed logging                             ║
║    ✓ Error handling                               ║
║    ✓ Body parsing                                ║
╚═══════════════════════════════════════════════════╝
  `);
});
