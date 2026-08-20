# TaskFlow — Full-Stack Task Management App

A private task management application built to match the assignment requirements. The supplied reference recommends a MERN implementation; this submission keeps the same functional architecture while using the requested **NestJS backend + Next.js frontend**, with **PostgreSQL + Prisma** for relational data modeling.

## Features

- JWT register/login and protected task routes
- Every task belongs to a user; all task queries are scoped by authenticated `userId`
- Full task CRUD
- Status: `PENDING`, `IN_PROGRESS`, `DONE`
- Priority: `LOW`, `MEDIUM`, `HIGH`
- Due date and location
- Pagination, status/priority filters, search, and sorting
- Multiple attachments per task through Cloudinary
- Email confirmation when a task is created
- Completion email when a task changes to `DONE`
- Current weather lookup for each task location through OpenWeatherMap
- Next.js dashboard with responsive loading, empty, and error states

The functional goals and integration choices are aligned with the supplied reference: JWT authentication, task isolation, CRUD/filtering/pagination, email, Cloudinary, and OpenWeatherMap. fileciteturn0file0L9-L20

## Architecture

```text
Browser (Next.js)
      |
      | JWT Bearer + REST
      v
NestJS API
  |-- Auth module (bcrypt + JWT)
  |-- Tasks module (CRUD/filter/pagination)
  |-- Prisma/PostgreSQL
  |-- Cloudinary storage
  |-- Nodemailer SMTP
  `-- OpenWeatherMap
```

The project separates modules/services similarly to the reference's recommended modular backend architecture. fileciteturn0file0L52-L80

## Project structure

```text
task-management-app/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── auth/
│   │   ├── tasks/
│   │   ├── storage/
│   │   ├── email/
│   │   ├── weather/
│   │   ├── database/
│   │   ├── common/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── .env.example
├── frontend/
│   ├── src/app/
│   ├── src/components/
│   ├── src/lib/
│   ├── src/types/
│   └── .env.example
└── README.md
```

## Local setup

### 1. PostgreSQL

Create a PostgreSQL database named `tasks`, or use a hosted PostgreSQL database such as Neon, Supabase, Railway, or Render.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set at minimum:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tasks"
JWT_SECRET="use-a-long-random-secret"
FRONTEND_URL="http://localhost:3000"
```

For the optional/required integrations, add the Cloudinary, OpenWeatherMap, and SMTP values from `.env.example`.

Then:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

API: `http://localhost:5000/api`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

### Backend

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | API port, default 5000 |
| `FRONTEND_URL` | CORS origin |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret |
| `OPENWEATHER_API_KEY` | OpenWeatherMap key |
| `SMTP_HOST` | SMTP server |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password/app password |
| `MAIL_FROM` | Sender address |

### Frontend

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Live/local NestJS API URL including `/api` |

The supplied reference also explicitly calls for `.env.example` files and environment variables for database, weather, Cloudinary, and email services. fileciteturn0file0L45-L50

## API

### Public

- `POST /api/auth/register`
- `POST /api/auth/login`

### Protected — `Authorization: Bearer <JWT>`

- `GET /api/tasks?page=1&limit=10`
- `GET /api/tasks/:id`
- `POST /api/tasks` — multipart form, field name `files`
- `PUT /api/tasks/:id` — multipart form, field name `files`
- `DELETE /api/tasks/:id`

Filters:

```text
status=PENDING|IN_PROGRESS|DONE
priority=LOW|MEDIUM|HIGH
startDate=ISO_DATE
endDate=ISO_DATE
search=text
sort=dueDate|priority
page=1
limit=10
```

## Security decisions

- Passwords are hashed with bcrypt.
- JWTs are signed with a server-side secret.
- Protected routes use a NestJS guard.
- A task lookup/update/delete always includes the authenticated user's ID, preventing one user from accessing another user's task by ID.
- DTO validation uses `class-validator` with a global whitelist and rejection of unexpected fields.
- A centralized exception filter provides consistent API error responses.
- Secrets are excluded from git; only `.env.example` is committed.

This directly addresses the reference checklist's security and data-isolation expectations. fileciteturn0file0L439-L447

## Deployment

### Backend

Deploy `backend` to Render/Railway/Fly.io. Build command:

```bash
npm install && npx prisma generate && npm run build
```

Start command:

```bash
npx prisma migrate deploy && npm start
```

Set all backend environment variables in the hosting provider.

### Frontend

Deploy `frontend` to Vercel and set:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

The reference recommends a hosted Node backend plus Vercel/Netlify frontend and a cloud database. fileciteturn0file0L192-L198

## Trade-offs / improvements with more time

- Add refresh-token rotation with HTTP-only cookies instead of keeping the access token in local storage.
- Add automated unit/e2e tests and API contract tests.
- Add drag-and-drop task ordering and a calendar view.
- Add background jobs/queues for email so external SMTP latency never delays a task request.
- Cache weather responses for a short period to reduce OpenWeatherMap requests.
- Add Cloudinary delete handling when attachments are removed.
- Add rate limiting, structured logging, request IDs, and production monitoring.
- Add richer task detail pages and optimistic React Query mutations.

## Git hygiene

Suggested commits:

```text
feat: initialize nestjs api and prisma schema
feat: add jwt authentication
feat: add private task crud and filters
feat: integrate cloudinary attachments
feat: integrate weather and task emails
feat: build nextjs dashboard
chore: add deployment and environment documentation
```
