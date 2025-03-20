import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "~/lib/server/auth";
import { Header } from "~/lib/components/Header";
import { Hero } from "~/lib/components/Hero";
import { Features } from "~/lib/components/Features";
import { Footer } from "~/lib/components/Footer";
import { User } from "@supabase/supabase-js";

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
  const { user } = Route.useLoaderData();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutFn();
      // Refresh the router data
      await router.invalidate();
      router.navigate({ to: "/signin", search: { error: "", redirect: "/" } });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user as User | null} onSignOut={handleSignOut} />
      <main className="flex-1 pt-24 flex flex-col items-center">
        <div className="container mx-auto max-w-7xl px-6">
          <Hero user={user} />
          <Features />
        </div>
      </main>
      <Footer />
    </div>
  );
}
