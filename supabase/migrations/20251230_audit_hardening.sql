-- =====================================================
-- DATABASE HARDENING & PERFORMANCE TUNING
-- Data: 30/12/2025
-- Autor: Senior Database Architect
-- =====================================================

-- 1. PERFORMANCE: Indices em Foreign Keys faltantes
-- Essencial para evitar Sequential Scans ao buscar fechamento de uma abertura
CREATE INDEX IF NOT EXISTS idx_fechamentos_abertura_id ON fechamentos(abertura_id);

-- Otimização para reabertura de caixa (busca pelo fechamento original)
CREATE INDEX IF NOT EXISTS idx_aberturas_fechamento_original_id ON aberturas(fechamento_original_id);


-- 2. SEGURANÇA: Reforço de Policies RLS (Update)
-- Garante que o usuário não possa alterar o user_id de um registro (transferência de posse)
-- Removemos e recriamos para garantir a cláusula WITH CHECK

-- Aberturas
DROP POLICY IF EXISTS "Users update own aberturas" ON aberturas;
CREATE POLICY "Users update own aberturas" ON aberturas FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Vendas
DROP POLICY IF EXISTS "Users update own vendas" ON vendas;
CREATE POLICY "Users update own vendas" ON vendas FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Retiradas
DROP POLICY IF EXISTS "Users update own retiradas" ON retiradas;
CREATE POLICY "Users update own retiradas" ON retiradas FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Fechamentos
DROP POLICY IF EXISTS "Users update own fechamentos" ON fechamentos;
CREATE POLICY "Users update own fechamentos" ON fechamentos FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);


-- 3. OBSERVAÇÕES
-- Estrutura geral está saudável (UUIDs, Numeric para valores monetários, Constraints de checagem).
-- As alterações acima previnem gargalos futuros e erros de permissão sutis.
