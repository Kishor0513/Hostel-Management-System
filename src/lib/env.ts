import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
	NEXTAUTH_SECRET: z
		.string()
		.min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
	NEXTAUTH_URL: z.string().url().optional(),
}).superRefine((env, context) => {
	if (env.NODE_ENV === 'production' && !env.NEXTAUTH_URL) {
		context.addIssue({
			code: 'custom',
			path: ['NEXTAUTH_URL'],
			message: 'NEXTAUTH_URL is required in production',
		});
	}
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
	if (cachedEnv) {
		return cachedEnv;
	}

	const parsed = envSchema.safeParse(process.env);

	if (!parsed.success) {
		const details = parsed.error.issues
			.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
			.join('; ');
		throw new Error(`Invalid environment configuration: ${details}`);
	}

	cachedEnv = parsed.data;
	return cachedEnv;
}
