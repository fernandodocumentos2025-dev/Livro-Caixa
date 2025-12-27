/*
  # Criação do Sistema Livro Caixa

  1. Novas Tabelas
    - `aberturas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para auth.users)
      - `data` (text, formato DD/MM/YYYY)
      - `hora` (text, formato HH:MM)
      - `valor_abertura` (numeric, valor inicial do caixa)
      - `created_at` (timestamptz, timestamp de criação)
    
    - `vendas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para auth.users)
      - `abertura_id` (uuid, referência para aberturas)
      - `produto` (text, nome do produto)
      - `quantidade` (numeric, quantidade vendida)
      - `preco_unitario` (numeric, preço por unidade)
      - `total` (numeric, valor total da venda)
      - `forma_pagamento` (text, PIX/Dinheiro/Débito/Crédito)
      - `hora` (text, horário da venda)
      - `data` (text, data da venda)
      - `created_at` (timestamptz, timestamp de criação)
    
    - `retiradas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para auth.users)
      - `abertura_id` (uuid, referência para aberturas)
      - `descricao` (text, descrição da retirada)
      - `valor` (numeric, valor retirado)
      - `hora` (text, horário da retirada)
      - `data` (text, data da retirada)
      - `created_at` (timestamptz, timestamp de criação)
    
    - `fechamentos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para auth.users)
      - `abertura_id` (uuid, referência para aberturas)
      - `data` (text, data do fechamento)
      - `hora` (text, horário do fechamento)
      - `total_vendas` (numeric, soma das vendas)
      - `total_retiradas` (numeric, soma das retiradas)
      - `valor_abertura` (numeric, valor de abertura do caixa)
      - `valor_contado` (numeric, valor contado no fechamento)
      - `saldo_esperado` (numeric, saldo calculado)
      - `diferenca` (numeric, diferença entre contado e esperado)
      - `status` (text, fechado/reaberto)
      - `vendas` (jsonb, snapshot das vendas)
      - `retiradas` (jsonb, snapshot das retiradas)
      - `created_at` (timestamptz, timestamp de criação)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados acessarem apenas seus próprios dados
    - SELECT: usuário pode ver apenas seus registros
    - INSERT: usuário pode criar registros para si mesmo
    - UPDATE: usuário pode atualizar apenas seus registros
    - DELETE: usuário pode deletar apenas seus registros

  3. Notas Importantes
    - user_id é obrigatório em todas as tabelas para isolamento de dados
    - Vendas e retiradas são linkadas à abertura do dia
    - Fechamentos armazenam snapshot completo em JSONB
    - Formato de data mantido como texto para compatibilidade com código existente
*/

-- Criar tabela de aberturas
CREATE TABLE IF NOT EXISTS aberturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data text NOT NULL,
  hora text NOT NULL,
  valor_abertura numeric NOT NULL CHECK (valor_abertura >= 0),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  abertura_id uuid REFERENCES aberturas(id) ON DELETE CASCADE NOT NULL,
  produto text NOT NULL,
  quantidade numeric NOT NULL CHECK (quantidade > 0),
  preco_unitario numeric NOT NULL CHECK (preco_unitario >= 0),
  total numeric NOT NULL CHECK (total >= 0),
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('PIX', 'Dinheiro', 'Débito', 'Crédito')),
  hora text NOT NULL,
  data text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de retiradas
CREATE TABLE IF NOT EXISTS retiradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  abertura_id uuid REFERENCES aberturas(id) ON DELETE CASCADE NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0),
  hora text NOT NULL,
  data text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de fechamentos
CREATE TABLE IF NOT EXISTS fechamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  abertura_id uuid REFERENCES aberturas(id) ON DELETE SET NULL,
  data text NOT NULL,
  hora text NOT NULL,
  total_vendas numeric NOT NULL DEFAULT 0,
  total_retiradas numeric NOT NULL DEFAULT 0,
  valor_abertura numeric NOT NULL DEFAULT 0,
  valor_contado numeric NOT NULL DEFAULT 0,
  saldo_esperado numeric NOT NULL DEFAULT 0,
  diferenca numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'fechado' CHECK (status IN ('fechado', 'reaberto')),
  vendas jsonb DEFAULT '[]'::jsonb,
  retiradas jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_aberturas_user_id ON aberturas(user_id);
CREATE INDEX IF NOT EXISTS idx_aberturas_data ON aberturas(user_id, data);
CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON vendas(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_abertura_id ON vendas(abertura_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(user_id, data);
CREATE INDEX IF NOT EXISTS idx_retiradas_user_id ON retiradas(user_id);
CREATE INDEX IF NOT EXISTS idx_retiradas_abertura_id ON retiradas(abertura_id);
CREATE INDEX IF NOT EXISTS idx_retiradas_data ON retiradas(user_id, data);
CREATE INDEX IF NOT EXISTS idx_fechamentos_user_id ON fechamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_fechamentos_data ON fechamentos(user_id, data DESC);

-- Habilitar RLS
ALTER TABLE aberturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para ABERTURAS
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

-- Políticas para VENDAS
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

-- Políticas para RETIRADAS
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

-- Políticas para FECHAMENTOS
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