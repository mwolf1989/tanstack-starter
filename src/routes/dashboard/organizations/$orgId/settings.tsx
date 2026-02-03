import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Separator } from "~/lib/components/ui/separator";
import {
  getOrganization,
  getUserRoleInOrganization,
  updateOrganization,
  deleteOrganization,
  leaveOrganization,
} from "~/lib/server/organizations";

export const Route = createFileRoute(
  "/dashboard/organizations/$orgId/settings"
)({
  component: OrganizationSettings,
});

function OrganizationSettings() {
  const { orgId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization({ data: { id: orgId } }),
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role", orgId],
    queryFn: () => getUserRoleInOrganization({ data: { organizationId: orgId } }),
  });

  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const isOwner = userRole === "owner";
  const isAdmin = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    if (organization) {
      setName(organization.name);
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: (updates: { name?: string }) =>
      updateOrganization({ data: { id: orgId, updates } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      setErrors({});
    },
    onError: (error) => {
      setErrors({ update: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization({ data: { id: orgId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      navigate({ to: "/dashboard/organizations" });
    },
    onError: (error) => {
      setErrors({ delete: error.message });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveOrganization({ data: { organizationId: orgId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      navigate({ to: "/dashboard/organizations" });
    },
    onError: (error) => {
      setErrors({ leave: error.message });
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name !== organization?.name) {
      updateMutation.mutate({ name });
    }
  };

  const handleDelete = () => {
    if (deleteConfirmText === organization?.name) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
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
          <p className="text-muted-foreground mt-2">
            Organization not found or you don't have access.
          </p>
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
            You don't have permission to access organization settings.
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Organization Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage settings for {organization.name}
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your organization's basic information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/org/</span>
                <Input value={organization.slug} disabled className="bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground">
                The URL slug cannot be changed after creation.
              </p>
            </div>

            {errors.update && (
              <p className="text-sm text-destructive">{errors.update}</p>
            )}

            <Button
              type="submit"
              disabled={updateMutation.isPending || name === organization.name}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Leave Organization (non-owners) */}
      {!isOwner && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-600 dark:text-amber-400">
              Leave Organization
            </CardTitle>
            <CardDescription>
              Remove yourself from this organization. You'll lose access to all
              organization resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors.leave && (
              <p className="text-sm text-destructive mb-4">{errors.leave}</p>
            )}
            <Button
              variant="outline"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
            >
              {leaveMutation.isPending ? "Leaving..." : "Leave Organization"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone (owners only) */}
      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this organization. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Organization
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Type <strong>{organization.name}</strong> to confirm deletion:
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={organization.name}
                />
                {errors.delete && (
                  <p className="text-sm text-destructive">{errors.delete}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={
                      deleteConfirmText !== organization.name ||
                      deleteMutation.isPending
                    }
                  >
                    {deleteMutation.isPending
                      ? "Deleting..."
                      : "Permanently Delete"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
