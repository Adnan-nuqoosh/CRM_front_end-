# Sultan Loofah General Trading (Frontend)

Production-focused Next.js (App Router) codebase with feature-driven architecture, strict TypeScript, Tailwind CSS, and enforced code quality gates.

## Scripts

- **dev**: `npm run dev`
- **build**: `npm run build`
- **lint**: `npm run lint`
- **format**: `npm run format`
- **test**: `npm run test`

## Architecture (permanent)

- **`src/app`**: App Router routes (`page.tsx`, `layout.tsx`, route segments)
- **`src/features`**: Domain modules (`<feature>/components|hooks|services|types|utils`)
- **`src/shared`**: Reusable UI/hooks/lib/constants/types
- **`src/core`**: Providers, store, API client, config, middleware

## Conventions

- **TypeScript**: `strict: true`, no `any` (use `unknown` + narrowing)
- **Imports**: absolute imports via `@/` (configured in `tsconfig.json`)
- **Barrel exports**: prefer importing from `index.ts` re-exports when available
- **Styling**: Tailwind CSS; avoid inline styles except rare overrides
- **State**: global state in `src/core/store` (or intentional Context in `src/core/contexts`)
- **API**: all network calls go through `src/core/api` (`apiClient`) with typed responses and centralized errors
- **Hooks**: reusable hooks in `src/shared/hooks`, feature hooks in `src/features/<feature>/hooks`
- **Tests**: Jest + RTL, colocated next to the unit under test (`*.test.tsx`)
- **Docs**: add JSDoc/TSDoc for every exported function/component/hook/type

## Automated enforcement

- **ESLint + Prettier** are configured for consistent style.
- **Husky + lint-staged** run on commit to auto-fix lint and formatting issues.
- **Cursor rules** live in `.cursor/rules/*.mdc` and codify the permanent architecture and patterns for new code.
