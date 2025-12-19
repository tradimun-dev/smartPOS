'use client';

import { updateProduct, ProductFormState } from '@/actions/products';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Save } from 'lucide-react';

const initialState: ProductFormState = {
    message: '',
    success: false
};

export default function EditProductForm({
    product,
    categories,
    units,
    onSuccess
}: {
    product: any,
    categories: any[],
    units: any[],
    onSuccess: () => void
}) {
    // Bind the ID to the server action
    const updateProductWithId = updateProduct.bind(null, product.id);
    const [state, formAction] = useActionState(updateProductWithId, initialState);

    // Close modal on success
    useEffect(() => {
        if (state.success) {
            onSuccess();
        }
    }, [state.success, onSuccess]);

    // Helper to get price
    const getPrice = (type: string) => {
        return product.prices?.find((p: any) => p.customer_type === type)?.price || 0;
    };

    return (
        <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Kode SKU</label>
                    <input name="sku" required defaultValue={product.sku} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Barcode/GTIN</label>
                    <input name="barcode" defaultValue={product.barcode || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
                <input name="name" required defaultValue={product.name} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Kategori</label>
                    <select name="category_id" required defaultValue={product.category_id} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                        <option value="">Pilih Kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Satuan</label>
                    <select name="unit" required defaultValue={product.unit} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                        <option value="">Pilih Satuan</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500">Harga Retail</label>
                    <input name="price_retail" type="number" required defaultValue={getPrice('retail')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500">Harga Apotek</label>
                    <input name="price_apotek" type="number" required defaultValue={getPrice('apotek')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500">Harga Distributor</label>
                    <input name="price_distributor" type="number" required defaultValue={getPrice('distributor')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500">Minimum Stok Alert</label>
                <input name="min_stock" type="number" defaultValue={product.min_stock} className="mt-1 w-24 rounded-md border-gray-300 shadow-sm p-2 border" />
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
            className="flex items-center bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
        >
            <Save size={18} className="mr-2" />
            {pending ? 'Menyimpan...' : 'Update Produk'}
        </button>
    );
}
