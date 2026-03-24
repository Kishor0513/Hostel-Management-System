import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Hostel Management System',
		short_name: 'HMS',
		description: 'Hostel operations with charts, attendance, fees, and requests.',
		start_url: '/',
		display: 'standalone',
		background_color: '#0b1020',
		theme_color: '#4f46e5',
		icons: [
			{
				src: '/icons/icon-192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/icons/icon-512.png',
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: '/icons/maskable-512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
	};
}

