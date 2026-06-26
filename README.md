# Personal Budget Management System

A full-stack web application for tracking personal income and expenses. Built with **Next.js** and **PostgreSQL**, containerized with **Docker Compose**, and deployed to **Microsoft Azure** through a **GitHub Actions** CI/CD pipeline with automated unit and end-to-end tests.

**Live demo:** [budget-app-julia01.azurewebsites.net](https://budget-app-julia01-dsa0gyfdcnggadbr.polandcentral-01.azurewebsites.net)

---

## Overview

This project was developed as a cloud technologies coursework assignment. It implements a CRUD application with user authentication, category-based transaction management, role-based access (guest, user, admin), and a production deployment on Azure App Service.

The frontend and backend live in a single Next.js codebase. Data is stored in PostgreSQL and accessed through Prisma ORM.

---

## Features

- **User authentication** — registration, login, guest mode, JWT session cookies
- **Transactions (CRUD)** — add, view, filter, edit, and soft-delete income/expense records
- **Categories** — predefined financial categories (Food, Transport, Bills, etc.)
- **Dashboard** — balance summary, filtered results, pagination
- **Account management** — profile update and password change
- **Admin panel** — user and category management (admin role only)
- **Security** — bcrypt password hashing, HTTPS in production, httpOnly cookies

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL 16, Prisma ORM |
| Styling | Tailwind CSS 4 |
| Validation | Zod |
| Auth | JWT + bcrypt |
| Containers | Docker, Docker Compose |
| Cloud | Azure App Service, Azure Container Registry, Azure PostgreSQL |
| CI/CD | GitHub Actions |
| Unit tests | Vitest |
| E2E tests | Playwright |

---

## Architecture

```
Developer → GitHub → GitHub Actions
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
      Unit tests   E2E tests   (Vitest / Playwright)
            │           │
            └─────┬─────┘
                  ▼ (on success)
         Build Docker image → Azure Container Registry
                  ▼
         Azure App Service (HTTPS) → Azure PostgreSQL
```

**Local development:** Docker Compose runs two containers — `app` (Next.js) and `db` (PostgreSQL).

**Production:** The app runs as a container on Azure App Service; the database is a managed Azure PostgreSQL Flexible Server.

---

## Project Structure

```
budget_website/
├── src/
│   ├── app/              # Pages and API routes (App Router)
│   ├── components/       # UI components (auth form, dashboard)
│   └── lib/              # Auth, Prisma client, validators, API helpers
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Default roles, categories, admin account
├── e2e/                  # Playwright end-to-end tests
├── .github/workflows/    # CI/CD pipeline (tests + Azure deploy)
├── Dockerfile
├── docker-compose.yml
└── docker-entrypoint.sh
```

---

## Prerequisites

- Node.js 20+
- npm
- Docker Desktop (for containerized setup)
- PostgreSQL (only if running without Docker)

---

## Getting Started

### Option 1 — Docker Compose (recommended)

```bash
git clone https://github.com/juliatr17/budget_website.git
cd budget_website
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

The entrypoint script automatically runs `prisma db push` and seeds the database on startup.

### Option 2 — Local development

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Start PostgreSQL and update `DATABASE_URL` in `.env` if needed.

3. Install dependencies and prepare the database:

```bash
npm install
npm run db:push
npm run db:seed
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Prisma format) |
| `JWT_SECRET` | Secret key for signing JWT session tokens (min. 32 characters) |
| `NODE_ENV` | `development` or `production` |

Example (`.env.example`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/budget_db?schema=public"
JWT_SECRET="change_me_to_a_long_random_secret"
```

---

## Default Admin Account

After seeding the database:

| Field | Value |
|-------|-------|
| Email | `admin@budzet.local` |
| Password | `Admin123!` |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test` | Run all tests |
| `npm run db:push` | Sync Prisma schema with database |
| `npm run db:seed` | Seed roles, categories, and admin user |

---

## Testing

### Unit tests (Vitest)

Tests cover login validation (`loginSchema`), password verification (bcrypt), and JWT session tokens.

```bash
npm run test:unit
```

### End-to-end tests (Playwright)

Tests cover guest login and admin login through the browser.

```bash
# Requires a running database (e.g. docker compose up -d db)
npm run db:push && npm run db:seed
npx playwright install chromium
npm run test:e2e
```

View the HTML report:

```bash
npx playwright show-report
```

---

## CI/CD Pipeline

On every push to `main`, GitHub Actions runs:

1. **Unit tests** — Vitest
2. **E2E tests** — Playwright with a PostgreSQL service container
3. **Build & Deploy** — Docker image pushed to Azure Container Registry, deployed to Azure App Service

The deploy step runs only if both test jobs pass.

Workflow file: `.github/workflows/deploy.yml`

Required GitHub Secrets:

- `AZURE_CREDENTIALS`
- `ACR_LOGIN_SERVER`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `AZURE_WEBAPP_NAME`

---

## API Overview

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/guest` | POST | Guest session |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Current user info |
| `/api/transactions` | GET, POST | List / create transactions |
| `/api/transactions/[id]` | PUT, DELETE | Update / delete transaction |
| `/api/categories` | GET, POST | List / create categories |
| `/api/categories/[id]` | PUT, DELETE | Update / delete category |
| `/api/users/me` | GET, PUT | Profile management |
| `/api/users/me/password` | PUT | Change password |

---

## Authors

**Zuzanna Jasiak**, **Yuliia Tryshyna**  
Computer Science (full-time), 2nd year  
University of Silesia in Katowice

Academic project for the *Cloud Technologies* course.

---

## License

ISC
