'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface CartItem {
    product_id: string;
    quantity: number;
    price: number;
    name: string; // for display only, not sent to DB
    unit: string;
}

export async function processCheckout(
    items: CartItem[],
    customerId: string | null,
    paymentMethod: string,
    amountPaid: number,
    notes: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'Unauthorized', success: false };

    // Prepare minimal data payload for RPC
    const payloadItems = items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price
    }));

    const { data, error } = await supabase.rpc('handle_checkout', {
        p_items: payloadItems,
        p_customer_id: customerId,
        p_payment_method: paymentMethod,
        p_amount_paid: amountPaid, // We might store change/kembalian logic in DB later? Currently RPC ignores it or just logs it? RPC doesn't take amount_paid as param? Check SQL.
        // RPC param: p_amount_paid DECIMAL. Yes it does.
        p_notes: notes,
        p_user_id: user.id
    });

    if (error || (data && !data.success)) {
        console.error('Checkout Error:', error || data);
        return { message: data?.message || error?.message || 'Transaksi Gagal', success: false };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/products');

    return {
        message: 'Transaksi Berhasil!',
        success: true,
        orderId: data.order_id
    };
}
