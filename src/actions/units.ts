'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export type UnitFormState = {
    message: string;
    errors?: Record<string, string[]>;
    success?: boolean;
}

export async function getUnits(query: string = '', page: number = 1, limit: number = 10) {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('units')
        .select('*', { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data, error, count } = await dbQuery
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching units:', JSON.stringify(error, null, 2));
        throw new Error('Gagal mengambil data satuan');
    }

    return { units: data || [], count: count || 0 };
}

export async function createUnit(prevState: UnitFormState, formData: FormData): Promise<UnitFormState> {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
        return { message: 'Nama satuan wajib diisi.', success: false };
    }

    const { error } = await supabase
        .from('units')
        .insert({ name, description });

    if (error) {
        console.error('Create Unit Error:', error);
        return { message: 'Gagal membuat satuan.', success: false };
    }

    revalidatePath('/dashboard/configuration');
    return { message: 'Satuan berhasil ditambahkan!', success: true };
}

export async function updateUnit(id: string, prevState: UnitFormState, formData: FormData): Promise<UnitFormState> {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
        return { message: 'Nama satuan wajib diisi.', success: false };
    }

    const { error } = await supabase
        .from('units')
        .update({ name, description })
        .eq('id', id);

    if (error) {
        console.error('Update Unit Error:', error);
        return { message: 'Gagal mengupdate satuan.', success: false };
    }

    revalidatePath('/dashboard/configuration');
    return { message: 'Satuan berhasil diupdate!', success: true };
}

export async function deleteUnit(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('units').delete().eq('id', id);

    if (error) {
        console.error('Delete Unit Error:', error);
        return { message: 'Gagal menghapus satuan.', success: false };
    }

    revalidatePath('/dashboard/configuration');
    return { message: 'Satuan berhasil dihapus', success: true };
}
