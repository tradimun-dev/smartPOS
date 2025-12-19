'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
// Remove static imports to avoid build issues with heavy libs or fs deps
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

export default function ProductActions({ products }: { products: any[] }) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const XLSX = await import('xlsx');

            const dataToExport = products.map(p => ({
                'SKU': p.sku,
                'Nama Produk': p.name,
                'Barcode': p.barcode || '-',
                'Kategori': p.category?.name || '-',
                'Satuan': p.unit,
                'Stok': p.total_stock,
                'Harga Retail': p.prices?.find((pr: any) => pr.customer_type === 'retail')?.price || 0,
                'Harga Apotek': p.prices?.find((pr: any) => pr.customer_type === 'apotek')?.price || 0,
                'Harga Distributor': p.prices?.find((pr: any) => pr.customer_type === 'distributor')?.price || 0,
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Produk");
            XLSX.writeFile(wb, "Daftar_Produk_Tradimun.xlsx");
        } catch (error) {
            console.error('Export Excel Error:', error);
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

            doc.setFontSize(18);
            doc.text("Daftar Produk Tradimun", 14, 22);
            doc.setFontSize(11);
            doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 30);

            const tableData = products.map(p => [
                p.sku,
                p.name,
                p.category?.name || '-',
                p.total_stock + ' ' + p.unit,
                new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                    p.prices?.find((pr: any) => pr.customer_type === 'retail')?.price || 0
                )
            ]);

            autoTable(doc, {
                head: [['SKU', 'Nama Produk', 'Kategori', 'Stok', 'Harga Retail']],
                body: tableData,
                startY: 40,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [21, 128, 61] } // Green-700
            });

            doc.save("Daftar_Produk_Tradimun.pdf");
        } catch (error) {
            console.error('Export PDF Error:', error);
            alert('Gagal export PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const XLSX = await import('xlsx');

            const templateData = [
                {
                    'SKU': 'CONTOH-001',
                    'Nama Produk': 'Contoh Produk',
                    'Barcode': '8999999999',
                    'Kategori': 'Obat',
                    'Satuan': 'Pcs',
                    'Stok Minimum': 5,
                    'Harga Retail': 10000,
                    'Harga Apotek': 9000,
                    'Harga Distributor': 8000
                }
            ];
            const ws = XLSX.utils.json_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");
            XLSX.writeFile(wb, "Template_Import_Produk.xlsx");
        } catch (error) {
            console.error('Download Template Error:', error);
            alert('Gagal download template');
        }
    }

    return (
        <div className="flex gap-2">
            <div className="relative group">
                <button
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                >
                    <Download size={18} />
                    <span className="hidden sm:inline">Export</span>
                </button>
                {/* Dropdown menu */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg hidden group-hover:block z-50">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left gap-2"
                    >
                        <FileSpreadsheet size={16} className="text-green-600" /> Excel (.xlsx)
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left gap-2"
                    >
                        <FileText size={16} className="text-red-600" /> PDF
                    </button>
                </div>
            </div>

            <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
            >
                <FileSpreadsheet size={18} />
                <span className="hidden sm:inline">Template</span>
            </button>
        </div>
    );
}
