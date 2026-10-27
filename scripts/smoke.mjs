const baseUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

class CookieJar {
	cookies = new Map();

	add(response) {
		const setCookies =
			typeof response.headers.getSetCookie === 'function'
				? response.headers.getSetCookie()
				: [];

		for (const raw of setCookies) {
			const [pair] = raw.split(';');
			const separator = pair.indexOf('=');
			if (separator === -1) continue;

			const name = pair.slice(0, separator).trim();
			const value = pair.slice(separator + 1).trim();

			if (!value || /max-age=0/i.test(raw)) {
				this.cookies.delete(name);
			} else {
				this.cookies.set(name, value);
			}
		}
	}

	header() {
		return [...this.cookies.entries()]
			.map(([name, value]) => `${name}=${value}`)
			.join('; ');
	}

	get size() {
		return this.cookies.size;
	}
}

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

async function checkPage(request, path, label) {
	const response = await request(path);
	await response.body?.cancel();

	assert(
		response.status === 200,
		`${label} (${path}) returned HTTP ${response.status}`,
	);
}

async function checkRedirect(request, path, expectedLocation, label) {
	const response = await request(path);
	await response.body?.cancel();
	const location = response.headers.get('location') ?? '';

	assert(
		[302, 303, 307, 308].includes(response.status),
		`${label} (${path}) returned HTTP ${response.status} instead of a redirect`,
	);
	assert(
		location.includes(expectedLocation),
		`${label} (${path}) redirected to "${location}" instead of ${expectedLocation}`,
	);
}

async function main() {
	console.log(`Smoke testing ${baseUrl}`);

	const health = await fetch(`${baseUrl}/api/health`);
	assert(health.ok, `Health check returned HTTP ${health.status}`);

	const healthBody = await health.json();
	assert(healthBody.status === 'ok', 'Health check status is not ok');
	assert(healthBody.database === 'up', 'Health check reports the database is down');
	console.log('✓ health endpoint and database connectivity');

	const anonymous = await fetch(`${baseUrl}/admin`, { redirect: 'manual' });
	assert(
		[302, 303, 307, 308].includes(anonymous.status),
		`Unauthenticated /admin returned HTTP ${anonymous.status}`,
	);
	assert(
		(anonymous.headers.get('location') ?? '').includes('/login'),
		'Unauthenticated /admin did not redirect to /login',
	);
	console.log('✓ unauthenticated admin access is blocked');

	async function attemptLogin(email, password) {
		const jar = new CookieJar();

		const request = async (path, init = {}) => {
			const headers = new Headers(init.headers);
			if (jar.size > 0) headers.set('cookie', jar.header());

			const response = await fetch(`${baseUrl}${path}`, {
				...init,
				headers,
				redirect: 'manual',
			});
			jar.add(response);
			return response;
		};

		const csrfResponse = await request('/api/auth/csrf');
		assert(csrfResponse.ok, `CSRF endpoint returned HTTP ${csrfResponse.status}`);
		const { csrfToken } = await csrfResponse.json();
		assert(csrfToken, 'CSRF token was not returned');

		const body = new URLSearchParams({
			csrfToken,
			email,
			password,
			callbackUrl: `${baseUrl}/`,
			json: 'true',
		});

		const callback = await request('/api/auth/callback/credentials', {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: body.toString(),
		});
		const result = await callback.json().catch(() => ({}));
		const hasSession = [...jar.cookies.keys()].some((name) =>
			name.includes('session-token'),
		);

		return { jar, request, result, hasSession, status: callback.status };
	}

	async function login(email, password) {
		const attempt = await attemptLogin(email, password);
		assert(
			attempt.status === 200 &&
				attempt.hasSession &&
				typeof attempt.result.url === 'string' &&
				!attempt.result.url.includes('error='),
			`Login failed for ${email}: HTTP ${attempt.status}, ${attempt.result.url ?? 'no redirect URL'}`,
		);
		return attempt;
	}

	const admin = await login('admin@hostel.local', 'admin123');

	for (const path of [
		'/admin',
		'/admin/students',
		'/admin/staff',
		'/admin/rooms',
		'/admin/allocations',
		'/admin/payments',
		'/admin/attendance',
		'/admin/maintenance',
		'/admin/complaints',
		'/admin/announcements',
		'/admin/manage-accounts',
		'/admin/settings',
	]) {
		await checkPage(admin.request, path, 'Admin page');
	}
	await checkRedirect(admin.request, '/login', '/admin', 'Authenticated login page');
	await checkPage(admin.request, '/announcements', 'Shared announcements page');
	console.log('✓ admin login and all admin routes');

	const staff = await login('warden@hostel.local', 'staff123');
	for (const path of [
		'/admin',
		'/admin/students',
		'/admin/rooms',
		'/admin/allocations',
		'/admin/payments',
		'/admin/attendance',
		'/admin/maintenance',
		'/admin/complaints',
	]) {
		await checkPage(staff.request, path, 'Staff page');
	}
	await checkRedirect(staff.request, '/admin/staff', '/forbidden', 'Staff staff-management');
	await checkRedirect(staff.request, '/admin/announcements', '/forbidden', 'Staff announcements admin');
	await checkRedirect(staff.request, '/admin/settings', '/forbidden', 'Staff settings');
	await checkRedirect(staff.request, '/student', '/admin', 'Staff student portal');
	console.log('✓ staff access and admin-only route isolation');

	const student = await login('suman@student.local', 'student123');
	for (const path of [
		'/student',
		'/student/room',
		'/student/payments',
		'/student/attendance',
		'/student/requests',
		'/student/announcements',
		'/student/profile',
		'/announcements',
	]) {
		await checkPage(student.request, path, 'Student page');
	}
	await checkRedirect(student.request, '/admin', '/forbidden', 'Student admin access');
	await checkRedirect(student.request, '/login', '/student', 'Authenticated student login page');
	console.log('✓ student portal and role isolation');

	const inactive = await attemptLogin('inactive@student.local', 'student123');
	assert(
		!inactive.hasSession,
		'A deactivated account received a session cookie',
	);
	assert(
		inactive.status === 401 || String(inactive.result.url ?? '').includes('error='),
		'A deactivated account did not receive a login error',
	);
	console.log('✓ deactivated accounts cannot sign in');

	console.log('Smoke test passed');
}

main().catch((error) => {
	console.error(`Smoke test failed: ${error.message}`);
	process.exit(1);
});
