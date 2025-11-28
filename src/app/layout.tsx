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
