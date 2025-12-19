'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export type ImportResult = {
    success: boolean;
    message: string;
    stats?: {
        total: number;
        success: number;
        failed: number;
        skipped: number;
        errors: string[];
    };
};

export async function importProducts(formData: FormData): Promise<ImportResult> {
    const supabase = await createClient();
    const file = formData.get('file') as File;

    if (!file) {
        return { success: false, message: 'File tidak ditemukan' };
    }

    try {
        // We can't use xlsx on server directly with File object easily without conversion
        // In Server Actions, we receive File. We need to convert to ArrayBuffer.
        const buffer = await file.arrayBuffer();

        // Dynamic import to avoid build issues sometimes with xlsx in RSC constraint environments, 
        // though standard import usually works if 'xlsx' is installed.
        // We'll rely on the client-side parsing if server-side is too heavy, 
        // but user asked for "Server Action" implicitly or we can do it client side?
        // Actually, enforcing server-side validation is better.
        // But `xlsx` lib works in Node.

        const XLSX = require('xlsx');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
            return { success: false, message: 'File kosong atau format salah' };
        }

        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        // 1. Fetch Master Data for mapping
        const { data: categories } = await supabase.from('categories').select('id, name');
        // We don't need to fetch units as it's just text based or we check? 
        // User said "match by name".

        // 2. Process Rows
        for (const [index, row] of rows.entries()) {
            const rowNum = index + 2; // 1-based + header
            const sku = row['SKU'];
            const name = row['Nama Produk'];

            if (!sku || !name) {
                failedCount++;
                errors.push(`Baris ${rowNum}: SKU dan Nama Produk wajib diisi.`);
                continue;
            }

            // Check duplicate SKU
            const { data: existing } = await supabase.from('products').select('id').eq('sku', sku).single();
            if (existing) {
                skippedCount++;
                continue;
            }

            // Map Category
            let categoryId = null;
            if (row['Kategori'] && categories) {
                const cat = categories.find(c => c.name.toLowerCase() === row['Kategori'].toString().toLowerCase());
                if (cat) categoryId = cat.id;
            }

            // Prepare Insert
            const productData = {
                sku: String(sku),
                name: String(name),
                barcode: row['Barcode'] ? String(row['Barcode']) : null,
                category_id: categoryId,
                unit: row['Satuan'] ? String(row['Satuan']) : 'pcs',
                min_stock: Number(row['Stok Minimum']) || 0,
            };

            const { data: newPro, error } = await supabase.from('products').insert(productData).select().single();

            if (error) {
                failedCount++;
                errors.push(`Baris ${rowNum} (${sku}): Gagal save - ${error.message}`);
                continue;
            }

            // Insert Prices
            const prices = [
                { type: 'retail', price: Number(row['Harga Retail']) || 0 },
                { type: 'apotek', price: Number(row['Harga Apotek']) || 0 },
                { type: 'distributor', price: Number(row['Harga Distributor']) || 0 },
            ];

            const priceInserts = prices.map(p => ({
                product_id: newPro.id,
                customer_type: p.type,
                price: p.price
            }));

            await supabase.from('product_prices').insert(priceInserts);
            successCount++;
        }

        revalidatePath('/dashboard/products');
        return {
            success: true,
            message: 'Import selesai',
            stats: {
                total: rows.length,
                success: successCount,
                failed: failedCount,
                skipped: skippedCount,
                errors: errors.slice(0, 10) // Limit errors sent back
            }
        };

    } catch (error: any) {
        console.error('Import Error:', error);
        return { success: false, message: `Gagal memproses file: ${error.message}` };
    }
}
