-- FUNCTION: Get Dashboard Summary (Today)
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS JSONB AS $$
DECLARE
  v_sales_today DECIMAL;
  v_trx_count_today INTEGER;
  v_low_stock_count INTEGER;
  v_expired_count INTEGER;
BEGIN
  -- 1. Sales Today (UTC date check might need timezone adjustment for Indo, using standard CURRENT_DATE for now)
  SELECT 
    COALESCE(SUM(total_amount), 0), 
    COUNT(id)
  INTO v_sales_today, v_trx_count_today
  FROM public.sales_orders
  WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed';

  -- 2. Low Stock Count
  -- (Products where SUM(inventory) <= min_stock OR total_stock column if exists)
  -- Assuming simple check against product level if synced, OR complex join.
  -- For speed, let's use the 'products' table 'total_stock' column if we have a trigger syncing it.
  -- If not, we count products where (SELECT SUM(quantity) FROM inventory WHERE product_id = p.id) <= p.min_stock
  
  -- Let's assume we don't have auto-sync total_stock yet (safest).
  WITH stock_calc AS (
    SELECT p.id, p.min_stock, COALESCE(SUM(i.quantity), 0) as current_stock
    FROM public.products p
    LEFT JOIN public.inventory i ON i.product_id = p.id
    GROUP BY p.id, p.min_stock
  )
  SELECT COUNT(*) INTO v_low_stock_count
  FROM stock_calc
  WHERE current_stock <= min_stock;

  -- 3. Expired / Near Expired Count (< 30 days)
  SELECT COUNT(*) INTO v_expired_count
  FROM public.inventory
  WHERE expiry_date <= (CURRENT_DATE + INTERVAL '30 days') AND quantity > 0;

  RETURN jsonb_build_object(
    'sales_today', v_sales_today,
    'trx_count_today', v_trx_count_today,
    'low_stock_count', v_low_stock_count,
    'expired_count', v_expired_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FUNCTION: Get Sales Chart (Last N Days)
CREATE OR REPLACE FUNCTION public.get_sales_chart(p_days INTEGER DEFAULT 7)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  SELECT jsonb_agg(dataset) INTO v_data
  FROM (
    SELECT 
      TO_CHAR(date_series, 'DD Mon') as date_label,
      COALESCE(SUM(so.total_amount), 0) as total_sales
    FROM generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, '1 day'::interval) as date_series
    LEFT JOIN public.sales_orders so ON DATE(so.created_at) = DATE(date_series) AND so.status = 'completed'
    GROUP BY date_series
    ORDER BY date_series ASC
  ) dataset;

  RETURN v_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FUNCTION: Get Sales Report (Detail with Date Range)
-- Returns Table structure, not JSON, for easier client pagination if needed.
-- But RPC usually returns JSON. Let's return SetOf Record or JSON.
-- For pagination simplicity in Next.js, let's just query table directly in Server Action?
-- Yes, standard SELECT * FROM sales_orders WHERE ... is better for simple filtering.
-- No need for RPC unless complex joining.
-- Sales Report needs: Order ID, Date, Customer Name, User (Cashier), Total, Payment Method.
-- Customer is relation. User is relation.
-- We'll do direct query in Server Action.

-- So we only need the valid Summary and Chart RPCs.
