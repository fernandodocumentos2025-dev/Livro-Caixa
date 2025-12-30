-- Migration: Add detailed cash breakdown column
-- Date: 2025-12-30
-- Author: Antigravity

ALTER TABLE fechamentos 
ADD COLUMN IF NOT EXISTS detalhe_especie jsonb;

-- Comment on column
COMMENT ON COLUMN fechamentos.detalhe_especie IS 'Stores the breakdown of cash into Notes and Coins (e.g. { "notas": 100, "moedas": 0.50 })';
