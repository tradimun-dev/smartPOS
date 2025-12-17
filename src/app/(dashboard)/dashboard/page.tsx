export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Penjualan Hari Ini</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">Rp 0</p>
                    <div className="mt-4 text-xs text-green-600 flex items-center">
                        <span>+0% dari kemarin</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Transaksi</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                    <div className="mt-4 text-xs text-gray-500">
                        Order hari ini
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Produk Low Stock</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
                    <div className="mt-4 text-xs text-yellow-600">
                        Perlu restock segera
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center py-12">
                <h2 className="text-lg font-medium text-gray-900">Selamat Datang di TRADIMUN Smart POS</h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    Sistem siap digunakan. Silakan mulai dengan mengatur Master Data Produk atau melakukan transaksi di menu POS Kasir.
                </p>
            </div>
        </div>
    );
}
