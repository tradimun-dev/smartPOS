'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function submitGoodsReceipt(prevState: any, formData: FormData) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized', success: false };

    // Ensure user exists in public.users (Self-healing for dev environment)
    const { data: publicUser } = await supabase.from('users').select('id').eq('id', user.id).single();
    if (!publicUser) {
        await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: 'owner'
        });
    }

    const rawData = {
        p_product_id: formData.get('product_id') as string,
        p_batch_number: formData.get('batch_number') as string,
        p_expiry_date: formData.get('expiry_date') as string,
        p_quantity: Number(formData.get('quantity')),
        p_notes: formData.get('notes') as string,
        p_user_id: user.id
    };

    const { data, error } = await supabase
        .rpc('handle_goods_receipt', rawData);

    if (error) {
        console.error('RPC Error:', error);
        return { message: 'Gagal proses barang masuk: ' + error.message, success: false };
    }

    // RPC returns JSONB, check success field
    if (!data || !data.success) {
        return { message: data?.message || 'Proses gagal di database', success: false };
    }

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/products');
    return { message: 'Barang masuk berhasil diproses!', success: true };
}

export async function submitStockAdjustment(prevState: any, formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized', success: false };

    const inventory_id = formData.get('inventory_id') as string;
    const delta = Number(formData.get('delta'));
    const notes = formData.get('notes') as string;

    const { data, error } = await supabase.rpc('handle_stock_adjustment', {
        p_inventory_id: inventory_id,
        p_delta_quantity: delta,
        p_notes: notes,
        p_user_id: user.id
    });

    if (error || (data && !data.success)) {
        return { message: data?.message || error?.message || 'Adjustment gagal', success: false };
    }

    revalidatePath('/dashboard/inventory');
    return { message: 'Stok berhasil dikoreksi', success: true };
}

export async function getInventoryList(query: string = '', page: number = 1) {
    const supabase = await createClient();

    // Simple join to product
    let dbQuery = supabase
        .from('inventory')
        .select(`
            *,
            product:products(name, sku, unit)
        `)
        .gt('quantity', 0) // Only show available stock by default? Or all? Let's show all for now.
        .order('expiry_date', { ascending: true }); // FEFO view

    if (query) {
        // Need to filter by joined table columns, which is tricky in Supabase basic syntax without Flattening or View.
        // Or fetch products first then filter inventory.
        // For MVP, let's just fetch all and filter in memory if dataset is small, or use proper embedding filter.
        // products!inner(name) filters rows where product matches
        dbQuery = supabase
            .from('inventory')
            .select(`*, product:products!inner(name, sku, unit)`)
            .ilike('product.name', `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) throw new Error(error.message);
    return data || [];
}
