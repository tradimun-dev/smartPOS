import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tradimun Smart POS',
  description: 'Sistem POS & Inventori Modern untuk Tradimun',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-gray-50 text-gray-900">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
