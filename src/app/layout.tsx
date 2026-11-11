import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import { appOrigin } from '@/lib/app-url';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Playground Meet', template: '%s · Playground Meet' },
  description:
    'Video meetings for your team, with chat, shared notes, whiteboards, polls and product feedback.',
  icons: { icon: '/brand/icon.png' },
  metadataBase: new URL(appOrigin()),
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
