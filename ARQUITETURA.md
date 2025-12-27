# Arquitetura do Sistema - Livro Caixa

## Estrutura Atual

O projeto está configurado como **front-end puro** com dados mock (localStorage), preparado para futura integração com API externa (Supabase ou similar).

## Organização dos Arquivos

### Camada de Serviços (Services)

#### `src/services/authService.ts`
Serviço de autenticação mock que simula operações de login/cadastro.

**Funções disponíveis:**
- `signUp(email, password)` - Registrar novo usuário
- `signIn(email, password)` - Fazer login
- `signOut()` - Fazer logout
- `getCurrentUser()` - Obter usuário atual
- `onAuthStateChange(callback)` - Observar mudanças de autenticação

**Implementação atual:** Usa localStorage para persistir usuários e sessão.

**Para integrar API real:**
Substitua as implementações dessas funções por chamadas HTTP para sua API:
```typescript
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('https://sua-api.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  return { user: data.user, error: data.error };
}
```

#### `src/services/storageService.ts`
Serviço de persistência de dados mock que simula operações de banco de dados.

**Funções disponíveis:**
- `saveAbertura(abertura)` - Salvar abertura de caixa
- `getAberturaHoje(data)` - Buscar abertura do dia
- `saveVenda(venda, aberturaId)` - Salvar venda
- `getVendasByAbertura(aberturaId)` - Buscar vendas
- `updateVenda(id, venda)` - Atualizar venda
- `deleteVenda(id)` - Excluir venda
- `saveRetirada(retirada, aberturaId)` - Salvar retirada
- `getRetiradasByAbertura(aberturaId)` - Buscar retiradas
- `updateRetirada(id, retirada)` - Atualizar retirada
- `deleteRetirada(id)` - Excluir retirada
- `saveFechamento(fechamento, aberturaId)` - Salvar fechamento
- `getFechamentos()` - Buscar todos fechamentos
- `deleteFechamento(id)` - Excluir fechamento
- `clearDayData(aberturaId)` - Limpar dados do dia

**Implementação atual:** Usa localStorage para persistir dados separados por usuário.

**Para integrar API real:**
Substitua as implementações por chamadas HTTP:
```typescript
export async function saveVenda(venda: Venda, aberturaId: string): Promise<void> {
  const token = localStorage.getItem('auth_token');
  await fetch('https://sua-api.com/vendas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ...venda, abertura_id: aberturaId })
  });
}
```

### Camada de Abstração

#### `src/lib/storage.ts`
Camada intermediária entre os componentes e os serviços de storage.

**Objetivo:** Prover uma API consistente para os componentes, independente da implementação do storage.

**Características:**
- Mantém cache local para otimização
- Gerencia lógica de negócio (ex: reset diário)
- Abstrai detalhes de implementação

**Não é necessário modificar** este arquivo ao integrar a API. Apenas atualize os services.

#### `src/contexts/AuthContext.tsx`
Context do React para gerenciar estado de autenticação.

**Características:**
- Usa `authService` internamente
- Provê hooks React para componentes
- Mantém estado global do usuário

**Não é necessário modificar** este arquivo ao integrar a API. Apenas atualize o `authService`.

### Componentes e Páginas

Todos os componentes e páginas (`src/pages/*` e `src/components/*`) usam apenas:
- `useAuth()` hook para autenticação
- Funções de `src/lib/storage.ts` para dados

**Nenhuma modificação necessária** ao integrar API.

## Como Funciona Atualmente

### Autenticação
1. Usuário preenche email e senha na tela de login
2. `authService.signIn()` valida contra dados no localStorage
3. Se válido, salva sessão no localStorage
4. `AuthContext` atualiza estado global
5. Componentes reagem ao estado de autenticação

### Persistência de Dados
1. Dados são separados por `user_id` no localStorage
2. Cada operação verifica o usuário atual
3. Filtros aplicam `user_id` automaticamente
4. Limpeza automática ao fazer logout

### Fluxo de uma Venda
1. Usuário preenche formulário em `Vendas.tsx`
2. Componente chama `saveVenda()` de `storage.ts`
3. `storage.ts` obtém abertura atual e chama `storageService.saveVenda()`
4. `storageService` salva no localStorage
5. Cache é atualizado
6. Interface reflete mudança

## Preparação para Integração com Supabase

### Passo 1: Instalar Supabase Client
```bash
npm install @supabase/supabase-js
```

### Passo 2: Configurar Cliente Supabase
Crie `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Passo 3: Atualizar authService
Substitua funções mock por chamadas Supabase:
```typescript
import { supabase } from '../lib/supabase';

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  return {
    user: data.user ? {
      id: data.user.id,
      email: data.user.email,
      created_at: data.user.created_at
    } : null,
    error: error?.message || null
  };
}
```

### Passo 4: Atualizar storageService
Substitua localStorage por queries Supabase:
```typescript
import { supabase } from '../lib/supabase';

export async function saveVenda(venda: Venda, aberturaId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('vendas')
    .insert({
      id: venda.id,
      user_id: user.id,
      abertura_id: aberturaId,
      produto: venda.produto,
      quantidade: venda.quantidade,
      preco_unitario: venda.precoUnitario,
      total: venda.total,
      forma_pagamento: venda.formaPagamento,
      hora: venda.hora,
      data: venda.data
    });

  if (error) throw error;
}
```

### Passo 5: Criar Tabelas no Supabase
Execute as migrations SQL existentes em `supabase/migrations/`.

### Passo 6: Configurar Variáveis de Ambiente
Crie `.env`:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

## Vantagens desta Arquitetura

1. **Separação de Responsabilidades**
   - Services isolam lógica de integração
   - Componentes não conhecem detalhes de persistência
   - Fácil testar cada camada isoladamente

2. **Facilidade de Migração**
   - Apenas 2 arquivos precisam ser modificados (authService e storageService)
   - Componentes permanecem intactos
   - Transição gradual possível

3. **Desenvolvimento Local**
   - Funciona completamente offline
   - Sem necessidade de configurar banco durante desenvolvimento
   - Testes funcionais sem API

4. **Flexibilidade**
   - Fácil trocar de backend (Supabase, Firebase, API custom)
   - Possível usar diferentes strategies (cache, offline-first, etc)
   - Adaptável a requisitos futuros

## Estrutura de Pastas

```
src/
├── services/           # Camada de integração (mock ou API)
│   ├── authService.ts
│   └── storageService.ts
├── lib/               # Utilitários e abstrações
│   ├── storage.ts     # Abstração de storage com cache
│   └── export.ts      # Exportação de relatórios
├── contexts/          # Contexts React
│   └── AuthContext.tsx
├── pages/             # Páginas da aplicação
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Vendas.tsx
│   ├── Retiradas.tsx
│   ├── Fechamento.tsx
│   └── Historico.tsx
├── components/        # Componentes reutilizáveis
│   ├── Navigation.tsx
│   ├── VendaForm.tsx
│   ├── RetiradaForm.tsx
│   ├── FechamentoCard.tsx
│   └── ...
├── types/            # Definições TypeScript
│   └── index.ts
└── utils/            # Funções auxiliares
    ├── formatters.ts
    └── ...
```

## Checklist de Migração para API

- [ ] Instalar cliente da API (ex: @supabase/supabase-js)
- [ ] Criar arquivo de configuração da API
- [ ] Atualizar `authService.ts` com chamadas reais
- [ ] Atualizar `storageService.ts` com chamadas reais
- [ ] Criar/aplicar migrations no banco
- [ ] Configurar variáveis de ambiente
- [ ] Testar autenticação
- [ ] Testar CRUD de vendas
- [ ] Testar CRUD de retiradas
- [ ] Testar fechamentos
- [ ] Testar histórico
- [ ] Validar segurança (RLS, tokens, etc)
- [ ] Remover código mock se desejado

## Notas Importantes

- **Nenhuma tela foi alterada** - Todo layout e fluxo permanecem iguais
- **Sistema funciona completamente** - Todos os recursos estão operacionais com mock
- **Código pronto para produção** - Estrutura profissional e escalável
- **Fácil manutenção** - Código organizado e documentado
- **TypeScript** - Type-safety em toda aplicação
