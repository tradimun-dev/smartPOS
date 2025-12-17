import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const connectionString = process.env.SUPABASE_DB_URI;

if (!connectionString) {
  console.error('SUPABASE_DB_URI is undefined. Check .env.local');
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  console.log('Connecting to database...');
  await client.connect();
  
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying schema...');
    await client.query(schemaSql);
    console.log('Schema applied.');
    
    // Seed Data
    console.log('Seeding initial data...');
    
    // Categories
    await client.query(`
      INSERT INTO public.categories (name, description) VALUES
      ('Herbal', 'Produk herbal tradisional'),
      ('Suplemen', 'Suplemen kesehatan harian'),
      ('Bahan Baku', 'Raw material jamu')
      ON CONFLICT DO NOTHING;
    `);
    
    // Sample Product
    const catRes = await client.query("SELECT id FROM public.categories WHERE name='Herbal' LIMIT 1");
    if (catRes.rows.length > 0) {
        const catId = catRes.rows[0].id;
        
        // Insert Product
        const prodRes = await client.query(`
            INSERT INTO public.products (sku, name, barcode, category_id, unit, min_stock) 
            VALUES ('HBL-001', 'Temulawak Gold 500mg', '8991234567890', $1, 'botol', 10)
            ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `, [catId]);
        
        const prodId = prodRes.rows[0].id;

        // Insert Prices
        await client.query(`
            INSERT INTO public.product_prices (product_id, customer_type, price)
            VALUES 
            ($1, 'retail', 75000),
            ($1, 'apotek', 65000),
            ($1, 'distributor', 55000)
            ON CONFLICT (product_id, customer_type) DO NOTHING;
        `, [prodId]);
        
        // Insert Inventory (Initial Batch)
        await client.query(`
            INSERT INTO public.inventory (product_id, batch_number, expiry_date, quantity)
            VALUES ($1, 'BATCH-001', '2026-12-31', 100)
             -- Simple check to avoid tons of dupes if run multiple times, 
             -- but inventory table doesn't have unique constraint on batch. 
             -- We'll skip complex check for now.
        `, [prodId]);
    }

    console.log('Seeding complete.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
