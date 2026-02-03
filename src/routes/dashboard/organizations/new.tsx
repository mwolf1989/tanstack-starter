import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { Button } from "~/lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/lib/components/ui/card";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import {
  createOrganization,
  checkSlugAvailability,
} from "~/lib/server/organizations";
import { CreateOrganizationSchema } from "~/schema/organization";

export const Route = createFileRoute("/dashboard/organizations/new")({
  component: NewOrganization,
});

function NewOrganization() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (generatedSlug.length >= 3) {
        setSlug(generatedSlug);
      }
    }
  }, [name, slugManuallyEdited]);

  // Check slug availability with debounce
  useEffect(() => {
    if (slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const available = await checkSlugAvailability({ data: { slug } });
        setSlugAvailable(available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [slug]);

  const createOrgMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      createOrganization({ data }),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      navigate({
        to: "/dashboard/organizations/$orgId",
        params: { orgId: org.id },
      });
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const result = CreateOrganizationSchema.safeParse({ name, slug });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (slugAvailable === false) {
      setErrors({ slug: "This slug is already taken" });
      return;
    }

    createOrgMutation.mutate({ name, slug });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Create Organization
        </h1>
        <p className="text-muted-foreground mt-2">
          Set up a new organization to collaborate with your team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Choose a name and URL slug for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Acme Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/org/</span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="acme-inc"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase());
                    setSlugManuallyEdited(true);
                  }}
                  className={errors.slug ? "border-destructive" : ""}
                />
              </div>
              <div className="flex items-center gap-2 min-h-[20px]">
                {checkingSlug && (
                  <span className="text-sm text-muted-foreground">
                    Checking availability...
                  </span>
                )}
                {!checkingSlug && slug.length >= 3 && slugAvailable === true && (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Available
                  </span>
                )}
                {!checkingSlug && slug.length >= 3 && slugAvailable === false && (
                  <span className="text-sm text-destructive flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Already taken
                  </span>
                )}
              </div>
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 3 characters. Only lowercase letters, numbers,
                and hyphens allowed.
              </p>
            </div>

            {errors.submit && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {errors.submit}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/dashboard/organizations" })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createOrgMutation.isPending ||
                  slugAvailable === false ||
                  checkingSlug
                }
              >
                {createOrgMutation.isPending
                  ? "Creating..."
                  : "Create Organization"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
