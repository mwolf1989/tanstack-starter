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
│   │   │   ├── ui/         # shadcn/ui components (Button, Card, Input, etc.)
│   │   │   └── OrganizationSwitcher.tsx  # Org selection dropdown
│   │   ├── server/         # Server-side utilities
│   │   │   ├── auth.ts     # Supabase SSR client and auth helpers
│   │   │   ├── db.ts       # Database client instances
│   │   │   └── organizations.ts  # Organization management functions
│   │   └── styles/         # Global CSS styles
│   ├── routes/             # TanStack Router file-based routes
│   │   ├── __root.tsx      # Root layout with user context
│   │   ├── index.tsx       # Home page (minimal landing)
│   │   ├── signin.tsx      # Authentication page
│   │   └── dashboard/      # Protected dashboard routes
│   │       ├── route.tsx   # Dashboard layout with auth guard
│   │       ├── index.tsx   # Dashboard index with org context
│   │       └── organizations/  # Organization management routes
│   │           ├── index.tsx      # List user's organizations
│   │           ├── new.tsx        # Create new organization
│   │           └── $orgId/        # Org-specific routes
│   │               ├── index.tsx    # Organization details
│   │               ├── settings.tsx # Organization settings
│   │               └── members.tsx  # Member management
│   ├── schema/             # Zod validation schemas
│   │   ├── index.ts        # Schema exports
│   │   └── organization.ts # Organization-related schemas
│   └── router.tsx          # Router configuration
├── supabase/
│   ├── migrations/         # Database migrations
│   │   ├── 20240320000000_create_todos.sql
│   │   ├── 20240321000000_create_organizations.sql
│   │   └── 20240322000000_add_org_to_todos.sql
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

## Multi-Tenancy Architecture

This starter kit includes a complete multi-tenancy implementation using an organization-based model.

### Database Schema

#### Core Tables

```
organizations
├── id (uuid, PK)
├── name (text)
├── slug (text, unique) - URL-friendly identifier
├── logo_url (text, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)

organization_members
├── id (uuid, PK)
├── organization_id (uuid, FK → organizations)
├── user_id (uuid, FK → auth.users)
├── role (enum: 'owner', 'admin', 'member')
├── created_at (timestamp)
└── updated_at (timestamp)
└── UNIQUE (organization_id, user_id)

user_profiles
├── id (uuid, PK, FK → auth.users)
├── display_name (text, nullable)
├── avatar_url (text, nullable)
├── current_organization_id (uuid, FK → organizations)
├── created_at (timestamp)
└── updated_at (timestamp)
```

#### Data Tables Pattern

All tenant-scoped data tables should include:
```sql
organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE
```

Example (todos table):
```sql
ALTER TABLE todos ADD COLUMN organization_id uuid REFERENCES organizations(id);
```

### Row Level Security (RLS)

#### Helper Functions

```sql
-- Check if user is member of organization
is_organization_member(org_id uuid) → boolean

-- Check if user has specific role
has_organization_role(org_id uuid, role organization_role) → boolean

-- Check if user is admin or owner
is_organization_admin(org_id uuid) → boolean

-- Check if user is owner
is_organization_owner(org_id uuid) → boolean

-- Get user's organization IDs
get_user_organization_ids() → SETOF uuid

-- Get current/active organization
get_current_organization_id() → uuid
```

#### Policy Patterns

**Organization-scoped data (e.g., todos, projects):**
```sql
-- SELECT: Members can view org data
CREATE POLICY "..." ON table_name FOR SELECT
  USING (is_organization_member(organization_id));

-- INSERT: Members can create in their orgs
CREATE POLICY "..." ON table_name FOR INSERT
  WITH CHECK (is_organization_member(organization_id) AND user_id = auth.uid());

-- UPDATE: Creator or admin can update
CREATE POLICY "..." ON table_name FOR UPDATE
  USING (user_id = auth.uid() OR is_organization_admin(organization_id));

-- DELETE: Creator or admin can delete
CREATE POLICY "..." ON table_name FOR DELETE
  USING (user_id = auth.uid() OR is_organization_admin(organization_id));
```

### Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Owner** | Full control, can delete org, transfer ownership, manage all members |
| **Admin** | Manage members (except owners), update org settings, full data access |
| **Member** | Read org data, create/update/delete own data |

### Key Files

```
src/
├── lib/
│   ├── server/
│   │   └── organizations.ts  # Server functions for org management
│   └── components/
│       └── OrganizationSwitcher.tsx  # Org selection dropdown
├── routes/
│   └── dashboard/
│       └── organizations/
│           ├── index.tsx     # List organizations
│           ├── new.tsx       # Create organization
│           └── $orgId/
│               ├── index.tsx    # Org details
│               ├── settings.tsx # Org settings (admin)
│               └── members.tsx  # Member management
└── schema/
    └── organization.ts  # Zod schemas for validation
```

### Server Functions

```typescript
// Queries
getUserOrganizations()     // Get all orgs user is member of
getOrganization({ id })    // Get single org by ID
getOrganizationBySlug({ slug })
getOrganizationMembers({ organizationId })
getUserProfile()           // Get current user's profile
getUserRoleInOrganization({ organizationId })

// Mutations
createOrganization({ name, slug, logo_url? })
updateOrganization({ id, updates })
deleteOrganization({ id })  // Owner only
setCurrentOrganization({ organizationId })
addOrganizationMember({ organizationId, userId, role })
updateMemberRole({ memberId, role })
removeMember({ memberId })
leaveOrganization({ organizationId })
checkSlugAvailability({ slug })
```

### Usage Pattern

```typescript
// In a route loader - get org context
export const Route = createFileRoute("/dashboard/projects")({
  loader: async ({ context }) => {
    const profile = await getUserProfile();
    if (!profile?.current_organization_id) {
      throw redirect({ to: "/dashboard/organizations" });
    }

    const projects = await getOrgProjects({
      organizationId: profile.current_organization_id
    });
    return { projects };
  },
});

// In a component - use org context
function ProjectsList() {
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
  });

  const orgId = profile?.current_organization_id;
  // ... use orgId for data fetching
}
```

### Database Migrations

```
supabase/migrations/
├── 20240320000000_create_todos.sql        # Original todos (user-only)
├── 20240321000000_create_organizations.sql # Multi-tenancy core
└── 20240322000000_add_org_to_todos.sql    # Update todos for multi-tenancy
```

### Future Enhancements

- [ ] Email-based member invitations
- [ ] Organization-scoped API keys
- [ ] Billing/subscription per organization
- [ ] Organization-level settings/preferences
- [ ] Audit logging per organization
- [ ] Custom domain per organization

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
