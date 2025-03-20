import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function Features() {
  return (
    <section className="py-32 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-16">Features</h2>
      <div className="grid md:grid-cols-3 gap-12">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Built-in auth with Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Secure authentication system with email/password and social providers.
            </p>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Modern UI</CardTitle>
            <CardDescription>Beautiful components with shadcn/ui</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Accessible and customizable components built on Radix UI.
            </p>
          </CardContent>
        </Card>
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Type Safety</CardTitle>
            <CardDescription>Full TypeScript support</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              End-to-end type safety with TanStack Router and TypeScript.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
} 