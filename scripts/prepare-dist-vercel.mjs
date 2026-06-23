import { copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');

copyFileSync(join(root, 'vercel.json'), join(dist, 'vercel.json'));

const stamp = new Date().toISOString();
writeFileSync(
  join(dist, 'build-stamp.json'),
  JSON.stringify({ builtAt: stamp }, null, 2),
);

console.log(`Prepared dist for Vercel deploy (builtAt: ${stamp})`);
