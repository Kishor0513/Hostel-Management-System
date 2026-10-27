import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

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
	metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
	title: 'Hostel Management System',
	description: 'Hostel operations with charts, attendance, fees, and requests.',
	applicationName: 'Hostel Management System',
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

export const viewport: Viewport = {
	themeColor: '#4f46e5',
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
				<Toaster
					richColors
					position="top-right"
				/>
			</body>
		</html>
	);
}
