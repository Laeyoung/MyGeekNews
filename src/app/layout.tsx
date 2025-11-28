import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Import Inter instead of Geist
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

// Configure Inter font
const inter = Inter({
  subsets: ['latin'], // Keep latin subset
  variable: '--font-sans', // Assign to a CSS variable
});


export const metadata: Metadata = {
  title: 'My GeekNews Upvotes',
  description: 'Search your upvoted GeekNews articles.',
  openGraph: {
    title: 'My GeekNews Upvotes',
    description: 'Search your upvoted GeekNews articles.',
    url: 'https://my-geeknews-upvotes.vercel.app', // Assuming a URL or placeholder
    siteName: 'My GeekNews Upvotes',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'My GeekNews Upvotes',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My GeekNews Upvotes',
    description: 'Search your upvoted GeekNews articles.',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico', // Ideally this should be a png, but using ico for now as placeholder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Use the Inter font variable */}
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}
