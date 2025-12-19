'use client';

import { createCustomer } from '@/actions/customers';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Save } from 'lucide-react';

const initialState = {
    message: '',
    success: false
};

export default function AddCustomerForm({ onSuccess }: { onSuccess: () => void }) {
    const [state, formAction] = useActionState(createCustomer, initialState);

    useEffect(() => {
        if (state.success) onSuccess();
    }, [state.success, onSuccess]);

    return (
        <form action={formAction} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Pelanggan</label>
                <input name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">No. HP / WhatsApp</label>
                    <input name="phone" placeholder="08..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipe Pelanggan</label>
                    <select name="type" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                        <option value="retail">Retail (Umum)</option>
                        <option value="apotek">Apotek / Klinik</option>
                        <option value="distributor">Distributor / Agen</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
                <textarea name="address" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
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
            <Save size={18} className="mr-2" />
            {pending ? 'Menyimpan...' : 'Simpan Pelanggan'}
        </button>
    );
}
