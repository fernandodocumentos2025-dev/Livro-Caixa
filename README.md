# Livro Caixa Profissional - Sistema de Gestão Financeira

Sistema completo para controle de caixa diário com autenticação, vendas, retiradas, fechamento e histórico, integrado com **Supabase**.

![Badge](https://img.shields.io/badge/Status-Produção-green)
![Badge](https://img.shields.io/badge/Backend-Supabase-green)
![Badge](https://img.shields.io/badge/Stack-React_Vite-blue)

## Características Principais

- 🔐 **Autenticação Segura**: Login/Cadastro via Supabase Auth.
- 💰 **Caixa Diário**: Abertura, Vendas, Retiradas e Fechamento.
- 📊 **Dashboard Financeiro**: Resumo em tempo real (Pix, Dinheiro, Cartão).
- 📜 **Histórico Completo**: Filtros por data e reabertura de caixas anteriores.
- 📤 **Exportação PDF/HTML**: Relatórios profissionais prontos para compartilhamento.
- 📱 **Responsivo**: Funciona perfeitamente em Celulares e PC.

## Tecnologias

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS.
- **Backend/Banco de Dados**: Supabase (PostgreSQL).
- **Ícones**: Lucide Icons.
- **PDF**: jsPDF + AutoTable.

## Configuração do Projeto

### 1. Clonar o Repositório
```bash
git clone <SEU_URL_DO_GITHUB>
cd livro-caixa-v1
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 3. Executar Localmente
```bash
npm run dev
```

## Deploy (Vercel)

Este projeto está pronto para deploy na Vercel.

1. Importe o projeto na Vercel.
2. Nas configurações de **Environment Variables**, adicione as mesmas chaves do `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Clique em **Deploy**.

## Estrutura do Banco de Dados (Supabase)

O sistema utiliza as seguintes tabelas (já configuradas no projeto):
- `aberturas`
- `vendas`
- `retiradas`
- `fechamentos`

*Certifique-se de que as políticas RLS (Row Level Security) permitam acesso apenas aos donos dos dados (`auth.uid() = user_id`).*

## Licença

Uso proprietário ou pessoal.
