'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface InventoryActionsProps {
    inventory: any[];
}

export default function InventoryActions({ inventory }: InventoryActionsProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const XLSX = await import('xlsx');

            const dataToExport = inventory.map(item => ({
                'Nama Produk': item.product?.name,
                'SKU': item.product?.sku,
                'Nomor Batch': item.batch_number,
                'Tanggal Expired': format(new Date(item.expiry_date), 'dd/MM/yyyy'),
                'Stok': item.quantity,
                'Satuan': item.product?.unit || 'pcs'
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventory");
            XLSX.writeFile(wb, `Inventory_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Gagal export Excel');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // Title
            doc.setFontSize(16);
            doc.text(`Laporan Inventori - ${format(new Date(), 'dd MMM yyyy')}`, 14, 20);

            // Table
            const tableData = inventory.map(item => [
                item.product?.name,
                item.product?.sku,
                item.batch_number,
                format(new Date(item.expiry_date), 'dd/MM/yyyy'),
                `${item.quantity} ${item.product?.unit || ''}`
            ]);

            // @ts-ignore
            autoTable(doc, {
                head: [['Produk', 'SKU', 'Batch', 'Expired', 'Stok']],
                body: tableData,
                startY: 30,
            });

            doc.save(`Inventory_Export_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } catch (error) {
            console.error('Export PDF failed:', error);
            alert('Gagal export PDF');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center gap-2 bg-white border border-gray-300 text-green-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                title="Export Excel"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                <span className="hidden md:inline">Excel</span>
            </button>
            <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 bg-white border border-gray-300 text-red-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                title="Export PDF"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                <span className="hidden md:inline">PDF</span>
            </button>
        </div>
    );
}
