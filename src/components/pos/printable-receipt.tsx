import React from 'react';

export interface ReceiptData {
    orderId: string;
    orderNumber?: string; // If returned from backend, otherwise use ID
    date: Date;
    items: {
        name: string;
        quantity: number;
        price: number;
        unit: string;
    }[];
    subtotal: number;
    total: number;
    amountPaid: number;
    change: number;
    customer?: {
        name: string;
        address?: string;
        phone?: string;
        type: string;
    } | null;
    paymentMethod: string;
}

export default function PrintableReceipt({ data }: { data: ReceiptData }) {
    const formatRupiah = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <div id="printable-receipt" className="hidden print:block absolute top-0 left-0 w-full bg-white p-8 mb-4 text-black">
            {/* Header */}
            <div className="text-center mb-6 border-b pb-4 border-dashed border-gray-400">
                <h1 className="text-2xl font-bold uppercase tracking-wider">CV. TRADIMUN MANDIRI</h1>
                <p className="text-sm">Jl. Manggis Timur IV No 5 Gresik</p>
                {/* <p className="text-sm">Telp: 021-12345678</p> */}
            </div>

            {/* Meta Info */}
            <div className="flex justify-between text-sm mb-4">
                <div>
                    <p>No. Order: <span className="font-mono font-bold">{data.orderNumber || data.orderId.slice(0, 8)}</span></p>
                    <p>Tanggal: {data.date.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                    <p>Pelanggan: {data.customer ? data.customer.name : 'Umum (Retail)'}</p>
                    {data.customer?.type && <p className="capitalize text-xs text-gray-600">({data.customer.type})</p>}
                </div>
            </div>

            {/* Content Table */}
            <table className="w-full text-sm mb-6">
                <thead>
                    <tr className="border-y border-gray-800">
                        <th className="text-left py-2">Produk</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-right py-2">Harga</th>
                        <th className="text-right py-2">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200 border-dashed">
                            <td className="py-2 pr-2">
                                <div className="font-medium">{item.name}</div>
                            </td>
                            <td className="py-2 text-center whitespace-nowrap">
                                {item.quantity} {item.unit}
                            </td>
                            <td className="py-2 text-right whitespace-nowrap">
                                {formatRupiah(item.price)}
                            </td>
                            <td className="py-2 text-right font-medium whitespace-nowrap">
                                {formatRupiah(item.price * item.quantity)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex flex-col items-end text-sm space-y-1 mb-8">
                <div className="w-1/2 flex justify-between">
                    <span>Total Tagihan:</span>
                    <span className="font-bold text-lg">{formatRupiah(data.total)}</span>
                </div>
                <div className="w-1/2 flex justify-between border-t border-dashed pt-1 mt-1">
                    <span>Bayar ({data.paymentMethod}):</span>
                    <span>{formatRupiah(data.amountPaid)}</span>
                </div>
                <div className="w-1/2 flex justify-between font-bold">
                    <span>Kembali:</span>
                    <span>{formatRupiah(data.change)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs mt-8 pt-4 border-t border-gray-400">
                <p className="font-medium">Terima Kasih atas Kunjungan Anda</p>
                <p className="italic text-gray-500 mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        padding: 20px; /* Safe margin for print */
                    }
                }
            `}</style>
        </div>
    );
}
