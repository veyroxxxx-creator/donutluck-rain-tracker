import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/context/SettingsContext';
import { PushProvider } from '@/context/PushContext';
import { RainProvider } from '@/context/RainContext';
import { Nav } from '@/components/Nav';
import { SITE_DESCRIPTION, SITE_DOMAIN, SITE_NAME } from '@/lib/constants';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl = `https://${SITE_DOMAIN}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [{ url: '/icons/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/icons/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F1E7' },
    { media: '(prefers-color-scheme: dark)', color: '#09070E' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="cream" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body antialiased`}>
        <SettingsProvider>
          <PushProvider>
            <RainProvider>
              <div className="flex min-h-screen flex-col">
                <Nav />
                <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
                  {children}
                </main>
                <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted sm:px-6">
                  DonutLuck Rain Tracker is an independent dashboard and is not affiliated with DonutLuck.
                </footer>
              </div>
            </RainProvider>
          </PushProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
