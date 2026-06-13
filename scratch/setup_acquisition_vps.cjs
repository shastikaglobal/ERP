const db = require('../adms-sync/db.js');

async function run() {
  try {
    console.log("Setting up acquisition_channels table on VPS database...");
    
    // Create table using gen_random_uuid() instead of uuid_generate_v4()
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.acquisition_channels (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
          channel_name TEXT NOT NULL,
          avg_lead_cost DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `);
    
    // Add source_id to leads table if it doesn't exist
    await db.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='source_id') THEN
              ALTER TABLE public.leads ADD COLUMN source_id UUID REFERENCES public.acquisition_channels(id) ON DELETE SET NULL;
          END IF;
      END $$;
    `);

    // Seed some default channels if none exist
    const { rows: companies } = await db.query('SELECT id FROM companies LIMIT 1');
    const companyId = companies.length > 0 ? companies[0].id : '00000000-0000-0000-0000-00000000ae01';
    console.log("Using company ID for seed:", companyId);

    const channels = [
      'Corporate Website Inquiry',
      'Gulf Agri Expo UAE (Trade Fair)',
      'Partner Referrals',
      'LinkedIn Outbound BDE',
      'AgriMarketplace B2B'
    ];

    for (const channel of channels) {
      await db.query(`
        INSERT INTO public.acquisition_channels (company_id, channel_name, avg_lead_cost)
        SELECT $1, $2, 0.00
        WHERE NOT EXISTS (SELECT 1 FROM public.acquisition_channels WHERE channel_name = $2)
      `, [companyId, channel]);
    }

    console.log("acquisition_channels table setup complete!");
  } catch (err) {
    console.error("Error setting up acquisition_channels:", err);
  } finally {
    process.exit(0);
  }
}

run();
