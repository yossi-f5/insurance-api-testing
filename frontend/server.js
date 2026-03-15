/* eslint-env node */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 8080);
const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3001';
const backendApiTarget = `${backendBaseUrl.replace(/\/+$/, '')}/api`;

if (!process.env.BACKEND_BASE_URL) {
  console.warn('[frontend-server] BACKEND_BASE_URL is not set. Using default http://localhost:3001');
}

app.use(
  '/api',
  createProxyMiddleware({
    target: backendApiTarget,
    changeOrigin: true,
    xfwd: true,
    logLevel: 'warn'
  })
);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`[frontend-server] Listening on port ${port}`);
  console.log(`[frontend-server] Proxying /api to ${backendApiTarget}`);
});
