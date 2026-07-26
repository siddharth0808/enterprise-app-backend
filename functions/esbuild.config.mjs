import { build } from 'esbuild';
import { rmSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'dist');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const handlers = {
  register: path.join(__dirname, 'register', 'handler.ts'),
  products: path.join(__dirname, 'products', 'handler.ts'),
  orders: path.join(__dirname, 'orders', 'handler.ts'),
  images: path.join(__dirname, 'images', 'handler.ts'),
};

for (const [name, entryPoint] of Object.entries(handlers)) {
  const outputDir = path.join(outDir, name);
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    outfile: path.join(outputDir, 'index.js'),
    external: ['@aws-sdk/*', 'aws-sdk'],
    minify: true,
    sourcemap: true,
    logLevel: 'info',
  });
}
