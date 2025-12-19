'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    FileBarChart,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Settings
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS Kasir', href: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Produk', href: '/dashboard/products', icon: Package },
    { name: 'Pelanggan', href: '/dashboard/customers', icon: Users },
    { name: 'Inventori', href: '/dashboard/inventory', icon: Package },
    { name: 'Laporan', href: '/dashboard/reports', icon: FileBarChart },
    { name: 'Konfigurasi', href: '/dashboard/configuration', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={`flex flex-col border-r bg-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
                } h-screen sticky top-0`}
        >
            <div className="flex items-center justify-between h-16 px-4 border-b">
                {!collapsed && (
                    <span className="text-xl font-bold text-green-700">TRADIMUN</span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded-full hover:bg-gray-100"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-4 py-3 transition-colors ${isActive
                                ? 'bg-green-50 text-green-700 border-r-4 border-green-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            title={collapsed ? item.name : ''}
                        >
                            <item.icon size={20} className={collapsed ? 'mx-auto' : 'mr-3'} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t">
                <button
                    onClick={() => signOut()}
                    className={`flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''
                        }`}
                    title="Keluar"
                >
                    <LogOut size={20} className={collapsed ? '' : 'mr-3'} />
                    {!collapsed && <span>Keluar</span>}
                </button>
            </div>
        </div>
    );
}
