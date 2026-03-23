'use client';

import { Moon, SunMedium } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'hms-theme-mode';
type ThemeMode = 'light' | 'dark-violet';

function runThemeTransitionAnimation() {
	document.documentElement.classList.remove('theme-reveal-top-right');
	void document.documentElement.offsetWidth;
	document.documentElement.classList.add('theme-reveal-top-right');
	window.setTimeout(() => {
		document.documentElement.classList.remove('theme-reveal-top-right');
	}, 560);
}

function applyTheme(mode: ThemeMode) {
	runThemeTransitionAnimation();
	document.documentElement.dataset.theme = mode;
	document.documentElement.classList.toggle('dark', mode === 'dark-violet');
}

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>(() => {
		if (typeof window === 'undefined') {
			return 'dark-violet';
		}

		const saved = window.localStorage.getItem(STORAGE_KEY);
		return saved === 'light' ? 'light' : 'dark-violet';
	});

	useEffect(() => {
		applyTheme(mode);
		window.localStorage.setItem(STORAGE_KEY, mode);
	}, [mode]);

	function toggleMode() {
		setMode((prev) => (prev === 'dark-violet' ? 'light' : 'dark-violet'));
	}

	return (
		<Button
			type="button"
			variant="secondary"
			onClick={toggleMode}
			onPointerMove={(e) => {
				const header = e.currentTarget.closest('header') as HTMLElement;
				const rect = e.currentTarget.getBoundingClientRect();
				e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
				e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
				if (header) {
					const hRect = header.getBoundingClientRect();
					header.style.setProperty('--mx', `${e.clientX - hRect.left}px`);
					header.style.setProperty('--my', `${e.clientY - hRect.top}px`);
				}
			}}
			onPointerLeave={(e) => {
				e.currentTarget.style.setProperty('--mx', '50%');
				e.currentTarget.style.setProperty('--my', '50%');
			}}
			className="h-9 rounded-full border-slate-300/55 bg-white/80 px-3 text-slate-700 hover:bg-white dark:border-slate-400/30 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700 transition-all duration-300 nav-spotlight"
			aria-label={`Current theme ${mode === 'dark-violet' ? 'Violet Dark' : 'White'}. Click to switch.`}
			title={`Current theme ${mode === 'dark-violet' ? 'Violet Dark' : 'White'}`}
		>
			{mode === 'dark-violet' ? (
				<SunMedium className="h-4 w-4" />
			) : (
				<Moon className="h-4 w-4" />
			)}
			<span className="text-xs font-semibold tracking-[0.01em]">
				{mode === 'dark-violet' ? 'Violet Dark' : 'White'}
			</span>
		</Button>
	);
}
