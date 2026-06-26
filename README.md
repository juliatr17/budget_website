# Personal Budget Management System

A web application that helps people track everyday income and expenses in one place — with categories, filters, and a clear balance overview. The app is built with **Next.js** and **PostgreSQL**, runs in **Docker**, and is deployed to **Microsoft Azure** through an automated **CI/CD pipeline** with unit and end-to-end tests.

**Live demo:** [budget-app-julia01.azurewebsites.net](https://budget-app-julia01-dsa0gyfdcnggadbr.polandcentral-01.azurewebsites.net)

**Author:** Yuliia Tryshyna  
---

## About the Application

### The idea

Most people manage money across notes, banking apps, and spreadsheets. That makes it hard to answer simple questions: *How much did I spend this month? On what? Am I ahead or behind?*

This project is a **personal budget manager** — a single web page where users can record every income and expense, assign it to a category, and see their financial summary at a glance.

### Why this app is useful

- **One place for all transactions** — salaries, bills, groceries, and other spending in a single dashboard
- **Categories** — each transaction belongs to a category (Food, Transport, Bills, Entertainment, etc.), so spending is easier to understand
- **Balance overview** — the dashboard shows total income, total expenses, and current balance
- **Filters** — search by description, date range, amount, category, or transaction type
- **Personal accounts** — registered users keep their own data; guests can preview categories without saving transactions
- **Admin tools** — administrators can manage users and categories for the whole system

### What happens on the site

1. **Home page** — short introduction with links to login or registration
2. **Login / Register** — users sign in with email and password, or enter as a guest
3. **Dashboard** — the main panel after login:
   - summary cards (balance, income, expenses)
   - form to add a new transaction (category, type, amount, date, description)
   - filterable transaction list with pagination
   - account tab (profile and password change)
   - admin tab (user and category management — admin only)
4. **API layer** — all actions (auth, transactions, categories) go through secure REST endpoints backed by PostgreSQL

### User roles

| Role | What they can do |
|------|------------------|
| **Guest** | Browse available categories, preview the app |
| **User** | Full CRUD on their own transactions, manage profile |
| **Admin** | Everything a user can do + manage users and categories |

### Default admin account (after database seed)

| Field | Value |
|-------|-------|
| Email | `admin@budzet.local` |
| Password | `Admin123!` |

---

## Cloud Deployment & Infrastructure

This repository is not only the application source code — it also documents a full **cloud deployment workflow** developed for academic requirements.

### What was built in the cloud

| Azure resource | Purpose |
|----------------|---------|
| **Resource Group** (`rg-budget-julia`) | Groups all project resources |
| **Container Registry** (`budgetjuliaacr01`) | Stores Docker images |
| **PostgreSQL Flexible Server** | Managed production database |
| **App Service Plan** (`plan-budget-julia`, Linux B1) | Hosting plan for the container |
| **Web App** (`budget-app-julia01`) | Runs the app container with HTTPS |

### Docker & local environment

The app is packaged as a Docker image and orchestrated with **Docker Compose**:

- **`db`** — PostgreSQL 16 with persistent volume
- **`app`** — Next.js production build; on startup runs Prisma migrations and database seed

```bash
docker compose up --build
```

### CI/CD pipeline (GitHub Actions)

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. **Unit tests** (Vitest) — login validation, bcrypt, JWT
2. **E2E tests** (Playwright) — guest and admin login in a real browser
3. **Build & Deploy** — Docker image → Azure Container Registry → Azure App Service

Deploy runs **only if all tests pass**.

### Security

- **HTTPS** — enforced by Azure App Service in production
- **Passwords** — stored as bcrypt hashes, never in plain text
- **Sessions** — JWT in httpOnly cookies (`secure` flag on production)
- **Secrets** — `DATABASE_URL` and `JWT_SECRET` only in environment variables and GitHub Secrets, not in the repository

### Architecture

```
User (browser, HTTPS)
        │
        ▼
Azure App Service (Docker container — Next.js)
        │
        ▼
Azure PostgreSQL (managed database)

Developer → git push → GitHub Actions
                           │
              Unit tests + E2E tests
                           │
                           ▼
              Azure Container Registry → App Service
```

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
| Cloud | Azure App Service, ACR, Azure PostgreSQL |
| CI/CD | GitHub Actions |
| Unit tests | Vitest |
| E2E tests | Playwright |

---

## Project Structure

```
budget_website/
├── src/
│   ├── app/              # Pages and API routes
│   ├── components/       # Auth form, dashboard UI
│   └── lib/              # Auth, Prisma, validators
├── prisma/
│   ├── schema.prisma     # Database models
│   └── seed.ts           # Roles, categories, admin user
├── e2e/                  # Playwright tests (login flows)
├── .github/workflows/    # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml
└── docker-entrypoint.sh
```


**Yuliia Tryshyna**  
GitHub: [@juliatr17](https://github.com/juliatr17)

---

## License

ISC
