'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface ProductPrice {
    customer_type: 'retail' | 'apotek' | 'distributor';
    price: number;
}

export type ProductFormState = {
    message: string;
    errors?: Record<string, string[]>;
    success?: boolean;
}

export async function getProducts(query: string = '', page: number = 1, limit: number = 10) {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('products')
        .select(`
      *,
      category:categories(name),
      prices:product_prices(customer_type, price),
      inventory:inventory(quantity)
    `, { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`);
    }

    const { data, error, count } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching products:', error);
        throw new Error('Gagal mengambil data produk');
    }

    // Calculate total stock
    const products = data.map(p => ({
        ...p,
        total_stock: p.inventory?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0
    }));

    return { products, count: count || 0 };
}

export async function getCategories() {
    const supabase = await createClient();
    const { data } = await supabase.from('categories').select('*').order('name');
    return data || [];
}

export async function createProduct(prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const supabase = await createClient();

    const rawData = {
        sku: formData.get('sku') as string,
        name: formData.get('name') as string,
        barcode: formData.get('barcode') as string || null,
        category_id: formData.get('category_id') as string,
        unit: formData.get('unit') as string,
        min_stock: Number(formData.get('min_stock')) || 0,
    };

    const prices = [
        { type: 'retail', price: Number(formData.get('price_retail')) || 0 },
        { type: 'apotek', price: Number(formData.get('price_apotek')) || 0 },
        { type: 'distributor', price: Number(formData.get('price_distributor')) || 0 },
    ];

    // 1. Insert Product
    const { data: product, error } = await supabase
        .from('products')
        .insert(rawData)
        .select()
        .single();

    if (error) {
        console.error('Insert Error:', error);
        return { message: 'Gagal menambakan produk. SKU mungkin duplikat.', success: false };
    }

    // 2. Insert Prices
    const priceInserts = prices.map(p => ({
        product_id: product.id,
        customer_type: p.type,
        price: p.price
    }));

    const { error: priceError } = await supabase
        .from('product_prices')
        .insert(priceInserts);

    if (priceError) {
        console.error('Price Error:', priceError);
        // Idealnya rollback production delete, tapi MVP keep simple
        return { message: 'Produk dibuat tapi gagal set harga.', success: false };
    }

    revalidatePath('/dashboard/products');
    return { message: 'Produk berhasil ditambahkan!', success: true };
}

export async function updateProduct(id: string, prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const supabase = await createClient();

    const rawData = {
        sku: formData.get('sku') as string,
        name: formData.get('name') as string,
        barcode: formData.get('barcode') as string || null,
        category_id: formData.get('category_id') as string,
        unit: formData.get('unit') as string,
        min_stock: Number(formData.get('min_stock')) || 0,
    };

    const prices = [
        { type: 'retail', price: Number(formData.get('price_retail')) || 0 },
        { type: 'apotek', price: Number(formData.get('price_apotek')) || 0 },
        { type: 'distributor', price: Number(formData.get('price_distributor')) || 0 },
    ];

    // 1. Update Product
    const { error } = await supabase
        .from('products')
        .update(rawData)
        .eq('id', id);

    if (error) {
        console.error('Update Error:', error);
        return { message: 'Gagal update produk.', success: false };
    }

    // 2. Update Prices (Upsert)
    // First, delete old prices? Or upsert?
    // Supabase upsert needs a unique key conflict.
    // product_prices has composite PK (product_id, customer_type) usually.
    // Let's assume upsert works if schema allows or delete/insert.
    // safest for now without checking schema: delete all for this product and re-insert.

    await supabase.from('product_prices').delete().eq('product_id', id);

    const priceInserts = prices.map(p => ({
        product_id: id,
        customer_type: p.type,
        price: p.price
    }));

    const { error: priceError } = await supabase
        .from('product_prices')
        .insert(priceInserts);

    if (priceError) {
        console.error('Price Update Error:', priceError);
        return { message: 'Produk diupdate tapi harga gagal.', success: false };
    }

    revalidatePath('/dashboard/products');
    return { message: 'Produk berhasil diupdate!', success: true };
}

export async function deleteProduct(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('products').delete().match({ id });

    if (error) {
        return { message: error.message, success: false };
    }

    revalidatePath('/dashboard/products');
    return { message: 'Produk dihapus', success: true };
}
