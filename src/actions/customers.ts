'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getCustomers(query: string = '', page: number = 1, limit: number = 10) {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('customers')
        .select('*', { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
    }

    const { data, error, count } = await dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return { customers: data, count: count || 0 };
}

export async function createCustomer(prevState: any, formData: FormData) {
    const supabase = await createClient();

    const rawData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        type: formData.get('type') as string,
        address: formData.get('address') as string,
    };

    const { error } = await supabase.from('customers').insert(rawData);

    if (error) {
        return { message: 'Gagal menambah pelanggan: ' + error.message, success: false };
    }

    revalidatePath('/dashboard/customers');
    return { message: 'Pelanggan berhasil ditambahkan', success: true };
}
