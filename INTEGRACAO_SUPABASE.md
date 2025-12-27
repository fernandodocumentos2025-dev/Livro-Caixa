# Guia de Integração com Supabase

Este documento mostra exatamente como integrar o projeto com Supabase quando decidir migrar do mock para uma API real.

## Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Credenciais (URL e Anon Key)

## Passo 1: Instalar Cliente Supabase

```bash
npm install @supabase/supabase-js
```

## Passo 2: Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica
```

## Passo 3: Criar Cliente Supabase

Crie o arquivo `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

## Passo 4: Criar Banco de Dados

Execute este SQL no Supabase SQL Editor:

```sql
-- Tabela de aberturas
CREATE TABLE IF NOT EXISTS aberturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  data text NOT NULL,
  hora text NOT NULL,
  valor_abertura numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  abertura_id uuid REFERENCES aberturas(id),
  produto text NOT NULL,
  quantidade numeric NOT NULL,
  preco_unitario numeric NOT NULL,
  total numeric NOT NULL,
  forma_pagamento text NOT NULL,
  hora text NOT NULL,
  data text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de retiradas
CREATE TABLE IF NOT EXISTS retiradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  abertura_id uuid REFERENCES aberturas(id),
  descricao text NOT NULL,
  valor numeric NOT NULL,
  hora text NOT NULL,
  data text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de fechamentos
CREATE TABLE IF NOT EXISTS fechamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  abertura_id uuid REFERENCES aberturas(id),
  data text NOT NULL,
  hora text NOT NULL,
  total_vendas numeric NOT NULL,
  total_retiradas numeric NOT NULL,
  valor_abertura numeric NOT NULL,
  valor_contado numeric NOT NULL,
  saldo_esperado numeric NOT NULL,
  diferenca numeric NOT NULL,
  status text DEFAULT 'fechado',
  vendas jsonb NOT NULL,
  retiradas jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS aberturas_user_id_idx ON aberturas(user_id);
CREATE INDEX IF NOT EXISTS aberturas_data_idx ON aberturas(data);
CREATE INDEX IF NOT EXISTS vendas_user_id_idx ON vendas(user_id);
CREATE INDEX IF NOT EXISTS vendas_abertura_id_idx ON vendas(abertura_id);
CREATE INDEX IF NOT EXISTS retiradas_user_id_idx ON retiradas(user_id);
CREATE INDEX IF NOT EXISTS retiradas_abertura_id_idx ON retiradas(abertura_id);
CREATE INDEX IF NOT EXISTS fechamentos_user_id_idx ON fechamentos(user_id);

-- Habilitar RLS em todas tabelas
ALTER TABLE aberturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para aberturas
CREATE POLICY "Users can view own aberturas"
  ON aberturas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own aberturas"
  ON aberturas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own aberturas"
  ON aberturas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas de segurança para vendas
CREATE POLICY "Users can view own vendas"
  ON vendas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendas"
  ON vendas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendas"
  ON vendas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendas"
  ON vendas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas de segurança para retiradas
CREATE POLICY "Users can view own retiradas"
  ON retiradas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retiradas"
  ON retiradas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retiradas"
  ON retiradas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own retiradas"
  ON retiradas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas de segurança para fechamentos
CREATE POLICY "Users can view own fechamentos"
  ON fechamentos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fechamentos"
  ON fechamentos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fechamentos"
  ON fechamentos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fechamentos"
  ON fechamentos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## Passo 5: Atualizar authService.ts

Substitua o conteúdo de `src/services/authService.ts`:

```typescript
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    user: data.user ? {
      id: data.user.id,
      email: data.user.email || '',
      created_at: data.user.created_at,
    } : null,
    error: error?.message || null,
  };
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user ? {
      id: data.user.id,
      email: data.user.email || '',
      created_at: data.user.created_at,
    } : null,
    error: error?.message || null,
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email || '',
    created_at: user.created_at,
  };
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    callback(user ? {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
    } : null);
  });

  return () => subscription.unsubscribe();
}
```

## Passo 6: Atualizar storageService.ts

Substitua o conteúdo de `src/services/storageService.ts`:

```typescript
import { supabase } from '../lib/supabase';
import { Venda, Retirada, Fechamento, Abertura } from '../types';

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  return user.id;
}

export async function saveAbertura(abertura: Abertura): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('aberturas').insert({
    id: abertura.id,
    user_id: userId,
    data: abertura.data,
    hora: abertura.hora,
    valor_abertura: abertura.valorAbertura,
  });

  if (error) throw error;
}

export async function getAberturaHoje(data: string): Promise<Abertura | null> {
  const userId = await getUserId();

  const { data: result, error } = await supabase
    .from('aberturas')
    .select('*')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();

  if (error) throw error;
  if (!result) return null;

  return {
    id: result.id,
    data: result.data,
    hora: result.hora,
    valorAbertura: Number(result.valor_abertura),
  };
}

export async function saveVenda(venda: Venda, aberturaId: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('vendas').insert({
    id: venda.id,
    user_id: userId,
    abertura_id: aberturaId,
    produto: venda.produto,
    quantidade: venda.quantidade,
    preco_unitario: venda.precoUnitario,
    total: venda.total,
    forma_pagamento: venda.formaPagamento,
    hora: venda.hora,
    data: venda.data,
  });

  if (error) throw error;
}

export async function getVendasByAbertura(aberturaId: string): Promise<Venda[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(v => ({
    id: v.id,
    produto: v.produto,
    quantidade: Number(v.quantidade),
    precoUnitario: Number(v.preco_unitario),
    total: Number(v.total),
    formaPagamento: v.forma_pagamento,
    hora: v.hora,
    data: v.data,
  }));
}

export async function updateVenda(id: string, updatedVenda: Venda): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('vendas')
    .update({
      produto: updatedVenda.produto,
      quantidade: updatedVenda.quantidade,
      preco_unitario: updatedVenda.precoUnitario,
      total: updatedVenda.total,
      forma_pagamento: updatedVenda.formaPagamento,
      hora: updatedVenda.hora,
      data: updatedVenda.data,
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteVenda(id: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('vendas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function saveRetirada(retirada: Retirada, aberturaId: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('retiradas').insert({
    id: retirada.id,
    user_id: userId,
    abertura_id: aberturaId,
    descricao: retirada.descricao,
    valor: retirada.valor,
    hora: retirada.hora,
    data: retirada.data,
  });

  if (error) throw error;
}

export async function getRetiradasByAbertura(aberturaId: string): Promise<Retirada[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('retiradas')
    .select('*')
    .eq('user_id', userId)
    .eq('abertura_id', aberturaId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(r => ({
    id: r.id,
    descricao: r.descricao,
    valor: Number(r.valor),
    hora: r.hora,
    data: r.data,
  }));
}

export async function updateRetirada(id: string, updatedRetirada: Retirada): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('retiradas')
    .update({
      descricao: updatedRetirada.descricao,
      valor: updatedRetirada.valor,
      hora: updatedRetirada.hora,
      data: updatedRetirada.data,
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteRetirada(id: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('retiradas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function saveFechamento(fechamento: Fechamento, aberturaId: string | null): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('fechamentos').insert({
    id: fechamento.id,
    user_id: userId,
    abertura_id: aberturaId,
    data: fechamento.data,
    hora: fechamento.hora,
    total_vendas: fechamento.totalVendas,
    total_retiradas: fechamento.totalRetiradas,
    valor_abertura: fechamento.valorAbertura,
    valor_contado: fechamento.valorContado,
    saldo_esperado: fechamento.saldoEsperado,
    diferenca: fechamento.diferenca,
    status: fechamento.status || 'fechado',
    vendas: fechamento.vendas,
    retiradas: fechamento.retiradas,
  });

  if (error) throw error;
}

export async function getFechamentos(): Promise<Fechamento[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('fechamentos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(f => ({
    id: f.id,
    data: f.data,
    hora: f.hora,
    totalVendas: Number(f.total_vendas),
    totalRetiradas: Number(f.total_retiradas),
    valorAbertura: Number(f.valor_abertura),
    valorContado: Number(f.valor_contado),
    saldoEsperado: Number(f.saldo_esperado),
    diferenca: Number(f.diferenca),
    vendas: f.vendas as Venda[],
    retiradas: f.retiradas as Retirada[],
    status: f.status as 'fechado' | 'reaberto',
  }));
}

export async function deleteFechamento(id: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('fechamentos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function clearDayData(aberturaId: string): Promise<void> {
  const userId = await getUserId();

  await supabase.from('vendas').delete().eq('abertura_id', aberturaId).eq('user_id', userId);
  await supabase.from('retiradas').delete().eq('abertura_id', aberturaId).eq('user_id', userId);
  await supabase.from('aberturas').delete().eq('id', aberturaId).eq('user_id', userId);
}
```

## Passo 7: Testar

1. Execute o projeto: `npm run dev`
2. Crie uma nova conta
3. Faça login
4. Teste todas funcionalidades
5. Verifique os dados no Supabase Dashboard

## Pronto!

Agora seu sistema está integrado com Supabase e os dados são persistidos na nuvem!

## Benefícios da Integração

- Dados na nuvem
- Acesso de múltiplos dispositivos
- Backup automático
- Escalabilidade
- Segurança com RLS
- Autenticação robusta

## Observações

- Nenhum outro arquivo precisa ser modificado
- Componentes e páginas permanecem iguais
- Mesma experiência do usuário
- Transição transparente
