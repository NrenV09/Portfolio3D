import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aetheris // 3D WebGL Portfolio Studio',
  description:
    'Futuristic interactive 3D WebGL portfolio builder and showcase with custom GLSL shaders, virtual exhibition gallery, and live personal details configurator.',
  openGraph: {
    title: 'Aetheris // 3D WebGL Portfolio Studio',
    description:
      'Futuristic interactive 3D WebGL portfolio builder and showcase with custom GLSL shaders, virtual exhibition gallery, and live personal details configurator.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aetheris // 3D WebGL Portfolio Studio',
    description:
      'Futuristic interactive 3D WebGL portfolio builder and showcase with custom GLSL shaders, virtual exhibition gallery, and live personal details configurator.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-[#050507] text-[#F4F4F6] antialiased selection:bg-emerald-400 selection:text-black overflow-x-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
