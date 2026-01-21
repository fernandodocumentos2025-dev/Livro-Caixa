-- MIGRATION: SOFT DELETE SYSTEM (15 Days Retention)
-- Run this in Supabase SQL Editor

-- 1. Add 'deleted_at' column (Timestamp nullable)
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE retiradas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE fechamentos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE aberturas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create Indexes for Performance (Filtering IS NULL)
CREATE INDEX IF NOT EXISTS idx_vendas_deleted_at ON vendas(deleted_at);
CREATE INDEX IF NOT EXISTS idx_retiradas_deleted_at ON retiradas(deleted_at);
CREATE INDEX IF NOT EXISTS idx_fechamentos_deleted_at ON fechamentos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_aberturas_deleted_at ON aberturas(deleted_at);

-- 3. Enable RLS (Ensure it's on)
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aberturas ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: SELECT (Hide deleted items)
-- VENDAS
DROP POLICY IF EXISTS "View Active Vendas" ON vendas;
CREATE POLICY "View Active Vendas" ON vendas FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RETIRADAS
DROP POLICY IF EXISTS "View Active Retiradas" ON retiradas;
CREATE POLICY "View Active Retiradas" ON retiradas FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

-- FECHAMENTOS
DROP POLICY IF EXISTS "View Active Fechamentos" ON fechamentos;
CREATE POLICY "View Active Fechamentos" ON fechamentos FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

-- ABERTURAS
DROP POLICY IF EXISTS "View Active Aberturas" ON aberturas;
CREATE POLICY "View Active Aberturas" ON aberturas FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);


-- 5. RLS Policies: UPDATE (Allow Soft Delete) & DELETE (Block Hard Delete)

-- VENDAS
DROP POLICY IF EXISTS "Soft Delete Vendas" ON vendas;
CREATE POLICY "Soft Delete Vendas" ON vendas FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 

DROP POLICY IF EXISTS "Deny Hard Delete Vendas" ON vendas;
CREATE POLICY "Deny Hard Delete Vendas" ON vendas FOR DELETE
    USING (false);

-- RETIRADAS
DROP POLICY IF EXISTS "Soft Delete Retiradas" ON retiradas;
CREATE POLICY "Soft Delete Retiradas" ON retiradas FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Deny Hard Delete Retiradas" ON retiradas;
CREATE POLICY "Deny Hard Delete Retiradas" ON retiradas FOR DELETE USING (false);

-- FECHAMENTOS
DROP POLICY IF EXISTS "Soft Delete Fechamentos" ON fechamentos;
CREATE POLICY "Soft Delete Fechamentos" ON fechamentos FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Deny Hard Delete Fechamentos" ON fechamentos;
CREATE POLICY "Deny Hard Delete Fechamentos" ON fechamentos FOR DELETE USING (false);

-- ABERTURAS
DROP POLICY IF EXISTS "Soft Delete Aberturas" ON aberturas;
CREATE POLICY "Soft Delete Aberturas" ON aberturas FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Deny Hard Delete Aberturas" ON aberturas;
CREATE POLICY "Deny Hard Delete Aberturas" ON aberturas FOR DELETE USING (false);


-- 6. Cleanup Function (Hard Delete > 15 days)
CREATE OR REPLACE FUNCTION delete_expired_records() RETURNS void AS $$
BEGIN
    DELETE FROM vendas WHERE deleted_at IS NOT NULL AND deleted_at < (NOW() - INTERVAL '15 days');
    DELETE FROM retiradas WHERE deleted_at IS NOT NULL AND deleted_at < (NOW() - INTERVAL '15 days');
    DELETE FROM fechamentos WHERE deleted_at IS NOT NULL AND deleted_at < (NOW() - INTERVAL '15 days');
    DELETE FROM aberturas WHERE deleted_at IS NOT NULL AND deleted_at < (NOW() - INTERVAL '15 days');
END;
$$ LANGUAGE plpgsql;

-- 7. Schedule Job (If pg_cron is enabled)
-- SELECT cron.schedule('0 3 * * *', $$SELECT delete_expired_records()$$);
