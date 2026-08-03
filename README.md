# Nuqoosh CRM Professional V2 — Next.js Frontend

Responsive Next.js 16 interface for the Nuqoosh Laravel CRM API.

## Included screens

- Login
- Role-aware dashboard and analytics
- Company selection and company settings
- Client management
- Versioned document templates
- Document generation, approval, archive and download
- User and role management
- Tasks
- Audit Trail
- Global CRM search

## Setup

```bash
cp .env.example .env.local
npm ci
npm run dev
```

`.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Production build

```bash
npm run build
npm run start
```

UI permissions improve usability, but the Laravel API remains the final authority for every protected action.
