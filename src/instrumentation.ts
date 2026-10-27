export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		try {
			const { getEnv } = await import('@/lib/env');
			getEnv();
		} catch (error) {
			console.error('[startup] Invalid environment configuration', error);
			process.exit(1);
		}
	}
}
