import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { UserMenu } from "~/lib/components/UserMenu";

// Create a server function to check authentication
const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getSupabaseServerClient } = await import("~/lib/server/auth");
    const supabase = getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authenticated: false };
    }

    // Return only serializable user data
    const { id, email, user_metadata, app_metadata } = user;
    return {
      authenticated: true,
      user: { id, email, user_metadata, app_metadata }
    };
  } catch (error) {
    console.error(error);
    return { authenticated: false };
  }
});

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  loader: async ({ context }) => {
    // Invalidate the query to ensure fresh data
    await context.queryClient.invalidateQueries({ queryKey: ["dashboard-auth"] });

    // Use the server function to check authentication
    const result = await context.queryClient.fetchQuery({
      queryKey: ["dashboard-auth"],
      queryFn: () => checkAuth(),
      staleTime: 0, // Consider the data stale immediately
    });

    if (!result.authenticated) {
      throw redirect({
        to: "/signin",
        search: {
          error: "unauthorized",
          redirect: "/dashboard"
        }
      });
    }

    return { user: result.user };
  },
});

function DashboardLayout() {
  const { user } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="font-bold text-xl">
              <Link to="/">Heartwood</Link>
            </div>
            <nav className="flex items-center gap-2">
              <UserMenu email={user?.email} />
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
