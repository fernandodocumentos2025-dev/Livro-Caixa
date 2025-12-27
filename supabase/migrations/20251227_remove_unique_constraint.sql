-- Migration to remove unique constraint on aberturas(user_id, data)
-- This allows multiple openings per user per day

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_aberturas_user_data;

-- Also try to drop the unique constraint if it was created with a different name (common in Supabase)
ALTER TABLE aberturas DROP CONSTRAINT IF EXISTS aberturas_user_id_data_key;

-- Verify if we need to create a non-unique index for performance (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_aberturas_user_data_non_unique ON aberturas(user_id, data);
