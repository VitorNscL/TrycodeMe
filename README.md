# TryCodeMe

Plataforma full stack de ensino de programação, desenvolvimento e cibersegurança com visual dark first, painel admin, perfis, chat público, progresso, ranks, competições e base para duelos 1v1.

## O que já vem pronto
- Frontend e backend em pastas separadas
- Tema dark e light com botão de alternância
- Menu lateral que abre/fecha ao clicar
- Home, aulas, exercícios, chat, perfil, fundador, doações, competições, duelos e admin
- Login local e base pronta para login com Google
- Painel para criar aulas e exercícios
- Professores com crédito na aula e perfil público
- Progresso por aula: não iniciada, em processo e concluída
- Rank principal exibido no chat
- Chat público em tempo real com avatar e badge ADMIN
- Runner local de JavaScript para demo

## Limites honestos desta versão
- O executor online completo está em modo demo local para JavaScript. Para produção multi-linguagem, troque o adaptador por Judge0 ou Piston.
- O chat é público e simples; moderação avançada não foi implementada nesta versão.
- O sistema de duelo 1v1 está preparado como base de produto, mas não sincroniza edição de código em tempo real.
- Upload real de mídia está preparado via campos URL. Para upload de arquivos, integre Supabase Storage, S3 ou Cloudinary.

## Estrutura
```text
TryCodeMe/
  backend/
  frontend/
  docs/
```

## Como rodar
### 1. Instalar dependências
```bash
npm run install:all
```

### 2. Configurar variáveis
Copie:
- `backend/.env.example` para `backend/.env`
- `frontend/.env.example` para `frontend/.env`

### 3. Popular dados iniciais
```bash
npm run seed
```

### 4. Rodar backend
```bash
npm run dev:backend
```

### 5. Rodar frontend
```bash
npm run dev:frontend
```

## Usuários demo
- Admin: `admin@trycodeme.dev` / `admin123`
- Professor: `teacher@trycodeme.dev` / `teacher123`
- Usuário: `user@trycodeme.dev` / `user123`

## Segurança
- `helmet`
- `express-rate-limit`
- validação com `zod`
- checagem de papel em rotas protegidas
- JWT para sessão

## Próximos upgrades recomendados
- Trocar SQLite por Postgres em produção
- Integrar Supabase Storage para mídia
- Integrar Judge0/Piston para múltiplas linguagens
- Adicionar moderação de chat
- Adicionar notificações de duelo em tempo real
