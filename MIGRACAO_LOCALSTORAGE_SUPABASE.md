# Plano de Migração: localStorage → Supabase

## Objetivo
Remover completamente o uso de localStorage e fazer do Supabase a única fonte de dados persistentes, mantendo o comportamento do app intacto.

## Status das Tabelas no Supabase
✅ Todas as tabelas já existem com RLS habilitado:
- `aberturas` (user_id, data, hora, valor_abertura)
- `vendas` (user_id, abertura_id, produto, quantidade, preço, forma_pagamento)
- `retiradas` (user_id, abertura_id, descrição, valor)
- `fechamentos` (user_id, abertura_id, totais, status, vendas/retiradas como JSONB)

Auth users já integrado com `auth.users` (Supabase Auth)

## O que será removido

### 1. localStorage keys
```
- livro_caixa_mock_aberturas
- livro_caixa_mock_vendas
- livro_caixa_mock_retiradas
- livro_caixa_mock_fechamentos
- livro_caixa_mock_user
- livro_caixa_mock_users
```

### 2. Arquivos/código a ser substituído
- `src/services/authService.ts` - Usar Supabase Auth nativamente
- `src/services/storageService.ts` - Usar Supabase client para CRUD
- `src/lib/storage.ts` - Atualizar para usar novo storageService com Supabase

### 3. Dados que sairão de localStorage
- Usuário autenticado → Supabase Auth session
- Lista de usuários → Supabase Auth (users)
- Aberturas → Tabela `aberturas`
- Vendas → Tabela `vendas`
- Retiradas → Tabela `retiradas`
- Fechamentos → Tabela `fechamentos`

## O que será criado/adicionado

### 1. Cliente Supabase (`src/lib/supabaseClient.ts`)
- Singleton com inicialização via `.env`
- Tipos TypeScript (gerados ou manuais)

### 2. Novos serviços
- `src/services/supabaseAuthService.ts` - Auth com Supabase Auth
- `src/services/supabaseStorageService.ts` - CRUD com Supabase

### 3. Hooks para estado
- Manter hooks existentes de loading/state
- Sem mudança no comportamento visual

## Mapeamento de mudanças por arquivo

### `src/services/authService.ts`
**Antes:**
- Salva user em `localStorage['livro_caixa_mock_user']`
- Salva lista de users em `localStorage['livro_caixa_mock_users']`
- Sign up: cria usuário em memória
- Sign in: valida contra localStorage

**Depois:**
- Usa `supabase.auth.signUp()` nativo
- Usa `supabase.auth.signInWithPassword()` nativo
- Usa `supabase.auth.signOut()` nativo
- Sessão vem de `supabase.auth.getSession()`
- Listener: `supabase.auth.onAuthStateChange()`

### `src/services/storageService.ts`
**Antes:**
- Lê/escreve arrays em localStorage
- Filtra por user_id e datas manualmente
- Simula latência com setTimeout

**Depois:**
- Usa `supabase.from('aberturas').select()`, `.insert()`, `.update()`, `.delete()`
- Idem para vendas, retiradas, fechamentos
- Filtra com `.eq('user_id', userId)`, `.eq('abertura_id', id)` etc
- Sem setTimeout (real latência do Supabase)

### `src/lib/storage.ts`
**Antes:**
- Cache em memória (aberturaCache, vendasCache)
- Chama `storageService` com localStorage

**Depois:**
- Mantém cache em memória (otimização)
- Chama novo `storageService` com Supabase
- Mesmo comportamento visual

## Arquivos que NÃO mudarão
- Pages (Vendas, Retiradas, Fechamento, Historico, Dashboard, Auth)
- Components (formulários, cards, navigation)
- Hooks (useMonetaryInput, useAppReady)
- Utils (formatters, validators)
- Contexts (AuthContext - usa authService)
- Types (interfaces permanecem iguais)

## Ordem de implementação

1. ✅ Criar cliente Supabase singleton
2. ✅ Atualizar authService para usar Supabase Auth
3. ✅ Atualizar storageService para usar Supabase
4. ✅ Limpar localStorage (remover setups de mock)
5. ✅ Testar build e fluxo

## Testes pós-migração

- [x] Build com sucesso
- [ ] Login/Logout funciona
- [ ] Abrir caixa persiste no Supabase
- [ ] Venda registrada no Supabase
- [ ] Retirada registrada no Supabase
- [ ] Fechamento salvo e recuperado
- [ ] Multiusuário isolado corretamente
- [ ] Histórico recupera dados do Supabase

## Benefícios

- ✅ Dados sincronizados entre abas/dispositivos
- ✅ Multiusuário 100% isolado
- ✅ Sem localStorage (sem limite de tamanho)
- ✅ Backup automático
- ✅ RLS garante segurança
- ✅ Mesma UX/comportamento
