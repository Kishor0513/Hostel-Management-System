// Loads `.env` for local Prisma commands; production deployments inject env vars.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
		seed: 'tsx prisma/seed.ts',
	},
	datasource: {
		url: process.env['DATABASE_URL'],
	},
});
