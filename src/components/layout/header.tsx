'use client';

import { useAuth } from '@/components/auth-provider';

export default function Header() {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                        {user?.email}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                        {/* Role would come from public.users table ideally */}
                        Admin / Owner
                    </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200">
                    {user?.email?.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
