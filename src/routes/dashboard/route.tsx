import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "~/lib/components/ui/button";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "~/lib/server/auth";

// Create a server function to check authentication
const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return { authenticated: false };
    }
    
    // Return only serializable user data
    const { id, email, user_metadata, app_metadata } = session.user;
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
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-4xl font-bold">Dashboard Layout</h1>
      <div className="flex items-center gap-2">
        This is a protected layout:
        <pre className="rounded-md border bg-card p-1 text-card-foreground">
          routes/dashboard/route.tsx
        </pre>
      </div>

      <div className="rounded-md border bg-card p-4">
        <h2 className="text-xl font-semibold mb-2">User Info</h2>
        <pre className="text-sm">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <Button type="button" asChild className="w-fit" size="lg">
        <Link to="/">Back to Home</Link>
      </Button>

      <Outlet />
    </div>
  );
}
