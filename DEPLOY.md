# Guia de Deploy - Livro Caixa

## Estrutura Criada

O projeto agora possui a estrutura mínima necessária para versionamento e deploy:

- `.env.example` - Template de variáveis de ambiente
- `.gitignore` - Configurado para ignorar arquivos sensíveis
- `vercel.json` - Configuração básica para deploy na Vercel

## Deploy na Vercel

### Pré-requisitos

1. Conta no GitHub
2. Conta na Vercel
3. Conta no Supabase (quando integrar com API real)

### Passo 1: Preparar Repositório GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### Passo 2: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe seu repositório do GitHub
4. Vercel detectará automaticamente que é um projeto Vite
5. Clique em "Deploy"

### Passo 3: Configurar Variáveis de Ambiente (quando integrar Supabase)

Quando você integrar o Supabase seguindo o guia em `INTEGRACAO_SUPABASE.md`:

1. No painel da Vercel, vá em "Settings" > "Environment Variables"
2. Adicione as seguintes variáveis:
   - `VITE_SUPABASE_URL`: Sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY`: Sua chave anônima do Supabase

### Passo 4: Redeploy

Após adicionar as variáveis de ambiente:
1. Vá em "Deployments"
2. Clique nos três pontos do último deployment
3. Selecione "Redeploy"

## Estado Atual

**O projeto funciona 100% com dados mock (localStorage) e não requer configuração de variáveis de ambiente.**

Para integração futura com Supabase, consulte o arquivo `INTEGRACAO_SUPABASE.md`.

## Estrutura de Arquivos

```
.
├── .env.example          # Template de variáveis (não commitado)
├── .gitignore            # Ignora .env e arquivos sensíveis
├── vercel.json           # Configuração da Vercel
├── package.json          # Dependências e scripts
├── vite.config.ts        # Configuração do Vite
└── src/                  # Código fonte
```

## Build Local

Para testar o build localmente:

```bash
npm run build
npm run preview
```

## Notas Importantes

- O arquivo `.env` nunca deve ser commitado (já está no `.gitignore`)
- Use `.env.example` como referência para criar seu `.env` local
- Todos os deploys automáticos são acionados por push na branch `main`
- A Vercel faz build e deploy automaticamente a cada commit
