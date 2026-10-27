import { spawn } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';

const root = process.cwd();
loadEnv({ path: join(root, '.env') });
const standaloneDir = join(root, '.next', 'standalone');
const serverFile = join(standaloneDir, 'server.js');

if (!existsSync(serverFile)) {
	console.error(
		'Standalone build not found. Run `npm run build` before `npm start`.',
	);
	process.exit(1);
}

const assets = [
	[join(root, 'public'), join(standaloneDir, 'public')],
	[join(root, '.next', 'static'), join(standaloneDir, '.next', 'static')],
];

for (const [source, destination] of assets) {
	if (!existsSync(source)) continue;
	cpSync(source, destination, { recursive: true, force: true });
}

const child = spawn(process.execPath, [serverFile], {
	cwd: root,
	env: process.env,
	stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => child.kill(signal));
}

child.on('error', (error) => {
	console.error(error);
	process.exit(1);
});

child.on('exit', (code, signal) => {
	process.exit(signal ? 0 : (code ?? 1));
});
