import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createExpressApp } from './server/app.ts';
import { resolveListenHost, isNetworkBindAllowed } from './server/listenHost.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const apiKey = process.env.GEMINI_API_KEY;
  const isCloudRun = Boolean(process.env.K_SERVICE || process.env.K_REVISION);

  const effectiveEnv =
    isCloudRun && !(process.env.HOST ?? '').trim()
      ? { ...process.env, HOST: '0.0.0.0' }
      : process.env;

  const { host: HOST, isLoopback } = resolveListenHost(effectiveEnv);
  if (!isLoopback && !isCloudRun && !isNetworkBindAllowed(process.env)) {
    console.error(
      `Refusing to bind to HOST=${HOST}: the API has no authentication. Set ALLOW_NETWORK_BIND=1 to confirm you want network exposure.`
    );
    process.exit(1);
  }

  const { app } = createExpressApp({
    initialApiKey: apiKey,
    loopbackOnly: isLoopback
  });

  // In production, serve static build; in development, mount Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  if (!isLoopback && !isCloudRun) {
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

