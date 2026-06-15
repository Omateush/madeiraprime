# Madeira Prime — Gestão e Investimento Imobiliário

Landing page completa para a Madeira Prime, incluindo backend Express + MySQL via Prisma e frontend React + Vite.

---

## Stack

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite + CSS Modules     |
| Backend    | Node.js + Express                 |
| Base dados | MySQL 8+                          |
| ORM        | Prisma                            |
| Validação  | express-validator                 |

---

## Estrutura

```
madeira-prime/
├── client/          # React (Vite) — porta 5173
├── server/          # Express + Prisma — porta 3001
└── README.md
```

---

## Pré-requisitos

- Node.js 18+
- MySQL 8+ (local ou remoto)
- npm ou yarn

---

## Setup Rápido

### 1. Base de Dados (MySQL)

```sql
CREATE DATABASE madeira_prime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'madeirauser'@'localhost' IDENTIFIED BY 'suapassword';
GRANT ALL PRIVILEGES ON madeira_prime.* TO 'madeirauser'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edita o .env com as tuas credenciais MySQL

npm install
npx prisma generate
npx prisma migrate dev --name init

npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

O site fica disponível em **http://localhost:5173**  
A API fica disponível em **http://localhost:3001**

---

## Variáveis de Ambiente

Ver `server/.env.example` para todas as variáveis necessárias.

---

## Endpoints API

| Método | Rota                       | Descrição                       |
|--------|----------------------------|---------------------------------|
| POST   | /api/leads/proprietario    | Criar lead proprietário         |
| GET    | /api/leads/proprietario    | Listar leads proprietários      |
| POST   | /api/leads/investidor      | Criar lead investidor           |
| GET    | /api/leads/investidor      | Listar leads investidores       |
| POST   | /api/marcacoes             | Criar marcação                  |
| GET    | /api/marcacoes             | Listar marcações (painel admin) |

---

## Licença

© 2026 Madeira Prime. Todos os direitos reservados.
