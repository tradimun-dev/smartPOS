'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export type CategoryFormState = {
    message: string;
    errors?: Record<string, string[]>;
    success?: boolean;
}

export async function getCategories(query: string = '', page: number = 1, limit: number = 10) {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('categories')
        .select('*', { count: 'exact' });

    if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data, error, count } = await dbQuery
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching categories:', error);
        throw new Error('Gagal mengambil data kategori');
    }

    return { categories: data || [], count: count || 0 };
}

export async function createCategory(prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
        return { message: 'Nama kategori wajib diisi.', success: false };
    }

    const { error } = await supabase
        .from('categories')
        .insert({ name, description });

    if (error) {
        console.error('Create Category Error:', error);
        return { message: 'Gagal membuat kategori.', success: false };
    }

    revalidatePath('/dashboard/configuration');
    return { message: 'Kategori berhasil ditambahkan!', success: true };
}

export async function updateCategory(id: string, prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
        return { message: 'Nama kategori wajib diisi.', success: false };
    }

    const { error } = await supabase
        .from('categories')
        .update({ name, description })
        .eq('id', id);

    if (error) {
        console.error('Update Category Error:', error);
        return { message: 'Gagal mengupdate kategori.', success: false };
    }

    revalidatePath('/dashboard/configuration');
    return { message: 'Kategori berhasil diupdate!', success: true };
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
        console.error('Delete Category Error:', error);
        return { message: 'Gagal menghapus kategori. Mungkin sedang digunakan oleh produk.', success: false };
    }

    revalidatePath('/dashboard/configuration');
    return { message: 'Kategori berhasil dihapus', success: true };
}
