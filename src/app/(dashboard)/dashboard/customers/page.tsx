import { getCustomers } from '@/actions/customers';
import CustomerHeader from '@/components/customers/customer-header';
import { Edit, Phone, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const params = await searchParams;
    const query = params.q || '';
    const page = Number(params.page) || 1;

    const { customers, count } = await getCustomers(query, page);

    return (
        <div className="space-y-6">
            <CustomerHeader />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
                        Belum ada data pelanggan.
                    </div>
                ) : (
                    customers.map((c: any) => (
                        <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{c.name}</h3>
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 capitalize
                    ${c.type === 'distributor' ? 'bg-purple-100 text-purple-700' :
                                            c.type === 'apotek' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {c.type}
                                    </span>
                                </div>
                                <button className="text-gray-400 hover:text-green-600">
                                    <Edit size={16} />
                                </button>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{c.phone || '-'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="text-gray-400 mt-0.5" />
                                    <span className="line-clamp-2">{c.address || '-'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination (Simple) */}
            <div className="flex justify-between items-center text-sm text-gray-500 pt-4">
                <div>Total: {count} Pelanggan</div>
                <div className="flex gap-2">
                    {page > 1 && (
                        <a href={`?page=${page - 1}&q=${query}`} className="px-3 py-1 border rounded hover:bg-gray-50">Back</a>
                    )}
                    {(page * 10) < count && (
                        <a href={`?page=${page + 1}&q=${query}`} className="px-3 py-1 border rounded hover:bg-gray-50">Next</a>
                    )}
                </div>
            </div>
        </div>
    );
}
