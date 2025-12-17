-- FIX: Tambahkan kolom yang hilang dan update logic checkout
-- Silakan Run di Supabase SQL Editor

-- 1. Tambah kolom payment_method dan payment_status jika belum ada
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.sales_orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.sales_orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'paid';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- 2. Perbarui Function Checkout (Tambahkan Order Number Generator)
CREATE OR REPLACE FUNCTION public.handle_checkout(
  p_items JSONB,
  p_customer_id UUID,
  p_payment_method VARCHAR,
  p_amount_paid DECIMAL,
  p_notes TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number VARCHAR;
  v_total_amount DECIMAL := 0;
  v_item JSONB;
  v_product_id UUID;
  v_qty_needed INTEGER;
  v_price DECIMAL;
  v_batch RECORD;
  v_take INTEGER;
BEGIN
  -- Generate Order Number Unik
  v_order_number := 'TRX-' || TO_CHAR(NOW(), 'YYMMDDHH24MI') || '-' || UPPER(SUBSTRING(md5(random()::text), 1, 4));

  -- Hitung Total
  SELECT COALESCE(SUM((item->>'quantity')::int * (item->>'price')::decimal), 0)
  INTO v_total_amount
  FROM jsonb_array_elements(p_items) AS item;

  -- Insert Sales Order (Termasuk order_number dan payment columns)
  INSERT INTO public.sales_orders (
    order_number,
    user_id, customer_id, total_amount, payment_status, payment_method, status, notes
  ) VALUES (
    v_order_number,
    p_user_id, p_customer_id, v_total_amount, 'paid', p_payment_method, 'completed', p_notes
  ) RETURNING id INTO v_order_id;

  -- Loop Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty_needed := (v_item->>'quantity')::INTEGER;
    v_price := (v_item->>'price')::DECIMAL;

    INSERT INTO public.sales_order_lines (
      sales_order_id, product_id, quantity, unit_price, total_price
    ) VALUES (
      v_order_id, v_product_id, v_qty_needed, v_price, v_qty_needed * v_price
    );

    -- FEFO Logic (Stock Deduction)
    FOR v_batch IN 
      SELECT id, quantity, batch_number 
      FROM public.inventory 
      WHERE product_id = v_product_id AND quantity > 0
      ORDER BY expiry_date ASC, created_at ASC
    LOOP
      IF v_qty_needed <= 0 THEN EXIT; END IF;

      v_take := LEAST(v_batch.quantity, v_qty_needed);

      UPDATE public.inventory 
      SET quantity = quantity - v_take
      WHERE id = v_batch.id;

      INSERT INTO public.stock_movements (
        product_id, inventory_id, type, quantity, reference_type, reference_id, user_id, notes
      ) VALUES (
        v_product_id, v_batch.id, 'out', v_take, 'sales_order', v_order_id, p_user_id, 'Penjualan'
      );

      v_qty_needed := v_qty_needed - v_take;
    END LOOP;

    IF v_qty_needed > 0 THEN
      RAISE EXCEPTION 'Stok tidak cukup untuk Product ID %', v_product_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
