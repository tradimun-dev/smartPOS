'use client';

import { useState } from 'react';
import { Plus, Search, X, Upload } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddProductForm from './add-product-form';
import ImportProductModal from './import-product-modal';
import ProductActions from './product-actions';

export default function ProductHeader({ categories, units, products = [] }: { categories: any[], units: any[], products?: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        params.delete('page'); // Reset pagination
        router.replace(`?${params.toString()}`);
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Master Produk</h1>
                    <p className="text-gray-500 text-sm">Kelola data SKU, harga, dan stok awal</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-start sm:items-center">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama, SKU..."
                            defaultValue={searchParams.get('q')?.toString()}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div className="flex gap-2">
                        <ProductActions products={products} />

                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                            title="Import Excel"
                        >
                            <Upload size={18} />
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Tambah</span>
                        </button>
                    </div>
                </div>
            </div>

            <ImportProductModal
                isOpen={isImportModalOpen}
                onClose={() => {
                    setIsImportModalOpen(false);
                    router.refresh();
                }}
            />

            {/* Basic Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                            <h2 className="text-lg font-bold text-gray-800">Tambah Produk Baru</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <AddProductForm
                                categories={categories}
                                units={units}
                                onSuccess={() => setIsModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
