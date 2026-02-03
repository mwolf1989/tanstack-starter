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
│   │   ├── index.tsx       # Home page (minimal landing)
│   │   ├── signin.tsx      # Authentication page
│   │   └── dashboard/      # Protected dashboard routes
│   │       ├── route.tsx   # Dashboard layout with auth guard
│   │       └── index.tsx   # Dashboard index
│   ├── schema/             # Zod validation schemas (add new schemas here)
│   └── router.tsx          # Router configuration
├── supabase/
│   ├── migrations/         # Database migrations
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
Data schemas should use Zod for runtime validation:
```typescript
import { z } from 'zod';

export const CreateEntitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});
export type CreateEntityData = z.infer<typeof CreateEntitySchema>;
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

# Configure Supabase credentials in .env (see .env.example):
# - VITE_SUPABASE_URL and SUPABASE_URL (same value)
# - VITE_SUPABASE_ANON_KEY and SUPABASE_ANON_KEY (same value)
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
- Schemas: entity name (e.g., `user.ts`, `project.ts`)

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

## Security & Data Isolation

### Row Level Security (RLS)
All database tables must have RLS enabled for tenant data isolation. Reference implementation in `supabase/migrations/20240320000000_create_todos.sql`:

```sql
-- Enable RLS on the table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data
CREATE POLICY "Users can view their own data"
  ON your_table FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert their own data"
  ON your_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update their own data"
  ON your_table FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own data
CREATE POLICY "Users can delete their own data"
  ON your_table FOR DELETE
  USING (auth.uid() = user_id);
```

### Server-Side Auth Checks
Always verify authentication in server functions before database operations:

```typescript
const getData = createServerFn({ method: "GET" }).handler(async () => {
  const { getSupabaseServerClient } = await import("~/lib/server/auth");
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Proceed with user-scoped query
  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .eq("user_id", user.id);  // Always filter by user_id

  return data;
});
```

### Input Validation
All user inputs must be validated with Zod before processing:

```typescript
const createItem = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: unknown }) => {
    const validated = CreateItemSchema.parse(data);  // Validate first
    // ... proceed with validated data
  });
```

## Multi-Tenancy Considerations

Current implementation uses `user_id` for data isolation (single-user tenancy). For organization-based multi-tenancy, extend with:

1. **Tenant/Organization model**: Add `organization_id` to tables
2. **RLS at tenant level**: `auth.uid() IN (SELECT user_id FROM org_members WHERE org_id = organization_id)`
3. **Role-based access**: Admin vs member permissions within tenants

Architecture decisions to be documented as features are implemented.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL (client-side) | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (client-side) | Yes |
| `SUPABASE_URL` | Supabase project URL (server-side) | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (server-side) | Yes |
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
