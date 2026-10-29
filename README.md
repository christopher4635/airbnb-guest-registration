# 🏡 Airbnb Multi-Property Portal (Cloudflare Monorepo)

A production-ready multi-property management portal and guest registration registry built with a modern decoupled monorepo architecture for **Cloudflare Workers, D1 Database, and R2 Object Storage**.

---

## ⚡ Architecture Overview

```
FreelanceTime/ (Monorepo Root)
├── backend/                       # Cloudflare Worker Backend (Hono)
│   ├── src/
│   │   ├── index.ts               # Hono app with CORS, health check, router mounting
│   │   ├── types.ts               # D1 & R2 TypeScript bindings and data models
│   │   └── routes/
│   │       ├── bookings.ts        # Full CRUD for 1 BHK, 2 BHK, Studio (D1 Database)
│   │       ├── submissions.ts     # Guest registration & check-in pipeline
│   │       ├── uploads.ts         # Direct image upload and streaming from Cloudflare R2
│   │       └── config.ts          # Host admin configuration, PIN & custom fields
│   ├── schema.sql                 # D1 Database schema (bookings, submissions, config)
│   ├── seed.sql                   # D1 Seed script with confirmed bookings
│   ├── package.json
│   └── wrangler.jsonc             # Standalone backend worker configuration
│
├── frontend/                      # Static Assets (Workers Assets / Cloudflare Pages)
│   ├── index.html                 # Guest check-in form with camera & R2 upload integration
│   ├── admin.html                 # Unified 3-Property Host Portal & Calendar View
│   ├── portal.html                # Fullscreen Gantt Timeline & Month View
│   ├── js/
│   │   └── api.js                 # Centralized client SDK communicating with Hono API
│   ├── package.json
│   └── wrangler.jsonc             # Standalone frontend Pages configuration
│
├── package.json                   # Root monorepo workspace configuration
├── wrangler.jsonc                 # Fullstack Unified Cloudflare Worker + Assets deployment
└── README.md
```

### Key Technology Stack:
- **Backend**: [Hono](https://hono.dev/) running at the Cloudflare Edge.
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (Distributed Edge SQLite database).
- **Image Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (Zero-egress fee S3-compatible object store for Front/Back ID photos and digital signatures).
- **Deployment**: [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (Cloudflare Workers with Static Assets).

---

## 🚀 Quick Setup & Deployment Guide

### Prerequisites
Make sure you have Node.js (v18+) and npm installed, and log in to your Cloudflare account:
```bash
npx wrangler login
```

---

### Step 1: Install Dependencies
From the root directory:
```bash
npm install
```

---

### Step 2: Create Cloudflare D1 Database
Create the edge SQLite database for your properties and guest registrations:
```bash
npx wrangler d1 create airbnb-db
```
The terminal will display your new database configuration, for example:
```jsonc
[[d1_databases]]
binding = "DB"
database_name = "airbnb-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
Copy the `database_id` and paste it into `wrangler.jsonc` (and `backend/wrangler.jsonc`).

---

### Step 3: Create Cloudflare R2 Storage Bucket
Create the R2 bucket for storing guest ID card photos and signatures:
```bash
npx wrangler r2 bucket create airbnb-guest-images
```

---

### Step 4: Run Database Migrations & Seed Data

#### For Local Development:
```bash
# 1. Initialize tables (schema)
npm run d1:migrate:local

# 2. Seed initial confirmed bookings (Oct/Nov 2026 schedule)
npm run d1:seed:local
```

#### For Remote (Production):
```bash
# 1. Initialize tables on Cloudflare D1
npm run d1:migrate:remote

# 2. Seed initial confirmed bookings on Cloudflare D1
npm run d1:seed:remote
```

---

### Step 5: Run Locally

Start the fullstack unified development server:
```bash
npm run dev
```
- Frontend will be available at: `http://localhost:8787`
- Hono API endpoints will be live at: `http://localhost:8787/api/*`

---

### Step 6: Deploy to Cloudflare

Deploy both the Hono backend and frontend static assets in a single command:
```bash
npm run deploy
```
Wrangler will output your live production URL (e.g., `https://airbnb-management.<your-subdomain>.workers.dev`).

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Edge service health check & storage status |
| `GET` | `/api/bookings` | List all bookings across properties (ordered by check-in date) |
| `POST` | `/api/bookings` | Create new booking (with double-booking conflict detection) |
| `GET` | `/api/bookings/:id` | Get booking details |
| `PUT` | `/api/bookings/:id` | Update booking status, dates, payout, or notes |
| `DELETE` | `/api/bookings/:id` | Delete booking |
| `GET` | `/api/submissions` | List all guest check-in submissions with R2 photo URLs |
| `POST` | `/api/submissions` | Submit guest registration; uploads ID images to R2 & saves to D1 |
| `POST` | `/api/uploads` | Direct upload of base64 or multipart image to Cloudflare R2 |
| `GET` | `/api/uploads/*` | Stream/serve image file from Cloudflare R2 bucket with cache headers |
| `GET` | `/api/config` | Get host configuration, PIN, and property options |
| `POST` | `/api/config` | Update configuration (protected by `X-Admin-Pin` header) |

---

## 🔐 Security & Host Access

- **Admin PIN**: Default is `4635`.
- **Image Privacy**: Uploaded guest IDs are placed in isolated R2 storage keys (`guests/{reservationCode}/...`).
- **Conflict Prevention**: Overlapping check-in and check-out dates on the same property are automatically validated at the edge before inserting into D1.
