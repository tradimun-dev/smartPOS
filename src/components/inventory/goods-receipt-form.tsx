'use client';

import { submitGoodsReceipt } from '@/actions/inventory';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { PackagePlus } from 'lucide-react';

const initialState = {
    message: '',
    success: false
};

export default function GoodsReceiptForm({
    products,
    onSuccess
}: {
    products: any[],
    onSuccess: () => void
}) {
    const [state, formAction] = useActionState(submitGoodsReceipt, initialState);

    useEffect(() => {
        if (state.success) onSuccess();
    }, [state.success, onSuccess]);

    return (
        <form action={formAction} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Pilih Produk</label>
                <input
                    list="products-list"
                    name="product_input"
                    placeholder="Ketik nama atau SKU..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    onChange={(e) => {
                        // Logic to set hidden product_id based on selection
                        const val = e.target.value;
                        const product = products.find(p => `${p.name} (${p.sku})` === val);
                        const hiddenInput = document.getElementById('selected_product_id') as HTMLInputElement;
                        if (product) {
                            hiddenInput.value = product.id;
                        }
                    }}
                    required
                />
                <datalist id="products-list">
                    {products.map(p => (
                        <option key={p.id} value={`${p.name} (${p.sku})`} />
                    ))}
                </datalist>
                <input type="hidden" name="product_id" id="selected_product_id" required />
                <p className="text-xs text-gray-500 mt-1">Pilih dari list yang muncul saat mengetik.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nomor Batch</label>
                    <input name="batch_number" required placeholder="Contoh: B-2023-001" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Kadaluarsa</label>
                    <input name="expiry_date" type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jumlah Masuk</label>
                    <input name="quantity" type="number" min="1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Catatan (Hanya Internal)</label>
                <textarea name="notes" placeholder="Contoh: Terima dari Supplier ABC, Invoice #123" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>

            <div className="pt-4 flex justify-end">
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
            <PackagePlus size={18} className="mr-2" />
            {pending ? 'Memproses...' : 'Terima Barang'}
        </button>
    );
}
