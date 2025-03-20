import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { Button } from "~/lib/components/ui/button";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/lib/components/ui/card";
import { useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import authClient from "~/lib/auth-client";
import { getSupabaseServerClient } from "~/lib/server/auth";

const REDIRECT_URL = "/dashboard";

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignInResult {
  error?: boolean;
  message?: string;
  success?: boolean;
}

// Create a server function for sign-in that matches the example
export const signInFn = createServerFn()
  .validator((d: unknown) => d as SignInCredentials)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        error: true,
        message: error.message,
      } as SignInResult;
    }
    
    // Return nothing on success, cookies are already set
    return { success: true } as SignInResult;
  });

export const Route = createFileRoute("/signin")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: search.error as string | undefined,
      redirect: search.redirect as string | undefined,
    };
  },
  beforeLoad: async ({ context, search }) => {
    // Check if user is already authenticated
    if (context.user) {
      throw redirect({
        to: search.redirect || REDIRECT_URL,
      });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInFn({ data: { email, password } });
      
      if (result && result.error) {
        setError(result.message || "Authentication failed");
      } else {
        await router.invalidate();
        router.navigate({ to: REDIRECT_URL });
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Choose your preferred sign in method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {search.error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {search.error === "unauthorized"
                ? "Please sign in to access this page"
                : search.error}
            </div>
          )}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in with Email"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SignInButton
              provider="discord"
              label="Discord"
              className="bg-[#5865F2] hover:bg-[#5865F2]/80"
            />
            <SignInButton
              provider="github"
              label="GitHub"
              className="bg-neutral-700 hover:bg-neutral-700/80"
            />
            <SignInButton
              provider="google"
              label="Google"
              className="bg-[#DB4437] hover:bg-[#DB4437]/80"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SignInButtonProps extends ComponentProps<typeof Button> {
  provider: "discord" | "google" | "github";
  label: string;
}

function SignInButton({ provider, label, className, ...props }: SignInButtonProps) {
  const router = useRouter();
  const handleOAuthSignIn = async () => {
    try {
      const { data, error } = await authClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${REDIRECT_URL}`,
        },
      });
      if (error) throw error;
      await router.invalidate();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("OAuth sign in error:", error);
    }
  };

  return (
    <Button
      onClick={handleOAuthSignIn}
      type="button"
      size="lg"
      className={cn("text-white hover:text-white", className)}
      {...props}
    >
      Sign in with {label}
    </Button>
  );
}
