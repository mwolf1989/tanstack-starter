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
import {
  getUserOrganizations,
  getUserProfile,
} from "~/lib/server/organizations";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: () => getUserOrganizations(),
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
  });

  const currentOrg = organizations.find(
    (org) => org.id === profile?.current_organization_id
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          {currentOrg
            ? `Working in ${currentOrg.name}`
            : "Welcome to your dashboard."}
        </p>
      </div>

      {/* No organization prompt */}
      {!orgsLoading && organizations.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>Get Started with Organizations</CardTitle>
            <CardDescription>
              Create your first organization to start collaborating with your
              team and access multi-tenant features.
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
      )}

      {/* Current organization overview */}
      {currentOrg && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Current Organization</CardTitle>
              <CardDescription>
                You're working in {currentOrg.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xl font-bold">
                  {currentOrg.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{currentOrg.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {currentOrg.role}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link
                  to="/dashboard/organizations/$orgId"
                  params={{ orgId: currentOrg.id }}
                >
                  View Organization
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Organizations</CardTitle>
              <CardDescription>
                You're a member of {organizations.length} organization
                {organizations.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {organizations.slice(0, 3).map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-medium">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{org.name}</span>
                    {org.id === currentOrg.id && (
                      <span className="text-xs text-muted-foreground">
                        (current)
                      </span>
                    )}
                  </div>
                ))}
                {organizations.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{organizations.length - 3} more
                  </p>
                )}
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/dashboard/organizations">Manage Organizations</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Multi-tenancy is configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Your application now supports multiple organizations with
                role-based access control.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Create organizations</li>
                <li>Invite team members</li>
                <li>Manage roles and permissions</li>
                <li>Switch between organizations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Organizations list when no current org selected */}
      {!orgsLoading && organizations.length > 0 && !currentOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Select an Organization</CardTitle>
            <CardDescription>
              Choose an organization to work in from your memberships.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <Button
                  key={org.id}
                  asChild
                  variant="outline"
                  className="justify-start h-auto py-3"
                >
                  <Link
                    to="/dashboard/organizations/$orgId"
                    params={{ orgId: org.id }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {org.role}
                        </p>
                      </div>
                    </div>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
