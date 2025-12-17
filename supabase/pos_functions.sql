-- Type helper untuk item checkout
CREATE TYPE public.checkout_item AS (
  product_id UUID,
  quantity INTEGER,
  price DECIMAL
);

-- FUNCTION: Handle Checkout (Transaksi Kasir)
CREATE OR REPLACE FUNCTION public.handle_checkout(
  p_items JSONB, -- Array of {product_id, quantity, price}
  p_customer_id UUID,
  p_payment_method VARCHAR,
  p_amount_paid DECIMAL,
  p_notes TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_total_amount DECIMAL := 0;
  v_item JSONB;
  v_product_id UUID;
  v_qty_needed INTEGER;
  v_price DECIMAL;
  v_batch RECORD;
  v_take INTEGER;
BEGIN
  -- 1. Hitung Total Amount & Buat Sales Order
  -- (Idealnya hitung dulu total dari items, tapi untuk simplifikasi kita percaya input price client, 
  -- production grade harus re-fetch price dari DB)
  
  SELECT COALESCE(SUM((item->>'quantity')::int * (item->>'price')::decimal), 0)
  INTO v_total_amount
  FROM jsonb_array_elements(p_items) AS item;

  INSERT INTO public.sales_orders (
    user_id, customer_id, total_amount, payment_status, payment_method, status, notes
  ) VALUES (
    p_user_id, p_customer_id, v_total_amount, 'paid', p_payment_method, 'completed', p_notes
  ) RETURNING id INTO v_order_id;

  -- 2. Loop setiap item belanjaan
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty_needed := (v_item->>'quantity')::INTEGER;
    v_price := (v_item->>'price')::DECIMAL;

    -- Simpan ke Table Detail Order (Line Item) sementara (tanpa batch info spesifik jika multiple batch,
    -- atau kita bisa pecah. Untuk MVP kita simpan total qty per produk di line item).
    INSERT INTO public.sales_order_lines (
      sales_order_id, product_id, quantity, unit_price, total_price
    ) VALUES (
      v_order_id, v_product_id, v_qty_needed, v_price, v_qty_needed * v_price
    );

    -- 3. Kurangi Stok dengan metode FEFO (First Expired First Out)
    FOR v_batch IN 
      SELECT id, quantity, batch_number 
      FROM public.inventory 
      WHERE product_id = v_product_id AND quantity > 0
      ORDER BY expiry_date ASC, created_at ASC
    LOOP
      IF v_qty_needed <= 0 THEN
        EXIT; -- Selesai untuk produk ini
      END IF;

      -- Ambil sebanyak yang ada atau yang dibutuhkan
      v_take := LEAST(v_batch.quantity, v_qty_needed);

      -- Update Inventory
      UPDATE public.inventory 
      SET quantity = quantity - v_take
      WHERE id = v_batch.id;

      -- Log Movement (Out)
      INSERT INTO public.stock_movements (
        product_id, inventory_id, type, quantity, reference_type, reference_id, user_id, notes
      ) VALUES (
        v_product_id, v_batch.id, 'out', v_take, 'sales_order', v_order_id, p_user_id, 'Penjualan'
      );

      v_qty_needed := v_qty_needed - v_take;
    END LOOP;

    -- 4. Validasi Stok Cukup
    IF v_qty_needed > 0 THEN
      RAISE EXCEPTION 'Stok tidak cukup untuk Product ID % (Kurang % item)', v_product_id, v_qty_needed;
    END IF;

  END LOOP;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'total_amount', v_total_amount);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
