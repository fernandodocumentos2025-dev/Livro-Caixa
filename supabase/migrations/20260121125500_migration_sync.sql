-- Migration: Add updated_at for Sync Consistency

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at to 'aberturas'
ALTER TABLE aberturas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS update_aberturas_updated_at ON aberturas;
CREATE TRIGGER update_aberturas_updated_at BEFORE UPDATE ON aberturas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add updated_at to 'fechamentos'
ALTER TABLE fechamentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS update_fechamentos_updated_at ON fechamentos;
CREATE TRIGGER update_fechamentos_updated_at BEFORE UPDATE ON fechamentos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add updated_at to 'vendas'
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS update_vendas_updated_at ON vendas;
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add updated_at to 'retiradas'
ALTER TABLE retiradas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DROP TRIGGER IF EXISTS update_retiradas_updated_at ON retiradas;
CREATE TRIGGER update_retiradas_updated_at BEFORE UPDATE ON retiradas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Ensure deleted_at indexes (optional but good for performance)
CREATE INDEX IF NOT EXISTS idx_aberturas_deleted_at ON aberturas(deleted_at);
CREATE INDEX IF NOT EXISTS idx_fechamentos_deleted_at ON fechamentos(deleted_at);
