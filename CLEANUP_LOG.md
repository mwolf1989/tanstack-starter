# Boilerplate Cleanup Log

## Date: 2026-02-01

## Overview

Cleaned up boilerplate and demo content from the TanStack starter template to provide a clean foundation for the Heartwood SaaS application.

## Removed Files

### Demo Components
- `src/lib/components/Hero.tsx` - Marketing hero section with TanStarter branding
- `src/lib/components/Features.tsx` - Feature showcase cards for starter template

### Demo Routes
- `src/routes/tasks/route.tsx` - Demo CRUD tasks layout
- `src/routes/tasks/index.tsx` - Demo todos list with full CRUD implementation

### Demo Schemas
- `src/schema/todo.ts` - Zod validation schemas for demo todos feature

### Demo Data
- `supabase/seed.sql` - Sample todo seed data

## Modified Files

### Branding Updates
- `src/lib/components/Header.tsx` - Changed "TanStarter" to "Heartwood"
- `src/lib/components/Footer.tsx` - Updated footer with Heartwood branding and links
- `src/routes/__root.tsx` - Changed page title to "Heartwood SaaS"
- `package.json` - Changed package name to "heartwood-saas-starter"

### Page Updates
- `src/routes/index.tsx` - Created minimal landing page (removed Hero/Features)
- `src/routes/dashboard/route.tsx` - Cleaned up demo layout, added proper navigation
- `src/routes/dashboard/index.tsx` - Created clean dashboard welcome page

### Schema Updates
- `src/schema/index.ts` - Cleared todo export, ready for new schemas

## Preserved Infrastructure

### Essential Components (kept)
- UI components (`src/lib/components/ui/`) - Button, Card, Input, Label, Separator
- `ThemeToggle.tsx` - Dark mode toggle
- `DefaultCatchBoundary.tsx` - Error boundary
- `NotFound.tsx` - 404 page

### Server Infrastructure (kept)
- `src/lib/server/auth.ts` - Supabase SSR client and auth helpers
- `src/lib/server/db.ts` - Database client instances

### Authentication (kept)
- `src/routes/signin.tsx` - Full authentication page with email/OAuth
- Route protection patterns in dashboard

### Build Configuration (kept)
- `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`
- ESLint and Prettier configurations
- Environment setup

### Database Infrastructure (kept)
- `supabase/migrations/` - Database migration files (todos table kept as RLS reference)
- `supabase/config.toml` - Supabase local configuration

## Post-Cleanup State

- Build: PASSING
- Lint: PASSING
- Core infrastructure: PRESERVED
- Ready for feature development

## Testing Performed

1. `pnpm build` - Successful
2. `pnpm lint` - No errors

## Notes

- The todos database migration (`supabase/migrations/20240320000000_create_todos.sql`) contains Row Level Security (RLS) policy examples that serve as a reference for multi-tenant data isolation patterns. **Keep this migration as a template until new entity migrations with RLS are established.**
- All original author references have been replaced with Heartwood branding
- The application now provides a clean slate while maintaining all essential infrastructure patterns
