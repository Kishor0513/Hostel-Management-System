'use client';

import { Moon, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'hms-theme-mode';

function applyTheme(mode: ThemeMode) {
	document.documentElement.dataset.theme = mode;
	document.documentElement.classList.toggle('dark', mode === 'dark');
}

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>('light');
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
		const systemPrefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)',
		).matches;
		const initial: ThemeMode = saved ?? (systemPrefersDark ? 'dark' : 'light');
		setMode(initial);
		applyTheme(initial);
		setReady(true);
	}, []);

	function toggleMode() {
		const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
		setMode(nextMode);
		applyTheme(nextMode);
		window.localStorage.setItem(STORAGE_KEY, nextMode);
	}

	const Icon = mode === 'dark' ? SunMedium : Moon;

	return (
		<Button
			type="button"
			variant="secondary"
			size="icon"
			onClick={toggleMode}
			className="h-9 w-9 rounded-full border-white/12 bg-white/10 text-slate-100 hover:bg-white/15"
			aria-label={
				ready
					? `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`
					: 'Toggle theme'
			}
			title={
				ready
					? `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`
					: 'Toggle theme'
			}
		>
			<Icon className="h-4 w-4" />
		</Button>
	);
}
