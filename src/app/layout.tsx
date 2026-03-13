import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Import Inter instead of Geist
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

// Configure Inter font
const inter = Inter({
  subsets: ['latin'], // Keep latin subset
  variable: '--font-sans', // Assign to a CSS variable
});


const SITE_URL = 'https://my-geeknews-upvotes.vercel.app';
const SITE_NAME = 'My GeekNews Upvotes';
const SITE_DESCRIPTION = 'GeekNews에서 추천한 글을 빠르게 검색하세요. 한국어 초성 검색을 지원합니다.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['GeekNews', '긱뉴스', '추천', '검색', '기술 뉴스', 'upvotes', '초성 검색'],
  authors: [{ name: 'Laeyoung' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: '/opengraph-image.png', alt: SITE_NAME }],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              inLanguage: 'ko',
            }),
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
