import { getSalesReport } from '@/actions/reports';
import ReportFilter from '@/components/dashboard/report-filter';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ start?: string; end?: string; page?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const startDate = params.start;
    const endDate = params.end;

    const { data: transactions, count } = await getSalesReport(startDate, endDate, page);

    const formatRupiah = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
                <p className="text-gray-500 text-sm">Rekapitulasi transaksi harian dan detail order.</p>
            </div>

            <ReportFilter />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">ID Transaksi</th>
                                <th className="px-6 py-4">Waktu</th>
                                <th className="px-6 py-4">Pelanggan</th>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        Tidak ada transaksi pada periode ini.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((trx: any) => (
                                    <tr key={trx.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            {trx.id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            {format(new Date(trx.created_at), 'dd MMM yyyy, HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {trx.customer?.name || 'Umum'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {trx.user?.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 capitalize">
                                                {trx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {formatRupiah(trx.total_amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
                <div>
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, count)} of {count}
                </div>
                <div className="flex gap-2">
                    {page > 1 && (
                        <a href={`?page=${page - 1}&start=${startDate || ''}&end=${endDate || ''}`} className="px-3 py-1 border rounded hover:bg-gray-50">Previous</a>
                    )}
                    {(page * 10) < count && (
                        <a href={`?page=${page + 1}&start=${startDate || ''}&end=${endDate || ''}`} className="px-3 py-1 border rounded hover:bg-gray-50">Next</a>
                    )}
                </div>
            </div>
        </div>
    );
}
