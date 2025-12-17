import { getProducts } from '@/actions/products';
import { getCustomers } from '@/actions/customers';
import PosInterface from '@/components/pos/pos-interface';

// Dynamic because product/prices change frequently
export const dynamic = 'force-dynamic';

export default async function PosPage() {
    // Fetch products (limit 1000 for POS MVP)
    // No search query initially
    const { products } = await getProducts('', 1, 1000);
    const { customers } = await getCustomers('', 1, 1000);

    return (
        <div className="h-full">
            <PosInterface products={products} customers={customers} />
        </div>
    );
}
