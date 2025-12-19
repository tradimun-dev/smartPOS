import { getProducts, getCategories } from '@/actions/products';
import { getUnits } from '@/actions/units';
import ProductHeader from '@/components/inventory/product-header';
import ProductTable from '@/components/inventory/product-table';

// Force dynamic because we use DB
export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const params = await searchParams;
    const query = params.q || '';
    const page = Number(params.page) || 1;

    const { products, count } = await getProducts(query, page);
    const categories = await getCategories();
    const { units } = await getUnits('', 1, 1000);

    return (
        <div className="space-y-6">
            <ProductHeader categories={categories} units={units} products={products} />

            <ProductTable
                products={products}
                categories={categories}
                units={units}
                page={page}
                count={count}
            />
        </div>
    );
}
