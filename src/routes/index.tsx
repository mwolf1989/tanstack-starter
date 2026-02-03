import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Header } from "~/lib/components/Header";
import { Footer } from "~/lib/components/Footer";
import { Button } from "~/lib/components/ui/button";

// Create a server function for sign out
export const signOutFn = createServerFn().handler(async () => {
  const { getSupabaseServerClient } = await import("~/lib/server/auth");
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
    return { user: context.user };
  },
});

function Home() {
  const { user } = Route.useLoaderData();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutFn();
      await router.invalidate();
      router.navigate({ to: "/signin", search: { error: "", redirect: "/" } });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={handleSignOut} />
      <main className="flex-1 pt-24 flex flex-col items-center justify-center">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Heartwood SaaS Starter
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Multi-tenant SaaS application foundation built with TanStack, React, and Supabase.
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <Button asChild size="lg">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link to="/signin" search={{ error: "", redirect: "/" }}>
                  Get Started
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
