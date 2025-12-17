'use server';

import { createClient } from '@/lib/supabase-server';

export async function getDashboardStats() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_dashboard_summary');

    if (error) {
        console.error('Stats Error:', error);
        return {
            sales_today: 0,
            trx_count_today: 0,
            low_stock_count: 0,
            expired_count: 0
        };
    }
    return data;
}

export async function getSalesChartData() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_sales_chart', { p_days: 7 });
    return data || [];
}

export async function getSalesReport(startDate?: string, endDate?: string, page: number = 1) {
    const supabase = await createClient();
    const PAGE_SIZE = 10;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
        .from('sales_orders')
        .select(`
            id,
            total_amount,
            status,
            created_at,
            customer:customers(name),
            user:users(email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`);
    }
    if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Report Error:', error);
        return { data: [], count: 0 };
    }

    return { data, count: count || 0 };
}
