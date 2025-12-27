-- =====================================================
-- LIVRO CAIXA - MIGRATION COMPLETA
-- Data: 27/12/2025
-- Descrição: Criação completa do banco de dados com políticas RLS
-- =====================================================

-- Limpar tabelas existentes (se houver)
DROP TABLE IF EXISTS vendas CASCADE;
DROP TABLE IF EXISTS retiradas CASCADE;
DROP TABLE IF EXISTS fechamentos CASCADE;
DROP TABLE IF EXISTS aberturas CASCADE;

-- =====================================================
-- TABELA: aberturas
-- Descrição: Registra as aberturas de caixa diárias
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

-- Índices para performance
CREATE INDEX idx_aberturas_user_id ON aberturas(user_id);
CREATE INDEX idx_aberturas_data ON aberturas(user_id, data DESC);
CREATE UNIQUE INDEX idx_aberturas_user_data ON aberturas(user_id, data);

-- =====================================================
-- TABELA: vendas
-- Descrição: Registra todas as vendas do dia
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

-- Índices para performance
CREATE INDEX idx_vendas_user_id ON vendas(user_id);
CREATE INDEX idx_vendas_abertura_id ON vendas(abertura_id);
CREATE INDEX idx_vendas_data ON vendas(user_id, data DESC);

-- =====================================================
-- TABELA: retiradas
-- Descrição: Registra todas as retiradas de caixa
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

-- Índices para performance
CREATE INDEX idx_retiradas_user_id ON retiradas(user_id);
CREATE INDEX idx_retiradas_abertura_id ON retiradas(abertura_id);
CREATE INDEX idx_retiradas_data ON retiradas(user_id, data DESC);

-- =====================================================
-- TABELA: fechamentos
-- Descrição: Registra os fechamentos de caixa com snapshot completo
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_fechamentos_user_id ON fechamentos(user_id);
CREATE INDEX idx_fechamentos_data ON fechamentos(user_id, data DESC);

-- =====================================================
-- TRIGGERS: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aberturas_updated_at BEFORE UPDATE ON aberturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retiradas_updated_at BEFORE UPDATE ON retiradas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fechamentos_updated_at BEFORE UPDATE ON fechamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE aberturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechamentos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: aberturas
-- =====================================================
CREATE POLICY "Usuários podem ver suas próprias aberturas"
  ON aberturas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias aberturas"
  ON aberturas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias aberturas"
  ON aberturas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias aberturas"
  ON aberturas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS RLS: vendas
-- =====================================================
CREATE POLICY "Usuários podem ver suas próprias vendas"
  ON vendas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias vendas"
  ON vendas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias vendas"
  ON vendas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias vendas"
  ON vendas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS RLS: retiradas
-- =====================================================
CREATE POLICY "Usuários podem ver suas próprias retiradas"
  ON retiradas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias retiradas"
  ON retiradas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias retiradas"
  ON retiradas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias retiradas"
  ON retiradas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS RLS: fechamentos
-- =====================================================
CREATE POLICY "Usuários podem ver seus próprios fechamentos"
  ON fechamentos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios fechamentos"
  ON fechamentos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios fechamentos"
  ON fechamentos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios fechamentos"
  ON fechamentos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================
COMMENT ON TABLE aberturas IS 'Registra as aberturas de caixa diárias com valor inicial';
COMMENT ON TABLE vendas IS 'Registra todas as vendas realizadas, vinculadas à abertura do dia';
COMMENT ON TABLE retiradas IS 'Registra todas as retiradas de caixa, vinculadas à abertura do dia';
COMMENT ON TABLE fechamentos IS 'Registra os fechamentos de caixa com snapshot completo das transações';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
