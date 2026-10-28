import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import EmbeddedPostgres from 'embedded-postgres';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const dataDir = join(root, '.local', 'postgres');
const defaultPort = 55432;
const defaultDatabase = 'hms';

let activePostgres;
let ownsPostgres = false;

function ensureEnvFile() {
	if (existsSync(envPath)) return;

	const secret = randomBytes(48).toString('base64');
	const databaseUrl = `postgresql://postgres:postgres@localhost:${defaultPort}/${defaultDatabase}?schema=public`;
	const contents = [
		`DATABASE_URL="${databaseUrl}"`,
		`NEXTAUTH_SECRET="${secret}"`,
		'NEXTAUTH_URL="http://localhost:3000"',
		'',
	].join('\n');

	writeFileSync(envPath, contents, { mode: 0o600 });
	console.log('Created .env with a local database and generated secret.');
}

function fail(message) {
	console.error(`\n${message}`);
	process.exit(1);
}

function isPortOpen(port) {
	return new Promise((resolve) => {
		const socket = createConnection({ host: '127.0.0.1', port });

		socket.once('connect', () => {
			socket.end();
			resolve(true);
		});
		socket.once('error', () => resolve(false));
		socket.setTimeout(1000, () => {
			socket.destroy();
			resolve(false);
		});
	});
}

function run(command, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: root,
			env: process.env,
			stdio: 'inherit',
		});

		child.on('error', reject);
		child.on('exit', (code, signal) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(
				new Error(
					`${command} ${args.join(' ')} failed (${signal ?? `exit ${code}`}).`,
				),
			);
		});
	});
}

function connectionStringWithoutPrismaParams(value) {
	const url = new URL(value);
	url.searchParams.delete('schema');
	return url.toString();
}

async function userCount(connectionString) {
	const client = new Client({
		connectionString: connectionStringWithoutPrismaParams(connectionString),
	});
	await client.connect();

	try {
		const result = await client.query('SELECT COUNT(*)::int AS count FROM "User"');
		return result.rows[0].count;
	} finally {
		await client.end();
	}
}

async function main() {
	ensureEnvFile();
	loadEnv({ path: envPath });

	const configuredUrl = process.env.DATABASE_URL?.trim();
	const databaseUrl =
		configuredUrl ??
		`postgresql://postgres:postgres@localhost:${defaultPort}/${defaultDatabase}?schema=public`;

	if (!configuredUrl) {
		process.env.DATABASE_URL = databaseUrl;
	}

	let parsed;
	try {
		parsed = new URL(databaseUrl);
	} catch {
		fail('DATABASE_URL is not a valid PostgreSQL connection URL.');
	}

	const databaseName = parsed.pathname.replace(/^\//, '') || defaultDatabase;
	const databasePort = Number(parsed.port || 5432);
	const isLocalDatabase =
		['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) &&
		databasePort === defaultPort;
	const isExternalDatabase = Boolean(configuredUrl) && !isLocalDatabase;

	if (!process.env.NEXTAUTH_URL) {
		process.env.NEXTAUTH_URL = 'http://localhost:3000';
	}

	if (!isExternalDatabase) {
		mkdirSync(dataDir, { recursive: true });

		if (await isPortOpen(databasePort)) {
			console.log(
				`Using the PostgreSQL instance already running on port ${databasePort}.`,
			);
		} else {
			console.log('Starting embedded PostgreSQL...');
			activePostgres = new EmbeddedPostgres({
				databaseDir: dataDir,
				user: 'postgres',
				password: 'postgres',
				port: databasePort,
				persistent: true,
				onLog: () => {},
				onError: (message) => console.error(`[postgres] ${message}`),
			});

			if (!existsSync(join(dataDir, 'PG_VERSION'))) {
				await activePostgres.initialise();
			}

			await activePostgres.start();
			ownsPostgres = true;

			try {
				await activePostgres.createDatabase(databaseName);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				if (!message.includes('already exists')) throw error;
			}

			console.log(`Embedded PostgreSQL is ready on port ${databasePort}.`);
		}
	} else {
		console.log('Using the external PostgreSQL configured in DATABASE_URL.');
	}

	console.log('Generating Prisma client and applying migrations...');
	await run('npm', ['run', 'db:generate']);
	await run('npm', ['run', 'db:deploy']);

	if (isExternalDatabase) {
		console.log('Skipping demo seed because an external database is configured.');
	} else {
		const count = await userCount(databaseUrl);
		if (count === 0) {
			console.log('Seeding demo data...');
			await run('npm', ['run', 'db:seed']);
		} else {
			console.log('Database already contains users; skipping demo seed.');
		}
	}

	const nextBinary = join(
		root,
		'node_modules',
		'.bin',
		process.platform === 'win32' ? 'next.cmd' : 'next',
	);
	const next = spawn(nextBinary, ['dev'], {
		cwd: root,
		env: process.env,
		stdio: 'inherit',
	});

	let shuttingDown = false;

	async function shutdown(code = 0) {
		if (shuttingDown) return;
		shuttingDown = true;

		if (!next.killed) {
			next.kill('SIGTERM');
		}

		if (ownsPostgres && activePostgres) {
			await activePostgres.stop();
		}

		process.exit(code);
	}

	process.on('SIGINT', () => void shutdown(0));
	process.on('SIGTERM', () => void shutdown(0));

	next.on('error', (error) => {
		console.error(error);
		void shutdown(1);
	});

	next.on('exit', (code) => {
		void shutdown(code ?? 0);
	});
}

main().catch(async (error) => {
	console.error(error instanceof Error ? error.message : error);

	if (ownsPostgres && activePostgres) {
		await activePostgres.stop().catch(() => {});
	}

	process.exit(1);
});
