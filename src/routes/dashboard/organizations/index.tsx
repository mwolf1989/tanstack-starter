import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "~/lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/lib/components/ui/card";
import { getUserOrganizations } from "~/lib/server/organizations";
import type { OrganizationWithRole } from "~/schema/organization";

export const Route = createFileRoute("/dashboard/organizations/")({
  component: OrganizationsIndex,
});

function OrganizationsIndex() {
  const {
    data: organizations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: () => getUserOrganizations(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground mt-2">
              Manage your organizations and team members.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-destructive mt-2">
            Failed to load organizations. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organizations and team members.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/organizations/new">Create Organization</Link>
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No organizations yet</CardTitle>
            <CardDescription>
              Create your first organization to get started with team
              collaboration.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/dashboard/organizations/new">
                Create Your First Organization
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrganizationCard({
  organization,
}: {
  organization: OrganizationWithRole;
}) {
  const roleColors = {
    owner: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    member:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
              {organization.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{organization.name}</CardTitle>
              <CardDescription className="font-mono text-xs">
                /{organization.slug}
              </CardDescription>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[organization.role]}`}
          >
            {organization.role}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link
              to="/dashboard/organizations/$orgId"
              params={{ orgId: organization.id }}
            >
              View Details
            </Link>
          </Button>
          {(organization.role === "owner" ||
            organization.role === "admin") && (
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link
                to="/dashboard/organizations/$orgId/settings"
                params={{ orgId: organization.id }}
              >
                Settings
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
