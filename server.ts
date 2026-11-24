import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createExpressApp } from './server/app.ts';
import { resolveListenHost } from './server/listenHost.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const apiKey = process.env.GEMINI_API_KEY;

  const { app } = createExpressApp({
    initialApiKey: apiKey
  });

  // In production, serve static build; in development, mount Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const { host: HOST, isLoopback } = resolveListenHost(process.env);
  if (!isLoopback) {
    console.warn(
      `⚠️  HOST=${HOST} exposes this server to the network. The API has no authentication or rate limiting; use only on a trusted network.`
    );
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Thanaweya Math Copilot Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

