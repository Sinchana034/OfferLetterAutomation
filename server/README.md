# Offer Letter Automation - Backend

Node.js + Express + MongoDB backend for the Automated Intern Offer Letter
Generation & Mailing System, with 4 roles: **Admin**, **HR**, **Manager**
(department-scoped), and **Candidate** (self-service portal).

## 1. Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` - your MongoDB connection string (local or Atlas)
- `JWT_SECRET` - any long random string
- `SMTP_*` / `EMAIL_FROM` - your SMTP provider (Gmail SMTP for dev, SendGrid/SES for prod)
- `COMPANY_*` - branding used in the offer letter PDF
- `CANDIDATE_PORTAL_URL` - the frontend URL the activation link points to
- `SEED_ADMIN_*` - credentials for the first Admin account

## 2. Create the first Admin account

There is deliberately **no API endpoint** to create an Admin (avoids
privilege escalation). Run the seed script instead:

```bash
npm run seed:admin
```

This reads `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
from `.env` and creates the account (or no-ops if it already exists).

## 3. Run

```bash
npm run dev     # nodemon, auto-restart
npm start       # plain node
```

Server boots on `http://localhost:5000`. Health check: `GET /api/health`.

> **Puppeteer note:** on first `npm install`, Puppeteer downloads a bundled
> Chromium (~200MB). If your environment blocks that download, set
> `PUPPETEER_SKIP_DOWNLOAD=true` before install and instead point Puppeteer
> at a system Chrome via `executablePath` in `utils/pdfGenerator.js`.

## 4. Role model

| Role | Created via | Access |
|---|---|---|
| Admin | `npm run seed:admin` (first one), then `POST /api/users` as Admin | Everything HR can do + manage HR/Manager accounts |
| HR | `POST /api/users` (Admin only) | All candidates/offers, generate & resend letters |
| Manager | `POST /api/users` (Admin only, requires `department`) | Read-only, auto-filtered to their own `department` |
| Candidate | Auto-created when an offer is generated | Own offer + own editable profile fields only |

Department scoping for Managers is enforced server-side in
`middleware/auth.js` (`scopeToDepartment`) and applied to every offer
query in `controllers/offerController.js` — a Manager can never see or
be given data outside `req.user.department`, regardless of what the
frontend sends.

## 5. API Reference

### Auth - `/api/auth`
| Method | Route | Access | Body |
|---|---|---|---|
| POST | `/login` | Public | `{ email, password }` → staff JWT |
| POST | `/candidate/activate` | Public | `{ token, password }` → sets password, returns candidate JWT |
| POST | `/candidate/login` | Public | `{ email, password }` → candidate JWT |

### Offers - `/api/offers` (staff JWT required)
| Method | Route | Access |
|---|---|---|
| POST | `/generate` | Admin, HR |
| POST | `/:id/resend` | Admin, HR |
| GET | `/` | Admin, HR, Manager (dept-scoped) — supports `?search=&status=&page=&limit=` |
| GET | `/:id` | Admin, HR, Manager (dept-scoped) |

### Candidate portal - `/api/candidate` (candidate JWT required)
| Method | Route | Notes |
|---|---|---|
| GET | `/me` | Own offer + profile |
| PATCH | `/me` | Editable fields only: `phone, address, emergencyContactName, emergencyContactPhone` |

### Users - `/api/users` (Admin JWT required)
| Method | Route |
|---|---|
| POST | `/` — create HR or Manager account |
| GET | `/` — list all staff |
| PATCH | `/:id/status` — activate/deactivate |

## 6. What happens on "Generate Offer"

1. Offer record created (`status: Pending`).
2. PDF rendered via Puppeteer from `templates/offerLetter.html`.
3. A Candidate account is provisioned (inactive, with a one-time hashed
   activation token, 7-day expiry).
4. Email sent with the PDF attached + an activation link
   (`CANDIDATE_PORTAL_URL?token=...`).
5. Offer status updated to `Sent` or `Failed` (with `emailError` logged).
6. If it fails at any step, the record stays visible on the dashboard so
   HR/Admin can hit **resend**, which regenerates the PDF and retries.

## 7. Next steps (not in this backend yet)

- Frontend (React + Vite + Tailwind) for all 4 dashboards.
- Move generated PDFs from local disk to S3/Cloudinary for production.
- Rate limiting + input sanitization (`express-validator` is already a
  dependency, wire it into the routes as you harden this).
- BullMQ/Redis queue for PDF+email so `generateOffer` returns instantly
  instead of waiting on Puppeteer + SMTP inline.
