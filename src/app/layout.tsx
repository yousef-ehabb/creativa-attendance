import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const bricolage = localFont({
  src: '../../public/fonts/BricolageGrotesque.ttf',
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Creativa Hub — Digital Attendance & Credential Studio',
  description: 'Attendance tracking, live QR verification, and certificate eligibility management for Creativa Innovation Hubs (MCIT Egypt)',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#004e9e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full`}>
      <body className="font-sans min-h-full bg-[#fafafa] text-[#222222] antialiased flex flex-col selection:bg-[#004e9e] selection:text-white">
        {children}
      </body>
    </html>
  );
}