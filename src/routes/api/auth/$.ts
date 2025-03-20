import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSupabaseServerClient } from "~/lib/server/auth";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: async ({ request }) => {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return new Response(null, {
          status: 302,
          headers: { Location: next }
        });
      }
    }

    // Return the user to an error page with instructions
    return new Response(null, {
      status: 302,
      headers: { Location: '/signin?error=Could not authenticate user' }
    });
  },
  POST: async ({ request }) => {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return new Response(null, {
          status: 302,
          headers: { Location: next }
        });
      }
    }

    // Return the user to an error page with instructions
    return new Response(null, {
      status: 302,
      headers: { Location: '/signin?error=no-code-found' }
    });
  },
});
