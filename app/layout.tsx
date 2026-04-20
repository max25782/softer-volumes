import type { Metadata, Viewport } from 'next'
import { cormorant, josefin, notoKr } from '@/lib/fonts'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'BRAND NAME — City Guides for Discerning Travellers',
    template: '%s — BRAND NAME',
  },
  description:
    'Personal city guides curated by someone who actually lives there. Seoul, Tokyo, Bangkok, Bali — handpicked places for people who know the difference.',
  keywords: ['city guide', 'luxury travel', 'seoul guide', 'tokyo guide', 'asia travel'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yourdomain.com',
    siteName: 'BRAND NAME',
    title: 'BRAND NAME — City Guides for Discerning Travellers',
    description: 'Personal city guides curated by someone who actually lives there.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BRAND NAME',
    description: 'Personal city guides curated by someone who actually lives there.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4efe5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${josefin.variable} ${notoKr.variable}`}
    >
      <body className="bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
