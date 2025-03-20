import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import ThemeToggle from "~/lib/components/ThemeToggle";
import { Button } from "~/lib/components/ui/button";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "~/lib/server/auth";

// Create a server function for sign out
export const signOutFn = createServerFn().handler(async () => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error);
    return { error: true, message: error.message };
  }
  return { success: true };
});

export const Route = createFileRoute("/")({
  component: Home,
  loader: ({ context }) => {
    // Ensure we're using the latest user data from context
    return { user: context.user };
  },
});

function Home() {
  const { queryClient } = Route.useRouteContext();
  const { user } = Route.useLoaderData();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutFn();
      // Invalidate all auth-related queries
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-auth"] });
      // Refresh the router data
      await router.invalidate();
      router.navigate({ to: "/signin" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-4xl font-bold">TanStarter</h1>
      <div className="flex items-center gap-2">
        This is an unprotected page:
        <pre className="rounded-md border bg-card p-1 text-card-foreground">
          routes/index.tsx
        </pre>
      </div>

      {user ? (
        <div className="flex flex-col gap-2">
          <p>Welcome back, {user.email || "User"}!</p>
          <Button type="button" asChild className="w-fit" size="lg">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <div>
            More data:
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>

          <Button
            onClick={handleSignOut}
            type="button"
            className="w-fit"
            variant="destructive"
            size="lg"
          >
            Sign out
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p>You are not signed in.</p>
          <Button type="button" asChild className="w-fit" size="lg">
            <Link to="/signin">Sign in</Link>
          </Button>
        </div>
      )}

      <ThemeToggle />

      <a
        className="text-muted-foreground underline hover:text-foreground"
        href="https://github.com/dotnize/tanstarter"
        target="_blank"
        rel="noreferrer noopener"
      >
        dotnize/tanstarter
      </a>
    </div>
  );
}
