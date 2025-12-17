-- FUNCTION: Handle Goods Receipt (Barang Masuk)
CREATE OR REPLACE FUNCTION public.handle_goods_receipt(
  p_product_id UUID,
  p_batch_number VARCHAR,
  p_expiry_date DATE,
  p_quantity INTEGER,
  p_notes TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_inventory_id UUID;
  v_new_quantity INTEGER;
BEGIN
  -- 1. Cek apakah batch sudah ada untuk produk ini
  SELECT id INTO v_inventory_id
  FROM public.inventory
  WHERE product_id = p_product_id AND batch_number = p_batch_number
  LIMIT 1;

  IF v_inventory_id IS NOT NULL THEN
    -- Update existing batch
    UPDATE public.inventory
    SET quantity = quantity + p_quantity
    WHERE id = v_inventory_id
    RETURNING quantity INTO v_new_quantity;
  ELSE
    -- Insert new batch
    INSERT INTO public.inventory (product_id, batch_number, expiry_date, quantity)
    VALUES (p_product_id, p_batch_number, p_expiry_date, p_quantity)
    RETURNING id, quantity INTO v_inventory_id, v_new_quantity;
  END IF;

  -- 2. Log movement
  INSERT INTO public.stock_movements (
    product_id, inventory_id, type, quantity, reference_type, notes, user_id
  ) VALUES (
    p_product_id, v_inventory_id, 'in', p_quantity, 'goods_receipt', p_notes, p_user_id
  );

  RETURN jsonb_build_object('success', true, 'inventory_id', v_inventory_id, 'new_quantity', v_new_quantity);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FUNCTION: Handle Stock Adjustment (Koreksi Stok)
CREATE OR REPLACE FUNCTION public.handle_stock_adjustment(
  p_inventory_id UUID,
  p_delta_quantity INTEGER, -- Bisa positif (tambah) atau negatif (kurang)
  p_notes TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_product_id UUID;
BEGIN
  -- Ambil data inventory saat ini
  SELECT quantity, product_id INTO v_current_quantity, v_product_id
  FROM public.inventory
  WHERE id = p_inventory_id;

  IF v_current_quantity IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Inventory ID tidak ditemukan');
  END IF;

  v_new_quantity := v_current_quantity + p_delta_quantity;

  IF v_new_quantity < 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Stok tidak boleh negatif');
  END IF;

  -- Update stok
  UPDATE public.inventory
  SET quantity = v_new_quantity
  WHERE id = p_inventory_id;

  -- Log movement
  INSERT INTO public.stock_movements (
    product_id, inventory_id, type, quantity, reference_type, notes, user_id
  ) VALUES (
    v_product_id, p_inventory_id, 'adjustment', p_delta_quantity, 'stock_adjustment', p_notes, p_user_id
  );

  RETURN jsonb_build_object('success', true, 'new_quantity', v_new_quantity);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
