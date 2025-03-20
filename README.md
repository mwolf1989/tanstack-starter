# [TanStack Starter](https://github.com/mwolf1989/tanstack-starter)

A minimal starter template for 🏝️ TanStack Start with Supabase authentication, forked from [dotnize/tanstarter](https://github.com/dotnize/tanstarter).

- [React 19](https://react.dev) + [React Compiler](https://react.dev/learn/react-compiler)
- TanStack [Start](https://tanstack.com/start/latest) + [Router](https://tanstack.com/router/latest) + [Query](https://tanstack.com/query/latest)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) Authentication with SSR
- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL

## Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/mwolf1989/tanstack-starter.git
   ```

2. Install dependencies:
   ```bash
   pnpm install # npm install
   ```

3. Create a `.env` file based on [`.env.example`](./.env.example) and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Push the schema to your database with drizzle-kit:
   ```bash
   pnpm db push # npm run db push
   ```
   https://orm.drizzle.team/docs/migrations

5. Run the development server:
   ```bash
   pnpm dev # npm run dev
   ```
   The development server should be now running at [http://localhost:3000](http://localhost:3000).

## Authentication with Supabase

This template uses Supabase for authentication with server-side rendering (SSR) support. Key features:

- Server-side authentication using `@supabase/ssr`
- Proper cookie handling for authentication tokens
- Protected routes with automatic redirection
- Email/Password and OAuth authentication support
- Type-safe authentication functions

### Authentication Flow

1. **Sign In**: Server-side authentication with proper cookie management
   ```typescript
   const signInFn = createServerFn()
     .validator((d) => d as SignInCredentials)
     .handler(async ({ data }) => {
       const supabase = getSupabaseServerClient();
       const { error } = await supabase.auth.signInWithPassword(data);
       // Cookies are automatically handled
       return error ? { error: true } : { success: true };
     });
   ```

2. **Protected Routes**: Automatic authentication checks and redirects
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

## Issue watchlist

- [React Compiler docs](https://react.dev/learn/react-compiler), [Working Group](https://github.com/reactwg/react-compiler/discussions) - React Compiler is still in beta. You can disable it in [app.config.ts](./app.config.ts#L15) if you prefer.
- https://github.com/TanStack/router/discussions/2863 - TanStack Start is currently in beta and may still undergo major changes.
- https://github.com/shadcn-ui/ui/discussions/6714 - We're using the `canary` version of shadcn/ui for Tailwind v4 support.

## Scripts

These scripts in [package.json](./package.json#L5) use **pnpm** by default, but you can modify them to use your preferred package manager.

- **`db`** - Run drizzle-kit commands. (e.g. `pnpm db generate` to generate a migration)
- **`ui`** - The shadcn/ui CLI. (e.g. `pnpm ui add button` to add the button component)
- **`format`** and **`lint`** - Run Prettier and ESLint.

## Building for production

Read the [hosting docs](https://tanstack.com/start/latest/docs/framework/react/hosting) for information on how to deploy your TanStack Start app.

## Acknowledgements

- [dotnize/tanstarter](https://github.com/dotnize/tanstarter) - The original template this project is based on
- [nekochan0122/tanstack-boilerplate](https://github.com/nekochan0122/tanstack-boilerplate) - A batteries-included TanStack Start boilerplate that inspired some patterns
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs) for SSR authentication implementation
