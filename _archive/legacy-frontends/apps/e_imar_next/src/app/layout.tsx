import type { Metadata } from 'next';
import { Inter, IBM_Plex_Sans } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'e-İMAR · GIS Workspace',
    template: '%s · e-İMAR',
  },
  description:
    'Türkiye için harita-merkezli imar, parsel ve plan değişimi takip platformu. Tüm değerler backend tarafından döndürülür; istemcide üretilmiş veri yoktur.',
  applicationName: 'e-İMAR',
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${inter.variable} ${plex.variable}`}>
      <body className="min-h-[100dvh] bg-bg-base text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
