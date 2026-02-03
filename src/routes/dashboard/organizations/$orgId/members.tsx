import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  updateMemberRole,
  removeMember,
} from "~/lib/server/organizations";
import type { OrganizationRole } from "~/schema/organization";

export const Route = createFileRoute(
  "/dashboard/organizations/$orgId/members"
)({
  component: OrganizationMembers,
});

function OrganizationMembers() {
  const { orgId } = Route.useParams();
  const queryClient = useQueryClient();

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

  const isOwner = userRole === "owner";
  const isAdmin = userRole === "owner" || userRole === "admin";

  const updateRoleMutation = useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: OrganizationRole;
    }) => updateMemberRole({ data: { memberId, role } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-members", orgId],
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember({ data: { memberId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-members", orgId],
      });
    },
  });

  if (orgLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-2" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Not Found</h1>
          <p className="text-muted-foreground mt-2">Organization not found.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/organizations">Back to Organizations</Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You need admin permissions to manage members.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/organizations/$orgId" params={{ orgId }}>
            Back to Organization
          </Link>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground mt-2">
            Manage members of {organization.name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/organizations/$orgId" params={{ orgId }}>
            Back to Overview
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {members.length} member{members.length !== 1 ? "s" : ""} in this
                organization
              </CardDescription>
            </div>
            {/* Future: Add invite member button */}
            {/* <Button size="sm">Invite Member</Button> */}
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded mb-1" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentUserRole={userRole}
                  isOwner={isOwner}
                  roleColors={roleColors}
                  onUpdateRole={(role) =>
                    updateRoleMutation.mutate({ memberId: member.id, role })
                  }
                  onRemove={() => removeMemberMutation.mutate(member.id)}
                  isUpdating={updateRoleMutation.isPending}
                  isRemoving={removeMemberMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">
            Invite Team Members
          </CardTitle>
          <CardDescription>
            Member invitations coming soon. For now, members can be added
            directly via the database.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

interface MemberRowProps {
  member: {
    id: string;
    user_id: string;
    role: string;
    user: {
      id: string;
      display_name?: string | null;
      avatar_url?: string | null;
    };
  };
  currentUserRole: OrganizationRole | null | undefined;
  isOwner: boolean;
  roleColors: Record<string, string>;
  onUpdateRole: (role: OrganizationRole) => void;
  onRemove: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
}

function MemberRow({
  member,
  currentUserRole,
  isOwner,
  roleColors,
  onUpdateRole,
  onRemove,
  isUpdating,
  isRemoving,
}: MemberRowProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const canChangeRole =
    // Owners can change anyone's role (except their own ownership)
    isOwner ||
    // Admins can change member roles
    (currentUserRole === "admin" && member.role === "member");

  const canRemove =
    // Owners can remove anyone except themselves
    (isOwner && member.role !== "owner") ||
    // Admins can remove members
    (currentUserRole === "admin" && member.role === "member");

  const availableRoles: OrganizationRole[] = isOwner
    ? ["owner", "admin", "member"]
    : ["admin", "member"];

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
        {(member.user.display_name || "U").charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {member.user.display_name || "Unnamed User"}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {member.user_id}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Role Badge/Selector */}
        <div className="relative">
          {canChangeRole ? (
            <>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]} cursor-pointer hover:opacity-80`}
                disabled={isUpdating}
              >
                {member.role}
                <svg
                  className="inline-block ml-1 h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showRoleMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowRoleMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border bg-popover p-1 shadow-lg">
                    {availableRoles.map((role) => (
                      <button
                        key={role}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${
                          role === member.role ? "bg-accent" : ""
                        }`}
                        onClick={() => {
                          if (role !== member.role) {
                            onUpdateRole(role);
                          }
                          setShowRoleMenu(false);
                        }}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}
            >
              {member.role}
            </span>
          )}
        </div>

        {/* Remove Button */}
        {canRemove && (
          <div className="relative">
            {!showRemoveConfirm ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRemoveConfirm(true)}
                className="text-muted-foreground hover:text-destructive"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRemoveConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onRemove();
                    setShowRemoveConfirm(false);
                  }}
                  disabled={isRemoving}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
