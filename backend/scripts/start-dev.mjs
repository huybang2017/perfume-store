/**
 * Dev entry: run compiled output (dist/src/main.js) after ensuring build exists.
 * Avoids Nest watch race when dist/src/main.js is briefly missing during rebuild.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mainJs = path.join(root, 'dist', 'src', 'main.js');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      ...opts,
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function ensureBuild() {
  if (fs.existsSync(mainJs)) return;
  console.log('[dev] dist/src/main.js missing — running nest build...');
  await run('npx', ['nest', 'build', '--builder', 'tsc']);
}

await ensureBuild();

const nest = spawn('npx', ['nest', 'start', '--watch', '--preserveWatchOutput'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

nest.on('exit', (code) => process.exit(code ?? 0));
