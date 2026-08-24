# Nuqoosh CRM Professional V3 — Frontend

Next.js 16 / React 19 enterprise CRM frontend.

V3 adds permission-driven navigation, role-aware dashboards, Projects, advanced Tasks, protected Contracts, Meetings, Follow-Ups, Customer Requests, dynamic Roles & Permissions, notifications and updated user administration.

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=https://crm.thelootah.com
```

## Run

```bash
npm ci
npm run lint
npm run build
npm run start
```

Production can continue using the existing PM2 `nuqoosh-frontend` process.
