'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { createUnit, updateUnit, deleteUnit } from '@/actions/units';

export default function UnitList({ initialUnits }: { initialUnits: any[] }) {
    const [units, setUnits] = useState(initialUnits);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            let result;
            if (editingUnit) {
                result = await updateUnit(editingUnit.id, { message: '' }, formData);
            } else {
                result = await createUnit({ message: '' }, formData);
            }

            if (result.success) {
                setIsModalOpen(false);
                setEditingUnit(null);
                window.location.reload();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus satuan ini?')) return;

        try {
            const result = await deleteUnit(id);
            if (result.success) {
                window.location.reload();
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const openEdit = (unit: any) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingUnit(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700">Satuan (Unit)</h3>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-800"
                >
                    <Plus size={16} /> Tambah
                </button>
            </div>

            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Cari satuan..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUnits.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            filteredUnits.map((unit) => (
                                <tr key={unit.id} className="hover:bg-gray-50 group">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{unit.name}</div>
                                        {unit.description && <div className="text-xs text-gray-500">{unit.description}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(unit)}
                                                className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(unit.id)}
                                                className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingUnit ? 'Edit Satuan' : 'Tambah Satuan'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Satuan</label>
                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={editingUnit?.name}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Contoh: Pcs, Box, Kg, Liter</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Opsional)</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    defaultValue={editingUnit?.description}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <div className="pt-2 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
                                >
                                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
