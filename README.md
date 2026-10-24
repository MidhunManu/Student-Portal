# Apex Student & Alumni Portal

A production-ready, secure, and maintainable academic web application connecting current students with campus activities and verified alumni. Built with Node.js, Express.js, TypeScript, MySQL (`mysql2`), and server-rendered EJS templates.

---

## Table of Contents

1. [Features & Architecture Overview](#features--architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
4. [Database Creation, Migrations & Seeding](#database-creation-migrations--seeding)
5. [Development & Production Execution](#development--production-execution)
6. [Automated Testing Suite](#automated-testing-suite)
7. [Authentication & Role Permissions](#authentication--role-permissions)
8. [Available UI Pages & Routes](#available-ui-pages--routes)
9. [REST API Documentation](#rest-api-documentation)
10. [Production Deployment (Node.js Behind Nginx)](#production-deployment-nodejs-behind-nginx)
11. [Production Security Considerations](#production-security-considerations)

---

## Features & Architecture Overview

- **Unified Authentication & Role-Based Authorization:**
  - Roles: `STUDENT`, `ALUMNI`, `ADMIN`.
  - Secure bcrypt password hashing (12 rounds) and comparison.
  - Server-side cookie sessions for browser navigation with `httpOnly`, `sameSite: 'lax'`, and `secure` settings.
  - CSRF protection across all state-changing HTML forms via session-backed CSRF tokens and hidden inputs.
  - Public registration security: strictly blocks creation of administrator accounts from public forms.
  - Rate limiting on authentication endpoints to defend against brute-force attempts.
  - JWT authentication and refresh token rotation/revocation for mobile/REST API clients.

- **Student Event Management & Automatic Waitlisting:**
  - Browse, filter, and paginate upcoming campus events.
  - Enforces strict seat capacity and registration deadlines.
  - Atomic database transactions (`SELECT ... FOR UPDATE`) to prevent race conditions during concurrent registrations.
  - Automatic waitlisting when capacity is reached.
  - **Automatic Waitlist Promotion**: When a confirmed attendee cancels, the system automatically promotes the earliest waitlisted registrant to `CONFIRMED` within a database transaction.
  - Student registration history with confirmed, waitlisted, and cancelled status tracking.
  - Administrative event creation, editing, and cancellation.

- **Alumni Portal & Networking:**
  - Alumni profile management: graduation year, degree, major, company, role, location, bio, LinkedIn, and GitHub links.
  - Searchable alumni directory with filtering by company, degree, and graduation year.
  - Alumni connection requests: send, accept, decline, and disconnect.
  - Career opportunities / job posts: alumni can post full-time, part-time, internship, and remote roles.
  - Strict ownership enforcement: only the posting alumnus or an administrator can edit or delete job listings.

- **College News & Announcements:**
  - Administrators can create, edit, publish, and archive announcements.
  - Students and alumni can filter published news by categories (`ACADEMIC`, `CAREER`, `CAMPUS`, `GENERAL`).
  - Integrated pagination and search.

- **Server-Rendered UI with EJS:**
  - Clean academic design system using plain CSS (`public/css/main.css`).
  - Responsive layouts (desktop, tablet, mobile).
  - Reusable partials for header, navigation, footer, flash alerts, and pagination.
  - Dedicated 403 Forbidden, 404 Not Found, and 500 Server Error views.

---

## Technology Stack

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js (v5)
- **Language:** TypeScript (v5.7+) with NodeNext ESM module resolution
- **Database:** MySQL 8 with `mysql2/promise` connection pooling
- **Template Engine:** EJS (server-rendered HTML)
- **Security:** bcryptjs, express-session, crypto-based CSRF tokens, express-rate-limit, jsonwebtoken
- **Logging:** Pino & Pino-pretty
- **Testing:** Node.js native test runner (`node:test`, `node:assert`) & Supertest

---

## Prerequisites & Environment Setup

### 1. Prerequisites
- Node.js v20.x or higher
- MySQL v8.0 or higher
- npm v10.x or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create `.env`:
```bash
cp .env.example .env
```

Ensure the following variables are configured in `.env`:
```env
PORT=3000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=portal

SESSION_SECRET=change_to_a_secure_random_string_with_32_plus_characters
JWT_SECRET=change_to_a_secure_jwt_secret_with_32_plus_characters
LOG_LEVEL=info
```

---

## Database Creation, Migrations & Seeding

### 1. Create MySQL Database
Log into MySQL and create the database:
```sql
CREATE DATABASE IF NOT EXISTS portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Run Database Migrations
Executes all version-controlled migrations inside `src/database/migrate.ts`:
```bash
npm run migrate
```
This automatically verifies and creates:
- `schema_migrations` (migration version ledger)
- `colleges`
- `users`
- `events`
- `event_registrations`
- `alumni_profiles`
- `alumni_connections`
- `job_posts`
- `announcements`

### 3. Seed Initial Demonstration Data (Optional)
Populate the database with sample colleges, users, events, announcements, and job listings:
```bash
npm run seed
```

**Default Test Credentials Created by Seeder:**
| Role | Email | Password | Description |
|---|---|---|---|
| **ADMIN** | `admin@college.edu` | `Admin@123` | Portal Administrator |
| **ALUMNI** | `alumni@college.edu` | `Alumni@123` | Senior Software Engineer @ Google |
| **STUDENT** | `student@college.edu` | `Student@123` | Active Undergraduate Student |

---

## Development & Production Execution

### Development Mode (with Live Reloading)
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### Production Build & Execution
```bash
# 1. Compile TypeScript to JavaScript in /dist
npm run build

# 2. Start production server
npm run start
```

---

## Automated Testing Suite

The project includes unit and integration tests covering authentication, CSRF validation, role-based route protection, event waitlisting/promotion, alumni connections, and job ownership.

To execute tests:
```bash
npm test
```

---

## Authentication & Role Permissions

| Role | Access Permissions |
|---|---|
| **Guest** | Landing page, browse upcoming events, browse published announcements, view job listings, sign in, register as Student or Alumni. |
| **STUDENT** | Student dashboard, event registration, cancel registrations, view waitlist status, browse alumni directory, view job postings, read announcements. |
| **ALUMNI** | Alumni dashboard, edit own alumni profile, send/accept/decline alumni connections, post/edit/delete own job opportunities, browse events & announcements. |
| **ADMIN** | Admin dashboard, create/edit/cancel events, create/edit/publish/delete announcements, moderate all job postings, manage user accounts & assign roles. |

---

## Available UI Pages & Routes

### Public Pages
- `GET /` — College portal landing page with hero banner and featured highlights.
- `GET /login` — Unified sign-in page.
- `POST /login` — Authenticates session and redirects to role-specific dashboard.
- `GET /register` — Registration page with college selection and role choice (`STUDENT` or `ALUMNI`).
- `POST /register` — Validates and creates account (strictly blocks `ADMIN` registration).
- `POST /logout` — Destroys session and clears cookies.
- `GET /dashboard` — Role-aware redirect to user's dashboard.

### Student Portal
- `GET /student/dashboard` — Overview of registrations, upcoming events, and announcements.
- `GET /student/registrations` — View confirmed/waitlisted status and cancel seats.

### Alumni Portal
- `GET /alumni/dashboard` — Alumni welcome hub, connection stats, and my jobs overview.
- `GET /alumni/profile` — View and edit own professional alumni profile.
- `POST /alumni/profile` — Update graduation year, degree, company, role, bio, and social links.
- `GET /alumni/connections` — Manage received requests, sent requests, and active connections.
- `POST /alumni/connections/request` — Send connection request to another alumnus.
- `POST /alumni/connections/respond` — Accept or decline an incoming connection request.
- `POST /alumni/connections/remove` — Disconnect from an alumnus.

### Administrator Portal
- `GET /admin/dashboard` — Administrative metrics (total students, alumni, events, jobs, announcements).
- `GET /admin/events` — Event management table with capacity and waitlist numbers.
- `GET /admin/events/new` — Create event form.
- `POST /admin/events/new` — Create event.
- `GET /admin/events/:id/edit` — Edit event form.
- `POST /admin/events/:id/edit` — Update event details.
- `POST /admin/events/:id/cancel` — Mark event as cancelled.
- `GET /admin/announcements` — Announcement management table.
- `GET /admin/announcements/new` — Create announcement form.
- `POST /admin/announcements/new` — Create announcement.
- `GET /admin/announcements/:id/edit` — Edit announcement form.
- `POST /admin/announcements/:id/edit` — Update announcement.
- `POST /admin/announcements/:id/delete` — Delete announcement.
- `GET /admin/jobs` — Moderate alumni-posted job listings.
- `POST /admin/jobs/:id/delete` — Delete inappropriate job listing.
- `GET /admin/users` — User management and role assignment table.
- `POST /admin/users/:id/role` — Update a user's role.

### Shared Features
- `GET /events` — Browse campus events with search and status filters.
- `GET /events/:id` — Event details and registration / waitlist / cancellation action.
- `POST /events/:id/register` — Register for event (automatic waitlisting if full).
- `POST /events/:id/cancel` — Cancel registration (automatically promotes earliest waitlisted attendee).
- `GET /alumni` / `GET /directory` — Searchable alumni directory with graduation year and company filters.
- `GET /alumni/view/:id` — View full public alumni profile.
- `GET /announcements` — Browse published college news and announcements.
- `GET /announcements/:id` — Full announcement view.
- `GET /jobs` — Browse career and internship opportunities with job type filters.
- `GET /jobs/:id` — Full job description and application details.
- `GET /jobs/my` — Manage own job postings (Alumni & Admin).
- `GET /jobs/new` — Post a new job opportunity (Alumni & Admin).
- `POST /jobs/new` — Create job listing.
- `GET /jobs/:id/edit` — Edit job listing.
- `POST /jobs/:id/edit` — Update job listing.
- `POST /jobs/:id/delete` — Delete job listing.

---

## REST API Documentation

All API endpoints are prefixed with `/api` and return JSON. Endpoints requiring authentication accept a `Bearer <token>` HTTP header.

### Authentication Endpoints
- `POST /api/users/register` — Register student or alumni (blocks admin creation).
- `POST /api/users/login` — Authenticate and receive `accessToken` and `refreshToken`.
- `POST /api/users/refresh-token` — Rotate and obtain a new access token.
- `POST /api/users/logout` — Invalidate refresh token.
- `GET /api/users/me` — Get authenticated user details.
- `GET /api/users` — List users (Admin only).
- `PATCH /api/users/:id/role` — Update user role (Admin only).

### Event Endpoints
- `GET /api/events` — List events with search and pagination query parameters.
- `GET /api/events/:id` — Get event details.
- `POST /api/events` — Create event (Admin only).
- `PUT /api/events/:id` — Update event (Admin only).
- `POST /api/events/:id/cancel-event` — Cancel event (Admin only).
- `POST /api/events/:id/register` — Register for event (Authenticated).
- `POST /api/events/:id/cancel` — Cancel registration (Authenticated).
- `GET /api/events/registrations/my` — List authenticated user's registrations.

### Alumni Endpoints
- `GET /api/alumni/directory` — List alumni directory with filters.
- `GET /api/alumni/profile` — Get authenticated alumni's profile.
- `PUT /api/alumni/profile` — Update alumni profile.
- `GET /api/alumni/connections` — Get connections and pending requests.
- `POST /api/alumni/connections/request` — Send connection request.
- `POST /api/alumni/connections/:id/respond` — Accept or decline connection request.
- `DELETE /api/alumni/connections/:id` — Remove connection.

### Job & Announcement Endpoints
- `GET /api/jobs` — List active jobs.
- `GET /api/jobs/:id` — Get job details.
- `POST /api/jobs` — Create job post (Alumni & Admin).
- `PUT /api/jobs/:id` — Update job post (Owner & Admin).
- `DELETE /api/jobs/:id` — Delete job post (Owner & Admin).
- `GET /api/announcements` — List published announcements.
- `GET /api/announcements/:id` — Get announcement details.
- `POST /api/announcements` — Create announcement (Admin only).
- `PUT /api/announcements/:id` — Update announcement (Admin only).
- `DELETE /api/announcements/:id` — Delete announcement (Admin only).

---

## Production Deployment (Node.js Behind Nginx)

When deploying to a production Linux server (Ubuntu/Debian) with Nginx as a reverse proxy:

### 1. Process Management with PM2
Install PM2 globally and start the built Node.js application:
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name "student-portal" -i max
pm2 save
pm2 startup
```

### 2. Nginx Configuration
Create `/etc/nginx/sites-available/student-portal.conf`:

```nginx
server {
    listen 80;
    server_name portal.yourcollege.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.yourcollege.edu;

    ssl_certificate /etc/letsencrypt/live/portal.yourcollege.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.yourcollege.edu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;" always;

    # Static Asset Caching
    location /css/ {
        alias /var/www/student_portal/public/css/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    location /js/ {
        alias /var/www/student_portal/public/js/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    # Reverse Proxy to Node.js App
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/student-portal.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Production Security Considerations

1. **Environment Isolation**: Never commit `.env` or production credentials to Git. Use environment-based secrets injected at deployment time.
2. **Session Cookie Hardening**: In production (`NODE_ENV=production`), session cookies automatically enforce `secure: true` (HTTPS only) and `sameSite: 'lax'` to prevent cross-site request forgery and cookie theft.
3. **Database Security**:
   - Every SQL query uses parameterized statements (`?` placeholders) through `mysql2/promise` to eliminate SQL injection vulnerabilities.
   - Event registrations and waitlist promotions strictly run inside `START TRANSACTION` with `FOR UPDATE` row locks to prevent race conditions.
4. **Output Escaping**: EJS view expressions use `<%= %>` by default, automatically escaping HTML entities to protect against Cross-Site Scripting (XSS).
5. **CSRF Protection**: All state-changing form submissions (POST) require a valid cryptographic CSRF token stored in the server session.
6. **Rate Limiting**: Critical endpoints (`/login`, `/register`) are rate-limited via `express-rate-limit` to prevent credential stuffing.
7. **Safe Error Responses**: In production mode (`NODE_ENV=production`), internal stack traces and server internals are concealed from end-users, rendering user-friendly error views while recording structured error logs via Pino.
