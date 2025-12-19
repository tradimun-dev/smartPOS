'use client';

import { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, FileUp, Loader2 } from 'lucide-react';
import { importProducts, ImportResult } from '@/actions/product-import';

export default function ImportProductModal({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await importProducts(formData);
            setResult(res);
            if (res.success && !res.stats?.errors?.length) {
                // If perfect success, close after delay? Or let user see stats?
                // Let user see stats.
            }
        } catch (error) {
            setResult({ success: false, message: 'Terjadi kesalahan jaringan.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Upload size={20} className="text-green-700" />
                        Import Produk (Excel)
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {!result ? (
                        <>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <div className="bg-green-100 p-3 rounded-full text-green-700">
                                        <FileUp size={32} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {file ? file.name : 'Klik untuk upload file Excel (.xlsx)'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Pastikan format sesuai template.
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || isLoading}
                                    className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        'Upload & Process'
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                {result.success ? <CheckCircle className="mt-0.5" size={20} /> : <AlertCircle className="mt-0.5" size={20} />}
                                <div>
                                    <h3 className="font-bold">{result.success ? 'Import Selesai' : 'Gagal Import'}</h3>
                                    <p className="text-sm">{result.message}</p>
                                </div>
                            </div>

                            {result.stats && (
                                <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-2 rounded border">
                                            <span className="text-gray-500 block text-xs">Total Baris</span>
                                            <span className="font-bold text-lg">{result.stats.total}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <span className="text-green-600 block text-xs">Berhasil</span>
                                            <span className="font-bold text-lg text-green-700">{result.stats.success}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <span className="text-gray-500 block text-xs">Dilewati (Duplikat)</span>
                                            <span className="font-bold text-lg text-gray-700">{result.stats.skipped}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded border">
                                            <span className="text-red-600 block text-xs">Gagal</span>
                                            <span className="font-bold text-lg text-red-700">{result.stats.failed}</span>
                                        </div>
                                    </div>

                                    {result.stats.errors && result.stats.errors.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-bold text-red-700 mb-2">Error Details:</h4>
                                            <ul className="list-disc pl-4 space-y-1 text-red-600 text-xs max-h-32 overflow-y-auto">
                                                {result.stats.errors.map((err, idx) => (
                                                    <li key={idx}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={onClose}
                                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
