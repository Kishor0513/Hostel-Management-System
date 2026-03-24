import { Suspense } from 'react';
import Image from 'next/image';

import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#020617] relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />

			<div className="z-10 w-full px-4">
				<div className="mx-auto flex flex-col items-center space-y-6">
					<Image
						src="/brand/mark.svg"
						alt="Hostel Management System"
						width={48}
						height={48}
						priority
						className="h-12 w-12 drop-shadow-[0_10px_24px_rgba(37,99,235,0.25)]"
					/>
					<Suspense
						fallback={
							<div className="h-[420px] w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/40" />
						}
					>
						<LoginForm />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
