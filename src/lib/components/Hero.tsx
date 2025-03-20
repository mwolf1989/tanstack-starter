import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

interface HeroProps {
  user: any | null;
}

export function Hero({ user }: HeroProps) {
  return (
    <section className="py-32 text-center max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold tracking-tight mb-6">
        Welcome to TanStarter
      </h1>
      <p className="text-xl text-muted-foreground mb-12">
        A modern starter template built with TanStack Router, React, and Supabase.
        Get started quickly with authentication, routing, and beautiful UI components.
      </p>
      <div className="flex gap-4 justify-center">
        {user ? (
          <Button asChild size="lg">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link to="/signin" search={{ error: "", redirect: "/" }}>Get Started</Link>
          </Button>
        )}
        <Button variant="outline" size="lg" asChild>
          <a
            href="https://github.com/mwolf1989/tanstack-starter"
            target="_blank"
            rel="noreferrer noopener"
          >
            View on GitHub
          </a>
        </Button>
      </div>
    </section>
  );
} 