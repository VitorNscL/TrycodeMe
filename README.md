# 🚀 TryCodeMe

Plataforma full stack de ensino de programação e cibersegurança com sistema de aulas, exercícios, ranking e interação em tempo real.

---


## 🔐 Acesso de demonstração

Use as contas abaixo para testar:

* 👑 Admin
  `admin@trycodeme.dev` / `admin123`

* 👨‍🏫 Teacher
  `teacher@trycodeme.dev` / `teacher123`

* 👤 User
  `user@trycodeme.dev` / `user123`

---

## 🧠 Sobre o projeto

O **TryCodeMe** é uma plataforma moderna inspirada em sistemas reais de ensino online, com foco em:

* aprendizado prático
* progressão de usuários
* gamificação (ranking, XP, duelos)
* interação em tempo real

O projeto foi desenvolvido como um **MVP funcional**, simulando um produto real pronto para evolução e escalabilidade.

---

## ⚙️ Stack utilizada

### Frontend

* React
* TypeScript
* Vite
* TailwindCSS

### Backend

* Node.js
* Express
* TypeScript
* JWT (autenticação)
* Socket.IO (tempo real)

### Banco de dados

* SQLite (ambiente de desenvolvimento / MVP)

---

## ✨ Funcionalidades

* 🔐 Autenticação com JWT
* 👤 Sistema de usuários com roles (admin, teacher, user)
* 📚 Gestão de aulas e conteúdos
* 🧪 Exercícios práticos
* 📊 Progresso do usuário
* 🏆 Ranking e gamificação
* 💬 Chat em tempo real
* 🎛️ Painel administrativo
* 🎨 Personalização de tema (dark/light)

---

## 🏗️ Arquitetura

O projeto segue uma estrutura **full stack separada**:

```bash
frontend/   # Interface React (Vite)
backend/    # API REST + WebSocket (Express)
docs/       # Documentação do projeto
```

---

## 🚀 Como rodar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/SEU-USUARIO/trycodeme.git
cd trycodeme
```

---

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Servidor rodando em:

```
http://localhost:4000
```

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicação em:

```
http://localhost:5173
```

---

## 🔧 Variáveis de ambiente

### Backend (.env)

```env
PORT=4000
JWT_SECRET=sua_chave_secreta
FRONTEND_URL=http://localhost:5173
```

---

### Frontend (.env)

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

---

## ⚠️ Limitações (MVP)

Este projeto foi desenvolvido como um MVP, portanto:

* Banco SQLite (não ideal para produção)
* Chat simples em memória
* Upload de arquivos via URL
* Runner de código em modo demonstrativo

---

## 📈 Próximos passos (roadmap)

* Migração para PostgreSQL
* Sistema de pagamentos
* Upload real de arquivos
* Sistema de notificações
* Testes automatizados
* Deploy com Docker

---

## 👨‍💻 Autor

Desenvolvido por **Vitor Dev**

* GitHub: https://github.com/VitorNscL

---

## 📄 Licença

Este projeto está sob a licença MIT.
