# Guia Rápido - Livro Caixa

## O que é este projeto?

Sistema de gestão de caixa (livro caixa) para controle financeiro diário.

## Status Atual

- Front-end puro funcionando 100%
- Dados armazenados localmente (localStorage)
- Pronto para integração futura com Supabase ou qualquer API

## Como Usar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar o Projeto
```bash
npm run dev
```

### 3. Acessar
Abra o navegador em `http://localhost:5173`

### 4. Criar Conta
- Clique em "Não tem uma conta? Cadastre-se"
- Digite email e senha (mínimo 6 caracteres)
- Clique em "Criar Conta"

### 5. Fazer Login
- Digite email e senha criados
- Clique em "Entrar"

### 6. Usar o Sistema
- **Abertura:** Informe o valor inicial do caixa
- **Vendas:** Registre vendas do dia
- **Retiradas:** Registre retiradas/despesas
- **Fechamento:** Feche o caixa e veja o resultado
- **Histórico:** Consulte fechamentos anteriores

## Recursos

- Sistema de login/cadastro funcional
- Gestão completa de vendas e retiradas
- Fechamento de caixa com cálculo automático
- Histórico com filtros por período
- Exportação de relatórios em HTML
- Compartilhamento via WhatsApp
- Reabertura de caixas
- Interface responsiva (mobile/tablet/desktop)

## Estrutura de Dados

Todos os dados ficam salvos no localStorage do navegador, separados por usuário.

### Dados Armazenados
- Usuários e senhas
- Sessão de autenticação
- Aberturas de caixa
- Vendas
- Retiradas
- Fechamentos

## Integração Futura com API

O código está preparado para integração com Supabase ou qualquer API.

### O que precisa ser feito:
1. Escolher e configurar backend (Supabase recomendado)
2. Atualizar 2 arquivos:
   - `src/services/authService.ts`
   - `src/services/storageService.ts`
3. Substituir localStorage por chamadas HTTP/SDK

### O que NÃO precisa mudar:
- Nenhuma tela
- Nenhum componente
- Nenhuma lógica de negócio
- Nenhum layout ou estilo

Veja `ARQUITETURA.md` para detalhes completos.

## Build para Produção

```bash
npm run build
```

Os arquivos estarão em `dist/` prontos para deploy.

## Comandos Disponíveis

```bash
npm run dev        # Executar em desenvolvimento
npm run build      # Gerar build de produção
npm run preview    # Visualizar build
npm run lint       # Verificar código
npm run typecheck  # Verificar tipos TypeScript
```

## Tecnologias

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- Lucide Icons

## Suporte

Para entender a arquitetura e preparar integração com API, leia:
- `ARQUITETURA.md` - Documentação completa da arquitetura

## Notas

- Dados ficam apenas no navegador usado
- Para acessar de outro dispositivo, é necessário integrar com API
- Sistema seguro: cada usuário só vê seus próprios dados
- Backup manual: exporte fechamentos em HTML para guardar
