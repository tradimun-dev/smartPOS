'use client';

import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, User, CreditCard, CheckCircle, Printer } from 'lucide-react';
import { CartItem, processCheckout } from '@/actions/pos';
import Image from 'next/image';
import PrintableReceipt, { ReceiptData } from './printable-receipt';

interface PosInterfaceProps {
    products: any[];
    customers: any[];
}

export default function PosInterface({ products, customers }: PosInterfaceProps) {
    // State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Customer State
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState<ReceiptData | null>(null);

    // Derived State
    const activeCustomer = useMemo(() => {
        if (!selectedCustomerId) return null;
        return customers.find(c => c.id === selectedCustomerId) || null;
    }, [selectedCustomerId, customers]);

    const activeCustomerType = activeCustomer?.type || 'retail';

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category?.name).filter(Boolean));
        return ['all', ...Array.from(cats)];
    }, [products]);

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        const matchCat = selectedCategory === 'all' || p.category?.name === selectedCategory;
        return matchSearch && matchCat;
    });

    // Helper calculate price
    const getPrice = (product: any, type: string) => {
        // Fallback to retail if specific price not found
        const priceObj = product.prices.find((p: any) => p.customer_type === type);
        if (priceObj) return priceObj.price;
        return product.prices.find((p: any) => p.customer_type === 'retail')?.price || 0;
    };

    // Calculate cart total dynamically based on active customer type!
    // But wait, if customer changes, prices in cart should change?
    // User expectation: Yes, usually.
    // So CartItem shouldn't store fixed price, or it should update when customer changes.
    // Let's make CartItem store just ID, and we derive price? 
    // BUT `processCheckout` expects price.
    // BETTER APPROACH: Re-calculate cart prices whenever `activeCustomerType` changes.

    // Effect to update prices when customer type changes
    // Actually, let's just compute it on render for display, but for storing...
    // simpler: update cart state when customer type changes.
    // BUT modifying state in effect can be tricky/looping.
    // Let's derive `cartDisplay` for UI and `cartPayload` for checkout.

    // Actually, `addToCart` stores `price` in state. If I change customer, I should update that state.
    // Let's keep it simple: when rendering cart, calculate price based on current customer type.
    // When checking out, use that same calculation.

    const cartWithPrices = useMemo(() => {
        return cart.map(item => {
            const product = products.find(p => p.id === item.product_id);
            if (!product) return item;
            const dynamicPrice = getPrice(product, activeCustomerType);
            return { ...item, price: dynamicPrice };
        });
    }, [cart, products, activeCustomerType]);

    const cartTotal = cartWithPrices.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const change = (Number(amountPaid) || 0) - cartTotal;

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
    );

    // Actions
    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.id);
            if (existing) {
                // Check stock limit
                if (existing.quantity >= (product.total_stock || 0)) return prev;

                return prev.map(item =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                product_id: product.id,
                name: product.name,
                price: 0, // Placeholder, calculated effectively in cartWithPrices
                quantity: 1,
                unit: product.unit
            }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.product_id !== id));
    };

    const setQuantity = (id: string, newQty: number) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const maxStock = product.total_stock || 0;

        // Clamp
        let finalQty = newQty;
        if (finalQty < 1) finalQty = 1;
        if (finalQty > maxStock) finalQty = maxStock;

        setCart(prev => prev.map(item =>
            item.product_id === id ? { ...item, quantity: finalQty } : item
        ));
    };

    const handleCheckout = async () => {
        if (cartWithPrices.length === 0) return;
        if (paymentMethod === 'cash' && change < 0) {
            alert('Pembayaran kurang!');
            return;
        }

        setLoading(true);
        // Use cartWithPrices to send correct pricing
        const result = await processCheckout(
            cartWithPrices,
            selectedCustomerId || null,
            paymentMethod,
            Number(amountPaid) || 0,
            ''
        );

        setLoading(false);
        if (result.success) {
            // Construct Receipt Data
            const receiptData: ReceiptData = {
                orderId: result.orderId!,
                orderNumber: result.orderId!.slice(0, 8).toUpperCase(),
                date: new Date(),
                items: cartWithPrices.map(i => ({
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    unit: i.unit
                })),
                subtotal: cartTotal,
                total: cartTotal,
                amountPaid: Number(amountPaid) || 0,
                change: Math.max(0, change),
                customer: activeCustomer ? {
                    name: activeCustomer.name,
                    address: activeCustomer.address,
                    phone: activeCustomer.phone,
                    type: activeCustomer.type
                } : null,
                paymentMethod
            };

            setCheckoutSuccess(receiptData);
            setCart([]);
            setAmountPaid('');
        } else {
            alert(result.message);
        }
    };

    const formatRupiah = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const selectCustomer = (customer: any) => {
        setSelectedCustomerId(customer.id);
        setCustomerSearch(customer.name);
        setIsCustomerDropdownOpen(false);
    };

    const clearCustomer = () => {
        setSelectedCustomerId('');
        setCustomerSearch('');
        setIsCustomerDropdownOpen(false);
    };

    if (checkoutSuccess) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in print:hidden">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Transaksi Berhasil!</h2>
                    <p className="text-gray-500 mt-2">Kembalian: <span className="font-bold text-gray-900">{formatRupiah(checkoutSuccess.change)}</span></p>

                    <div className="flex gap-4 mt-8">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                            <Printer size={18} /> Print Struk
                        </button>
                        <button
                            onClick={() => setCheckoutSuccess(null)}
                            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                        >
                            Transaksi Baru
                        </button>
                    </div>
                </div>

                {/* Printable Receipt Component - Visible only on Print */}
                <PrintableReceipt data={checkoutSuccess} />
            </>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
            {/* Left Panel: Products */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Search & Filter */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari produk (Scan Barcode)..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-green-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <select
                        className="px-4 py-3 rounded-xl border border-gray-200 shadow-sm bg-white"
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">Semua Kategori</option>
                        {categories.map(c => c !== 'all' && <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                    {filteredProducts.map(p => {
                        const stock = p.total_stock || 0;
                        const displayPrice = getPrice(p, activeCustomerType);

                        return (
                            <button
                                key={p.id}
                                onClick={() => addToCart(p)}
                                disabled={stock <= 0}
                                className="flex flex-col text-left bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-green-700">{p.name}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{p.sku}</p>
                                </div>
                                <div className="mt-4 flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-gray-500">Stok: {stock}</p>
                                        <p className="font-bold text-green-700">
                                            {formatRupiah(displayPrice)}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <PlusIcon />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Panel: Cart */}
            <div className="w-full lg:w-96 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-800 font-bold">
                        <ShoppingCart size={20} /> Keranjang
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{cart.length} Item</span>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cartWithPrices.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                            <ShoppingCart size={48} className="mb-2 opacity-20" />
                            <p>Belum ada produk dipilih</p>
                        </div>
                    ) : (
                        cartWithPrices.map(item => (
                            <div key={item.product_id} className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-800 text-sm line-clamp-2 leading-tight mb-1">{item.name}</h4>
                                    <p className="text-green-700 text-xs font-bold">{formatRupiah(item.price)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                                        className="w-7 h-7 rounded border bg-gray-50 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        className="w-12 h-7 text-center text-sm border-y border-gray-200 outline-none focus:ring-1 focus:ring-green-500"
                                        value={item.quantity}
                                        onChange={(e) => setQuantity(item.product_id, parseInt(e.target.value) || 1)}
                                        onFocus={(e) => e.target.select()}
                                    />
                                    <button
                                        onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                                        className="w-7 h-7 rounded border bg-gray-50 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100"
                                    >
                                        +
                                    </button>
                                </div>
                                <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Section */}
                <div className="p-4 border-t bg-gray-50 space-y-3 z-10 relative">
                    {/* Customer Searchable */}
                    <div className="relative">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border focus-within:ring-2 focus-within:ring-green-500">
                            <User size={16} className={`text-gray-400 ${activeCustomer ? 'text-green-600' : ''}`} />
                            <input
                                type="text"
                                className="flex-1 bg-transparent text-sm outline-none w-full"
                                placeholder="Cari Pelanggan..."
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setIsCustomerDropdownOpen(true);
                                    if (selectedCustomerId && e.target.value !== activeCustomer?.name) {
                                        setSelectedCustomerId(''); // Deselect if typing
                                    }
                                }}
                                onFocus={() => setIsCustomerDropdownOpen(true)}
                            />
                            {customerSearch && (
                                <button onClick={clearCustomer} className="text-gray-400 hover:text-gray-600 p-1">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Results */}
                        {isCustomerDropdownOpen && customerSearch && !selectedCustomerId && (
                            <div className="absolute bottom-full left-0 right-0 bg-white border rounded-lg shadow-xl mb-1 max-h-48 overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500 text-center">Pelanggan tidak ditemukan</div>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => selectCustomer(c)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 flex flex-col border-b last:border-0"
                                        >
                                            <span className="font-bold text-gray-800">{c.name}</span>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>{c.phone || '-'}</span>
                                                <span className="capitalize bg-gray-100 px-1 rounded">{c.type}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Selected Customer Type Indicator */}
                        <div className="mt-1 flex justify-between items-center text-xs px-1">
                            <span className="text-gray-500">Tipe Pelanggan:</span>
                            <span className={`font-bold capitalize ${activeCustomer ? 'text-green-700 bg-green-100 px-2 py-0.5 rounded-full' : 'text-gray-600'}`}>
                                {activeCustomerType}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-dashed border-gray-200">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-bold">{formatRupiah(cartTotal)}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm py-2">
                            <span className="text-gray-500 flex items-center gap-1"><CreditCard size={14} /> Bayar</span>
                            <div className="w-1/2">
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full text-right p-1 rounded border border-gray-300 focus:ring-green-500 focus:border-green-500"
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Kembalian</span>
                            <span className={`font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatRupiah(Math.max(0, change))}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cartWithPrices.length === 0 || loading}
                        className="w-full py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                    >
                        {loading ? 'Memproses...' : 'Bayar Sekarang'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PlusIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
}
