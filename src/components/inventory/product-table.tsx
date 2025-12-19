'use client';

import { useState } from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import { deleteProduct } from '@/actions/products';
import EditProductForm from './edit-product-form';
import { useRouter } from 'next/navigation';

export default function ProductTable({
    products,
    categories,
    units,
    page,
    count
}: {
    products: any[],
    categories: any[],
    units: any[],
    page: number,
    count: number
}) {
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus produk ini?')) return;

        setIsDeleting(true);
        try {
            await deleteProduct(id);
            // router.refresh() handled by server action revalidatePath, 
            // but safe to do purely client side check or toast.
        } catch (error) {
            alert('Gagal menghapus produk');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
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
                                                <button
                                                    onClick={() => setEditingProduct(product)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    disabled={isDeleting}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls could be passed here or kept in parent, 
                but keeping here is fine if passed as props or just keep in parent?
                The original page had them outside the table div. I will omit here and handle in parent 
                OR include them here. Let's include them here for cleaner page.tsx 
            */}
            <div className="flex justify-between items-center text-sm text-gray-500 py-4">
                <div>
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, count)} of {count} entries
                </div>
                <div className="flex gap-2">
                    {page > 1 && (
                        <button onClick={() => router.replace(`?page=${page - 1}`)} className="px-3 py-1 border rounded hover:bg-gray-50">Previous</button>
                    )}
                    {(page * 10) < count && (
                        <button onClick={() => router.replace(`?page=${page + 1}`)} className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-gray-800">Edit Produk</h2>
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <EditProductForm
                                product={editingProduct}
                                categories={categories}
                                units={units}
                                onSuccess={() => {
                                    setEditingProduct(null);
                                    // router.refresh(); // Usually handled by server action revalidate
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
