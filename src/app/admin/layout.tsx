import type { Metadata } from 'next';
import { AdminNavbar } from '@/components/admin/AdminNavbar';

export const metadata: Metadata = {
  title: 'Creativa Hub — Coordinator Console',
  description: 'Manage attendance, schedule room sessions, and verify certificate eligibility for Creativa Innovation Hubs',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col selection:bg-[#004e9e] selection:text-white">
      <AdminNavbar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}