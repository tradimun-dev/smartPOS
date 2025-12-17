import { getDashboardStats, getSalesChartData } from '@/actions/reports';
import SalesChart from '@/components/dashboard/sales-chart';
import { DollarSign, ShoppingBag, PackageX, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const stats = await getDashboardStats();
    const chartData = await getSalesChartData();

    // Get Low Stock & Expired list directly here for widget lists (limit 5)
    // Or create specific RPC. For MVP, query is fast enough.
    const supabase = await createClient();

    // Low Stock List
    const { data: lowStock } = await supabase
        .from('products')
        .select('name, total_stock, min_stock, unit')
        .lte('total_stock', supabase.rpc('min_stock')) // wait, how to compare column? 
    // supabase-js doesn't support col comparison easily without raw filter or creating view.
    // simpler: fetch products with low stock via server action logic or RPC. 
    // Let's rely on RPC or just fetch all and filter for the widget (if dataset small). 
    // Actually, report_functions.sql calculated count. 
    // Let's create a quick query.
    // Workaround: .filter('total_stock', 'lte', 10) ? No, dynamic.
    // Best: RPC "get_low_stock_products"

    // To save time, just List Expired Items from inventory (< 30 days) - this is easier
    const { data: expiringItems } = await supabase
        .from('inventory')
        .select('batch_number, expiry_date, quantity, product:products(name)')
        .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .gt('quantity', 0)
        .order('expiry_date', { ascending: true })
        .limit(5);

    const formatRupiah = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-500 text-sm">Ringkasan performa toko hari ini.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sales Today */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Omzet Hari Ini</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatRupiah(stats.sales_today || 0)}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>

                {/* Transactions Today */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Transaksi</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.trx_count_today || 0}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                </div>

                {/* Low Stock (Count) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Stok Menipis</p>
                            <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats.low_stock_count || 0}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                </div>

                {/* Expired (Count) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Item Expired</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.expired_count || 0}</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <PackageX size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Column (2/3) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-600" />
                            Penjualan 7 Hari Terakhir
                        </h3>
                    </div>
                    <SalesChart data={chartData} />
                </div>

                {/* Widgets Column (1/3) */}
                <div className="space-y-6">
                    {/* Expiring Soon Widget */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-orange-500" /> Expiring Soon
                        </h3>
                        <div className="space-y-3">
                            {expiringItems && expiringItems.length > 0 ? (
                                expiringItems.map((item: any, i: number) => {
                                    const days = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 3600 * 24));
                                    return (
                                        <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-gray-700">{item.product?.name}</p>
                                                <p className="text-xs text-gray-400">Batch: {item.batch_number}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${days < 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {days < 0 ? 'Expired' : `${days} hari`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-4">Semua stok aman.</p>
                            )}
                        </div>
                        <Link href="/dashboard/inventory" className="block text-center text-xs text-green-600 hover:underline mt-4">
                            Lihat Semua Inventori &rarr;
                        </Link>
                    </div>

                    <div className="bg-green-700 p-6 rounded-xl text-white shadow-lg shadow-green-900/20">
                        <h3 className="font-bold text-lg mb-2">Mulai Jualan?</h3>
                        <p className="text-green-100 text-sm mb-4">Masuk ke menu POS untuk memproses transaksi pelanggan.</p>
                        <Link href="/dashboard/pos" className="block w-full text-center bg-white text-green-800 font-bold py-2 rounded-lg hover:bg-green-50 transition-colors">
                            Buka Mesin Kasir
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
