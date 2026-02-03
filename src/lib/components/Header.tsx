import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";
import type { UserData } from "~/routes/__root";

interface HeaderProps {
  user: UserData | null;
  onSignOut: () => Promise<void>;
}

export function Header({ user, onSignOut }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="font-bold text-xl">Heartwood</div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSignOut}
                  className="text-destructive hover:text-destructive"
                >
                  Sign out, {user.email}
                </Button>
              </>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link to="/signin" search={{ error: "", redirect: "/" }}>Sign in</Link>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
} 