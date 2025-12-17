'use client';

import { useAuth } from '@/components/auth-provider';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { session, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/');
        }
    }, [loading, session, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-green-50">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent mx-auto"></div>
                    <p className="mt-2 text-green-800 font-medium">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
