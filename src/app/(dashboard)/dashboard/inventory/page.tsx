import { getInventoryList } from '@/actions/inventory';
import { getProducts } from '@/actions/products';
import { differenceInDays, format, parseISO } from 'date-fns';
import InventoryHeader from '@/components/inventory/inventory-header';
import { AlertTriangle, BadgeCheck, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const params = await searchParams;
    const query = params.q || '';
    const page = Number(params.page) || 1;

    const inventory = await getInventoryList(query, page);
    const { products } = await getProducts('', 1, 1000); // Fetch all products for dropdown (limit 1000 for MVP)

    // Sort: Expiring soonest first
    // Note: Database sort is better, but already sorted by date in action.

    return (
        <div className="space-y-6">
            <InventoryHeader products={products} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">Produk</th>
                                <th className="px-6 py-4">Batch Info</th>
                                <th className="px-6 py-4">Status Expired</th>
                                <th className="px-6 py-4 text-center">Stok</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inventory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        Tidak ada data persediaan sesuai filter.
                                    </td>
                                </tr>
                            ) : (
                                inventory.map((item: any) => {
                                    const daysToExpiry = differenceInDays(new Date(item.expiry_date), new Date());
                                    let statusColor = 'bg-green-100 text-green-700';
                                    let StatusIcon = BadgeCheck;
                                    let statusText = 'Aman';

                                    if (daysToExpiry < 0) {
                                        statusColor = 'bg-red-100 text-red-700';
                                        StatusIcon = AlertTriangle;
                                        statusText = 'Expired';
                                    } else if (daysToExpiry < 90) { // 3 month alert
                                        statusColor = 'bg-yellow-100 text-yellow-700';
                                        StatusIcon = Clock;
                                        statusText = `< ${daysToExpiry} hari`;
                                    } else {
                                        statusText = `${Math.floor(daysToExpiry / 30)} bln`;
                                    }

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{item.product?.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.product?.sku}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{item.batch_number}</div>
                                                <div className="text-xs text-gray-500">Exp: {format(new Date(item.expiry_date), 'dd MMM yyyy')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                                    <StatusIcon size={14} />
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="font-bold text-lg text-gray-800">
                                                    {item.quantity} <span className="text-sm font-normal text-gray-500">{item.product?.unit}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
