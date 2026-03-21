'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get('callbackUrl') ?? '/admin';
	
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await signIn('credentials', {
				email,
				password,
				redirect: false,
			});

			if (res?.error) {
				toast.error('Invalid credentials');
			} else {
				toast.success('Logged in successfully');
				router.push(callbackUrl);
				router.refresh();
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
			<CardHeader className="space-y-1 text-center">
				<CardTitle className="text-3xl font-bold tracking-tight text-white">HMS Portal</CardTitle>
				<CardDescription className="text-slate-400">
					Enter your credentials to access the management system
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email" className="text-sm font-medium text-slate-200">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="admin@hostel.local"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="border-white/5 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/50"
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password" className="text-sm font-medium text-slate-200">Password</Label>
						</div>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="border-white/5 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/50"
						/>
					</div>
					<Button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-600 font-semibold text-white hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50"
					>
						{loading ? 'Authenticating...' : 'Sign In'}
					</Button>
				</form>
				
				<div className="mt-6 border-t border-white/5 pt-4 text-center">
					<p className="text-xs text-slate-500">
						Hostel Management System &copy; {new Date().getFullYear()}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
