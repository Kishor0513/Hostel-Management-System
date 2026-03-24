import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import GlobalMouseFollow from '@/components/effects/GlobalMouseFollow';

import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Hostel Management System',
	description: 'Hostel operations with charts, attendance, fees, and requests.',
	applicationName: 'Hostel Management System',
	themeColor: '#4f46e5',
	icons: {
		icon: [
			{ url: '/favicon.ico' },
			{ url: '/icon.png', type: 'image/png' },
		],
		apple: [{ url: '/apple-icon.png', type: 'image/png' }],
	},
	openGraph: {
		title: 'Hostel Management System',
		description: 'Hostel operations with charts, attendance, fees, and requests.',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Hostel Management System',
		description: 'Hostel operations with charts, attendance, fees, and requests.',
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			data-theme="light"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-(--background)">
				<GlobalMouseFollow />
				{children}
			</body>
		</html>
	);
}
