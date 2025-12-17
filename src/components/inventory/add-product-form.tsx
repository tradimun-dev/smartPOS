'use client';

import { createProduct, ProductFormState, getCategories } from '@/actions/products';
// @ts-ignore
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

const initialState: ProductFormState = {
    message: '',
    success: false
};

export default function AddProductForm({
    categories,
    onSuccess
}: {
    categories: any[],
    onSuccess: () => void
}) {
    const [state, formAction] = useFormState(createProduct, initialState);

    // Close modal on success
    useEffect(() => {
        if (state.success) {
            onSuccess();
            // Reset form manually if needed
        }
    }, [state.success, onSuccess]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Kode SKU</label>
                    <input name="sku" required placeholder="HBL-001" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Barcode/GTIN</label>
                    <input name="barcode" placeholder="Scan..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
                <input name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Kategori</label>
                    <select name="category_id" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                        <option value="">Pilih Kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Satuan</label>
                    <select name="unit" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                        <option value="pcs">Pcs</option>
                        <option value="botol">Botol</option>
                        <option value="box">Box</option>
                        <option value="sachet">Sachet</option>
                        <option value="pack">Pack</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500">Harga Retail</label>
                    <input name="price_retail" type="number" required defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500">Harga Apotek</label>
                    <input name="price_apotek" type="number" required defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500">Harga Distributor</label>
                    <input name="price_distributor" type="number" required defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500">Minimum Stok Alert</label>
                <input name="min_stock" type="number" defaultValue={5} className="mt-1 w-24 rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="pt-4 flex justify-end gap-2">
                <SubmitButton />
            </div>

            {state.message && (
                <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
                    {state.message}
                </p>
            )}
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50"
        >
            <Save size={18} className="mr-2" />
            {pending ? 'Menyimpan...' : 'Simpan Produk'}
        </button>
    );
}
