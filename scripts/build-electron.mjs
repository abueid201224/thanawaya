import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist-electron');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function buildElectron() {
  console.log('⚡ Bundling Electron processes using esbuild...');

  // 1. Bundle Main Process
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'electron/main.ts')],
    outfile: path.join(outDir, 'main.cjs'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    sourcemap: true,
    minify: false,
    external: ['electron']
  });

  // 2. Bundle Preload Process
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'electron/preload.ts')],
    outfile: path.join(outDir, 'preload.cjs'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    sourcemap: true,
    minify: false,
    external: ['electron']
  });

  console.log('✅ Electron main and preload processes compiled successfully to dist-electron/');
}

buildElectron().catch((err) => {
  console.error('❌ Failed to build Electron processes:', err);
  process.exit(1);
});
