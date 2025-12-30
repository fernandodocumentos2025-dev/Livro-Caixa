-- =====================================================
-- LIVRO CAIXA - RECRIAÇÃO COMPLETA (ATUALIZADO)
-- Data: 30/12/2025
-- Descrição: Recria o banco do zero JÁ COM a coluna detalhe_especie
-- =====================================================

-- ⚠️ CUIDADO: ISSO APAGA TODOS OS DADOS EXISTENTES ⚠️
DROP TABLE IF EXISTS vendas CASCADE;
DROP TABLE IF EXISTS retiradas CASCADE;
DROP TABLE IF EXISTS fechamentos CASCADE;
DROP TABLE IF EXISTS aberturas CASCADE;

-- =====================================================
-- TABELA: aberturas
-- =====================================================
CREATE TABLE aberturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL,
  hora time NOT NULL,
  valor_abertura numeric(12, 2) NOT NULL CHECK (valor_abertura >= 0),
  fechamento_original_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_aberturas_user_id ON aberturas(user_id);
CREATE INDEX idx_aberturas_data ON aberturas(user_id, data DESC);
-- Removido UNIQUE INDEX para evitar travamentos de reabertura, controle via app

-- =====================================================
-- TABELA: vendas
-- =====================================================
CREATE TABLE vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  abertura_id uuid NOT NULL REFERENCES aberturas(id) ON DELETE CASCADE,
  produto text NOT NULL,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  preco_unitario numeric(12, 2) NOT NULL CHECK (preco_unitario >= 0),
  total numeric(12, 2) NOT NULL CHECK (total >= 0),
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('PIX', 'Dinheiro', 'Débito', 'Crédito')),
  hora time NOT NULL,
  data date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_vendas_user_id ON vendas(user_id);
CREATE INDEX idx_vendas_abertura_id ON vendas(abertura_id);
CREATE INDEX idx_vendas_data ON vendas(user_id, data DESC);

-- =====================================================
-- TABELA: retiradas
-- =====================================================
CREATE TABLE retiradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  abertura_id uuid NOT NULL REFERENCES aberturas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor numeric(12, 2) NOT NULL CHECK (valor > 0),
  hora time NOT NULL,
  data date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_retiradas_user_id ON retiradas(user_id);
CREATE INDEX idx_retiradas_abertura_id ON retiradas(abertura_id);
CREATE INDEX idx_retiradas_data ON retiradas(user_id, data DESC);

-- =====================================================
-- TABELA: fechamentos (ATUALIZADA)
-- =====================================================
CREATE TABLE fechamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  abertura_id uuid NULL REFERENCES aberturas(id) ON DELETE SET NULL,
  data date NOT NULL,
  hora time NOT NULL,
  total_vendas numeric(12, 2) NOT NULL DEFAULT 0,
  total_retiradas numeric(12, 2) NOT NULL DEFAULT 0,
  valor_abertura numeric(12, 2) NOT NULL DEFAULT 0,
  valor_contado numeric(12, 2) NOT NULL DEFAULT 0,
  saldo_esperado numeric(12, 2) NOT NULL DEFAULT 0,
  diferenca numeric(12, 2) NOT NULL DEFAULT 0,
  status text DEFAULT 'fechado' CHECK (status IN ('fechado', 'reaberto')),
  vendas jsonb DEFAULT '[]'::jsonb,
  retiradas jsonb DEFAULT '[]'::jsonb,
  detalhe_especie jsonb DEFAULT NULL, -- 🆕 COLUNA NOVA
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fechamentos_user_id ON fechamentos(user_id);
CREATE INDEX idx_fechamentos_data ON fechamentos(user_id, data DESC);

-- =====================================================
-- TRIGGERS: update_updated_at_column
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aberturas_updated_at BEFORE UPDATE ON aberturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_retiradas_updated_at BEFORE UPDATE ON retiradas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fechamentos_updated_at BEFORE UPDATE ON fechamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE aberturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechamentos ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS (Gerais para user_id = auth.uid())

-- Aberturas
CREATE POLICY "Users select own aberturas" ON aberturas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own aberturas" ON aberturas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own aberturas" ON aberturas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own aberturas" ON aberturas FOR DELETE USING (auth.uid() = user_id);

-- Vendas
CREATE POLICY "Users select own vendas" ON vendas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own vendas" ON vendas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own vendas" ON vendas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own vendas" ON vendas FOR DELETE USING (auth.uid() = user_id);

-- Retiradas
CREATE POLICY "Users select own retiradas" ON retiradas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own retiradas" ON retiradas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own retiradas" ON retiradas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own retiradas" ON retiradas FOR DELETE USING (auth.uid() = user_id);

-- Fechamentos
CREATE POLICY "Users select own fechamentos" ON fechamentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own fechamentos" ON fechamentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own fechamentos" ON fechamentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own fechamentos" ON fechamentos FOR DELETE USING (auth.uid() = user_id);
