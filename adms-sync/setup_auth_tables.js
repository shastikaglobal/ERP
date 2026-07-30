const db = require('./db.js');

async function setup() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        reset_token_hash TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
    `);
    console.log("Auth tables created successfully.");
  } catch (err) {
    console.error("Error creating auth tables:", err);
  } finally {
    process.exit(0);
  }
}

setup();
