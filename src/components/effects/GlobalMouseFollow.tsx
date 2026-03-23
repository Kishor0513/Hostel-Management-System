'use client';

import { useEffect } from 'react';

const TARGET_SELECTOR = [
	'button',
	'a',
	'input',
	'select',
	'textarea',
	'tr',
	'[class*="rounded-"]',
	'[class*="card"]',
	'[class*="panel"]',
	'[class*="tile"]',
	'[class*="kpi"]',
	'[role="button"]',
	'[role="menuitem"]',
	'.glass-hover',
	'.select-field',
	'.page-header',
	'[class*="hover:bg-"]',
	'[class*="hover:text-"]',
	'[class*="hover:shadow-"]',
].join(', ');

function shouldSkip(el: HTMLElement) {
	if (el.closest('[data-no-mouse-follow="true"]')) {
		return true;
	}

	if (el === document.body || el === document.documentElement) {
		return true;
	}

	return false;
}

function markTargets(root: ParentNode) {
	const nodes = root.querySelectorAll<HTMLElement>(TARGET_SELECTOR);

	for (const el of nodes) {
		if (shouldSkip(el)) {
			el.classList.remove('theme-mouse-follow');
			continue;
		}

		el.classList.add('theme-mouse-follow');
	}
}

export default function GlobalMouseFollow() {
	useEffect(() => {
		markTargets(document);

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (!(node instanceof HTMLElement)) {
						continue;
					}

					if (node.matches(TARGET_SELECTOR) && !shouldSkip(node)) {
						node.classList.add('theme-mouse-follow');
					}

					markTargets(node);
				}
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });

		const onPointerMove = (event: PointerEvent) => {
			const target = event.target as HTMLElement | null;
			if (!target) {
				return;
			}

			const followTarget = target.closest<HTMLElement>('.theme-mouse-follow');
			if (!followTarget) {
				return;
			}

			const rect = followTarget.getBoundingClientRect();
			followTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
			followTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
		};

		const onPointerOut = (event: PointerEvent) => {
			const target = event.target as HTMLElement | null;
			if (!target) {
				return;
			}

			const followTarget = target.closest<HTMLElement>('.theme-mouse-follow');
			if (!followTarget) {
				return;
			}

			if (
				event.relatedTarget instanceof Node &&
				followTarget.contains(event.relatedTarget)
			) {
				return;
			}

			followTarget.style.setProperty('--mx', '50%');
			followTarget.style.setProperty('--my', '50%');
		};

		document.addEventListener('pointermove', onPointerMove, { passive: true });
		document.addEventListener('pointerout', onPointerOut, { passive: true });

		return () => {
			observer.disconnect();
			document.removeEventListener('pointermove', onPointerMove);
			document.removeEventListener('pointerout', onPointerOut);
		};
	}, []);

	return null;
}
