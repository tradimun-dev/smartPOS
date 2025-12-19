import { getCategories } from '@/actions/categories';
import { getUnits } from '@/actions/units';
import CategoryList from './components/CategoryList';
import UnitList from './components/UnitList';

export const dynamic = 'force-dynamic';

export default async function ConfigurationPage() {
    const { categories } = await getCategories('', 1, 1000);
    const { units } = await getUnits('', 1, 1000);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Konfigurasi Sistem</h1>
                <p className="text-gray-500 text-sm">Kelola master data kategori produk dan satuan unit.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
                <CategoryList initialCategories={categories} />
                <UnitList initialUnits={units} />
            </div>
        </div>
    );
}
