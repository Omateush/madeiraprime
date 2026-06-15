# Madeira Prime — Backend

API REST construída com Node.js, Express e Prisma ORM sobre MySQL.

---

## Setup da Base de Dados (MySQL)

### 1. Instalar MySQL 8+

- **Windows**: https://dev.mysql.com/downloads/installer/
- **macOS**: `brew install mysql && brew services start mysql`
- **Ubuntu**: `sudo apt install mysql-server && sudo systemctl start mysql`

### 2. Criar Base de Dados e Utilizador

```sql
-- Liga-te ao MySQL como root
mysql -u root -p

-- Cria a base de dados
CREATE DATABASE madeira_prime
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Cria utilizador dedicado
CREATE USER 'madeirauser'@'localhost' IDENTIFIED BY 'suapassword';

-- Concede permissões
GRANT ALL PRIVILEGES ON madeira_prime.* TO 'madeirauser'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edita o ficheiro `.env` com as tuas credenciais:

```env
DATABASE_URL="mysql://madeirauser:suapassword@localhost:3306/madeira_prime"
PORT=3001
```

---

## Instalar Dependências

```bash
npm install
```

---

## Migrar a Base de Dados (Prisma)

```bash
# Gera o cliente Prisma
npx prisma generate

# Cria as tabelas na base de dados
npx prisma migrate dev --name init
```

---

## Correr o Servidor

```bash
# Modo desenvolvimento (nodemon — recarrega automaticamente)
npm run dev

# Modo produção
npm start
```

O servidor fica disponível em `http://localhost:3001`

---

## Prisma Studio (Interface Gráfica)

```bash
npx prisma studio
```

Abre em `http://localhost:5555` — permite ver e editar dados diretamente.

---

## Endpoints

| Método | Rota                       | Descrição                         |
|--------|----------------------------|------------------------------------|
| POST   | /api/leads/proprietario    | Criar lead proprietário            |
| GET    | /api/leads/proprietario    | Listar todos os leads proprietários|
| POST   | /api/leads/investidor      | Criar lead investidor              |
| GET    | /api/leads/investidor      | Listar todos os leads investidores |
| POST   | /api/marcacoes             | Criar marcação de reunião          |
| GET    | /api/marcacoes             | Listar todas as marcações          |

---

## Estrutura

```
server/
├── prisma/
│   └── schema.prisma    # Modelos da base de dados
├── src/
│   └── index.js         # App Express + routes + validações
├── .env.example         # Exemplo de variáveis de ambiente
├── .env                 # (criado por ti, não commitar)
├── package.json
└── README.md
```

---

## Reset Completo da Base de Dados

```bash
# ATENÇÃO: apaga todos os dados!
npx prisma migrate reset
```
