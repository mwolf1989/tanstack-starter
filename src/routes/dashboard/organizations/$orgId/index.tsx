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
  getOrganization,
  getOrganizationMembers,
  getUserRoleInOrganization,
} from "~/lib/server/organizations";

export const Route = createFileRoute("/dashboard/organizations/$orgId/")({
  component: OrganizationDetails,
});

function OrganizationDetails() {
  const { orgId } = Route.useParams();

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization({ data: { id: orgId } }),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["organization-members", orgId],
    queryFn: () => getOrganizationMembers({ data: { organizationId: orgId } }),
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role", orgId],
    queryFn: () => getUserRoleInOrganization({ data: { organizationId: orgId } }),
  });

  const isAdmin = userRole === "owner" || userRole === "admin";

  if (orgLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-2" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organization Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            This organization does not exist or you don't have access to it.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/organizations">Back to Organizations</Link>
        </Button>
      </div>
    );
  }

  const roleColors = {
    owner: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    member: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground text-2xl font-bold">
            {organization.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {organization.name}
            </h1>
            <p className="text-muted-foreground font-mono">
              /{organization.slug}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button asChild variant="outline">
            <Link
              to="/dashboard/organizations/$orgId/settings"
              params={{ orgId }}
            >
              Settings
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Members Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              {isAdmin && (
                <Button asChild size="sm">
                  <Link
                    to="/dashboard/organizations/$orgId/members"
                    params={{ orgId }}
                  >
                    Manage
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {(member.user.display_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user.display_name || "User"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role as keyof typeof roleColors]}`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))}
                {members.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    +{members.length - 5} more members
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Info</CardTitle>
            <CardDescription>Details about your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Your Role</p>
              <p className="font-medium capitalize">{userRole || "Member"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(organization.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organization ID</p>
              <p className="font-mono text-xs text-muted-foreground">
                {organization.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
