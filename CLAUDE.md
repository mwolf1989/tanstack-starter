# Heartwood SaaS Starter

## Overview

Multi-tenant SaaS application starter built with TanStack ecosystem.

**Forked from:** https://github.com/mwolf1989/tanstack-starter
**Original source:** https://github.com/dotnize/tanstarter
**Purpose:** Foundation for multi-tenant SaaS applications

## Technology Stack

### Frontend
- **React 19** with React Compiler (babel-plugin-react-compiler)
- **TanStack Start** - Full-stack React framework with SSR
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Server state management
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** (canary) - Radix-based component library
- **class-variance-authority** - Variant-based component styling

### Backend/Database
- **Supabase** - PostgreSQL database with authentication
- **@supabase/ssr** - Server-side rendering support for auth

### Build Tools
- **Vite 7** - Build tool and dev server
- **TypeScript 5** - Static typing
- **pnpm** (preferred) or npm

### Code Quality
- **ESLint 9** - Flat config with TanStack plugins
- **Prettier** - Code formatting with organize-imports and tailwindcss plugins

## Project Structure

```
heartwood-saas-starter/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/         # shadcn/ui components (Button, Card, Input, etc.)
│   │   ├── server/         # Server-side utilities
│   │   │   ├── auth.ts     # Supabase SSR client and auth helpers
│   │   │   └── db.ts       # Database client instances
│   │   └── styles/         # Global CSS styles
│   ├── routes/             # TanStack Router file-based routes
│   │   ├── __root.tsx      # Root layout with user context
│   │   ├── index.tsx       # Home page
│   │   ├── signin.tsx      # Authentication page
│   │   ├── dashboard/      # Protected dashboard routes
│   │   │   ├── route.tsx   # Dashboard layout with auth guard
│   │   │   └── index.tsx   # Dashboard index
│   │   └── tasks/          # Tasks feature routes
│   ├── schema/             # Zod validation schemas
│   │   └── todo.ts         # Todo entity schemas
│   └── router.tsx          # Router configuration
├── supabase/
│   ├── migrations/         # Database migrations
│   ├── seed.sql            # Sample seed data
│   └── config.toml         # Supabase local config
├── public/                 # Static assets
├── .cursor/                # Cursor IDE MCP configuration
└── .vscode/                # VSCode settings
```

## Key Patterns

### Server Functions (createServerFn)
Server-side logic is implemented using TanStack Start's `createServerFn`:
```typescript
const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { getSupabaseServerClient } = await import("~/lib/server/auth");
  const supabase = getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { authenticated: !error && !!user, user };
});
```

### Protected Routes
Routes are protected using loader functions with redirects:
```typescript
export const Route = createFileRoute("/dashboard")({
  loader: async ({ context }) => {
    const result = await context.queryClient.fetchQuery({
      queryKey: ["dashboard-auth"],
      queryFn: () => checkAuth(),
    });
    if (!result.authenticated) {
      throw redirect({ to: "/signin" });
    }
    return { user: result.user };
  },
});
```

### Validation with Zod
All data schemas use Zod for runtime validation:
```typescript
export const CreateTodoSchema = z.object({
  task: z.string().min(4, 'Task must be at least 4 characters long'),
});
export type CreateTodoData = z.infer<typeof CreateTodoSchema>;
```

### Component Pattern (shadcn/ui)
UI components use class-variance-authority for variants:
```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
});
```

## Path Aliases

- `~/` maps to `./src/` (configured in tsconfig.json)

Example: `import { Button } from "~/lib/components/ui/button"`

## Development Workflow

### Setup
```bash
# Clone repository
git clone https://github.com/heartwood-agency/heartwood-saas-starter.git
cd heartwood-saas-starter

# Install dependencies
pnpm install  # or npm install

# Copy environment file
cp .env.example .env

# Configure Supabase credentials in .env:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### Development
```bash
pnpm dev          # Start dev server at http://localhost:3000
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm ui add <component>  # Add shadcn/ui components
```

### Database
```bash
pnpm supabase link --project-ref <ref>  # Link to Supabase project
pnpm db:seed                             # Reset and seed database
```

### Production
```bash
pnpm build        # Build for production
pnpm start        # Start production server
```

## Code Conventions

### TypeScript
- Strict mode enabled with `strictNullChecks`
- Use interfaces for object shapes, types for unions/aliases
- Prefer `type X = z.infer<typeof Schema>` for validated types
- Path alias `~/` for src imports

### Components
- Functional components with hooks only
- Props defined inline or with ComponentProps extension
- Named exports for components and utilities
- Default exports only for route components (TanStack Router convention)

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Routes: lowercase matching URL path (`signin.tsx`, `route.tsx`)
- Schemas: entity name (`todo.ts`)

### Import Order (auto-sorted by Prettier)
1. External dependencies
2. Internal components (`~/lib/components/...`)
3. Internal utilities (`~/lib/...`)
4. Types and schemas

### Styling
- Tailwind CSS utility classes inline
- `cn()` helper for conditional classes
- CSS variables for theming (dark mode support)

## Authentication

### Flow
1. User submits credentials on `/signin`
2. Server function calls Supabase auth
3. Cookies are set automatically via `@supabase/ssr`
4. Protected routes check auth in loader, redirect if unauthorized

### Key Files
- `src/lib/server/auth.ts` - Supabase SSR client, auth helpers
- `src/routes/signin.tsx` - Sign in/up UI
- `src/routes/dashboard/route.tsx` - Protected layout example

## Multi-Tenancy Considerations

> TBD - See HEA-27 for codebase analysis

Architecture, tenant isolation, and data segregation strategies to be documented after analysis.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | For admin ops |
| `VITE_BASE_URL` | Application base URL | Yes |
| `DATABASE_URL` | Direct database connection | For migrations |

### OAuth Providers (optional)
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## MCP Integration

Model Context Protocol is configured for AI tool integration. See `.cursor/mcp.json` for Supabase database access configuration.

## Known Issues & Watchlist

- React Compiler is in beta - can be disabled in `vite.config.ts`
- TanStack Start is in beta - may have breaking changes
- shadcn/ui canary is used for Tailwind v4 support

## Additional Resources

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/)
