import { getProducts, getCategories } from '@/actions/products';
import ProductHeader from '@/components/inventory/product-header';
import { Edit, Trash2, Package } from 'lucide-react';

// Force dynamic because we use DB
export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const params = await searchParams;
    const query = params.q || '';
    const page = Number(params.page) || 1;

    const { products, count } = await getProducts(query, page);
    const categories = await getCategories();

    return (
        <div className="space-y-6">
            <ProductHeader categories={categories} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">Produk</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4 text-center">Stok</th>
                                <th className="px-6 py-4 text-right">Harga Retail</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        Tidak ada produk ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product: any) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {product.category?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`font-bold ${product.total_stock <= product.min_stock ? 'text-red-600' : 'text-gray-700'}`}>
                                                {product.total_stock} {product.unit}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                                                product.prices?.find((p: any) => p.customer_type === 'retail')?.price || 0
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded">
                                                    <Edit size={16} />
                                                </button>
                                                {/* Delete action would go here */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple Pagination */}
            <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, count)} of {count} entries
                </div>
                <div className="flex gap-2">
                    {page > 1 && (
                        <a href={`?page=${page - 1}&q=${query}`} className="px-3 py-1 border rounded hover:bg-gray-50">Previous</a>
                    )}
                    {(page * 10) < count && (
                        <a href={`?page=${page + 1}&q=${query}`} className="px-3 py-1 border rounded hover:bg-gray-50">Next</a>
                    )}
                </div>
            </div>
        </div>
    );
}
