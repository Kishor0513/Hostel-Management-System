import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#020617] relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
			
			<div className="z-10 w-full px-4">
				<div className="mx-auto flex flex-col items-center space-y-6">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
						<span className="text-xl font-bold text-white">H</span>
					</div>
					<LoginForm />
				</div>
			</div>
		</div>
	);
}
