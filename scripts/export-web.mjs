import { execSync } from 'node:child_process';

const stamp = new Date().toISOString();

try {
  execSync('npx expo export --platform web --output-dir dist', {
    env: { ...process.env, EXPO_PUBLIC_BUILD_STAMP: stamp },
    stdio: 'inherit',
  });
} catch (err) {
  const locked = String(err?.message || err).includes('EBUSY')
    || String(err?.stderr || '').includes('EBUSY');
  if (locked) {
    console.error('\nExport failed: the dist folder is locked by another program.');
    console.error('On Windows this usually means:');
    console.error('  - a local server is still running (e.g. npx serve dist, expo start --web)');
    console.error('  - File Explorer has the dist folder open');
    console.error('  - an editor or antivirus is scanning dist');
    console.error('\nStop those, then run: npm run deploy:web\n');
  }
  process.exit(1);
}

console.log(`Web export complete (EXPO_PUBLIC_BUILD_STAMP=${stamp})`);
