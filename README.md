# Renewly — Infrastructure Renewal Management System for CodeYogi

**Renewly** is an enterprise-grade cloud asset renewal and lifecycle management platform built with React 19, TypeScript, Vite, Tailwind CSS, and Supabase.

Designed with a SaaS interface inspired by Linear and Stripe, Renewly enables engineering and IT organizations to track domains, web hosting subscriptions, and VPS server fleets, eliminating outages caused by lapsed credentials or missed expiration deadlines.

---

## 🚀 Key Modules & Architecture

1. **Domains Lifecycle Manager**
   - Domain registrar tracking (Cloudflare, Namecheap, GoDaddy, etc.)
   - DNS provider mapping & nameserver validation
   - Registration and expiry milestones with auto-renewal status indicators
   - Instant renewal recording with receipt archiving

2. **Website Hosting Manager**
   - Multi-cloud hosting provider tracking (Vercel, AWS Elastic Beanstalk, Kinsta, Netlify)
   - Plan specifications, region/datacenter zones, and SSL certificate health
   - Monthly and annual recurring commitment tracking

3. **VPS & Dedicated Compute Fleet**
   - Cloud compute instances (Hetzner, DigitalOcean, OVHcloud, AWS EC2)
   - Hardware specifications: CPU cores, RAM, NVMe storage allocation, and IPv4/IPv6 networking
   - OS distributions, custom SSH management ports, and billing cadences

4. **Multi-Cadence Automated Expiry Reminders**
   - Scheduled reminder notifications at **30, 15, 7, 3, and 1 day** prior to expiration
   - Duplicate alert prevention through database unique constraint checks
   - Resend email dispatcher template integration for alerts
   - In-app Notification Centre with real-time unread badges

5. **Financial Analytics & Projections**
   - Real-time monthly run-rate and annual projected budget (never hardcoded)
   - 6-month predictive renewal expense chart
   - Asset distribution by category and vendor concentration breakdown
   - One-click PDF financial report export

6. **Renewal History & Audit Trail**
   - Comprehensive payment ledger with invoice numbering and payment methods
   - Full activity logs detailing entity mutations and cron executions
   - One-click CSV and PDF data exports for compliance

7. **Role-Based Access Control (RBAC)**
   - **Admin:** Full provisioning privileges, delete permissions, renewal approvals, and user invites
   - **Employee:** Operational read/edit access, renewal submissions, and manual cron triggers

8. **Supabase & Edge Function Readiness**
   - PostgreSQL schema with normalized tables, enums, triggers, and Row Level Security policies
   - Edge function for cron-triggered email delivery via Resend API
   - Local fallback storage engine for immediate zero-config testing and local offline capability

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router v7
- **Styling:** Tailwind CSS, Plus Jakarta Sans, JetBrains Mono
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Export Engines:** jsPDF, jspdf-autotable
- **Database / Backend:** Supabase (PostgreSQL, Edge Functions, RLS)

---

## 📦 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
```

### 4. Supabase Setup (Optional)
Run the migration file located at `supabase/schema.sql` in your Supabase SQL editor to deploy the tables, RLS policies, and expiry check functions.
