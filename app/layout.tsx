import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next'
import {
  Cormorant_Garamond,
  Plus_Jakarta_Sans,
  Geist_Mono,
  Gowun_Batang,
} from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})
// Korean sans (고딕) to pair with Plus Jakarta Sans for Hangul glyphs.
// Jakarta has no Hangul, so Korean body text falls back here. Self-hosted
// variable font (Pretendard) tuned to match Latin weights at small sizes.
const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
})
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
// Korean serif (바탕/명조) to pair with Cormorant Garamond for Hangul glyphs.
// Cormorant has no Hangul, so Korean text in serif headings falls back here.
const gowunBatang = Gowun_Batang({
  variable: '--font-gowun-batang',
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'The Wellness Korea — Live Your Time Fully',
  description:
    'A premium K-Wellness brand reinterpreting Korean meditation, tea, hospitality, and refined space into a contemporary way of living one\u2019s time well. The first stage: Brickwell, Seochon.',
  applicationName: 'The Wellness Korea',
  appleWebApp: {
    title: 'Wellness Korea',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} ${geistMono.variable} ${gowunBatang.variable} ${pretendard.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Toaster />
      </body>
    </html>
  )
}
