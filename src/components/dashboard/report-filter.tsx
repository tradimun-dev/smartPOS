'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { FileDown, Search } from 'lucide-react';

export default function ReportFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [startDate, setStartDate] = useState(searchParams.get('start') || '');
    const [endDate, setEndDate] = useState(searchParams.get('end') || '');

    const applyFilter = () => {
        const params = new URLSearchParams(searchParams);
        if (startDate) params.set('start', startDate);
        else params.delete('start');

        if (endDate) params.set('end', endDate);
        else params.delete('end');

        params.delete('page'); // reset page
        router.push(`?${params.toString()}`);
    };

    const handleExport = () => {
        alert('Fitur Export Excel akan tersedia di update berikutnya!');
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between mb-6">
            <div className="flex gap-4 items-center flex-1">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div className="pb-0.5">
                    <label className="block text-xs font-medium text-gray-500 mb-1 opacity-0">Action</label>
                    <button
                        onClick={applyFilter}
                        className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 flex items-center gap-2"
                    >
                        <Search size={16} /> Filter
                    </button>
                </div>
            </div>

            <button
                onClick={handleExport}
                className="text-gray-600 hover:text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-gray-200"
            >
                <FileDown size={16} /> Export Excel
            </button>
        </div>
    );
}
