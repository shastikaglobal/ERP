const db = require('./db');

async function migrate() {
  try {
    console.log('Starting farmer tables migration...');

    // commitments
    await db.query(`
      CREATE TABLE IF NOT EXISTS commitments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        crop VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pending',
        quantity NUMERIC(10,2),
        price_per_unit NUMERIC(10,2),
        delivery_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);

    // collections
    await db.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        crop VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pending',
        quantity_collected NUMERIC(10,2),
        quality_grade VARCHAR(50),
        collection_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);

    // payouts
    await db.query(`
      CREATE TABLE IF NOT EXISTS payouts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        amount NUMERIC(12,2),
        status VARCHAR(50) DEFAULT 'Pending',
        payout_date DATE,
        reference_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);

    // contract_farming (if missing or incomplete)
    await db.query(`
      CREATE TABLE IF NOT EXISTS contract_farming (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        crop VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        start_date DATE,
        end_date DATE,
        terms TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);

    // farm_visits
    await db.query(`
      CREATE TABLE IF NOT EXISTS farm_visits (
        id VARCHAR(50) PRIMARY KEY, -- the frontend generates ID like "v-12345"
        farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'Scheduled',
        purpose VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);

    // farmer_ratings
    await db.query(`
      CREATE TABLE IF NOT EXISTS farmer_ratings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        score INTEGER CHECK (score >= 1 AND score <= 5),
        review TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);

    // farmer_documents
    await db.query(`
      CREATE TABLE IF NOT EXISTS farmer_documents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        doc_name VARCHAR(255),
        doc_type VARCHAR(100),
        url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);

    // farmer_support
    await db.query(`
      CREATE TABLE IF NOT EXISTS farmer_support (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        issue TEXT,
        status VARCHAR(50) DEFAULT 'Open',
        resolution TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID
      );
    `);

    console.log('Successfully migrated farmer tables!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    setTimeout(() => process.exit(0), 1000);
  }
}

migrate();
