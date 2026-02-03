import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "~/lib/components/ui/button";
import {
  getUserOrganizations,
  getUserProfile,
  setCurrentOrganization,
} from "~/lib/server/organizations";
import type { OrganizationWithRole } from "~/schema/organization";

export function OrganizationSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: () => getUserOrganizations(),
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
  });

  const setCurrentOrgMutation = useMutation({
    mutationFn: (organizationId: string) =>
      setCurrentOrganization({ data: { organizationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["current-organization"] });
      setIsOpen(false);
    },
  });

  const currentOrg = organizations.find(
    (org) => org.id === profile?.current_organization_id
  );

  if (orgsLoading) {
    return (
      <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
    );
  }

  if (organizations.length === 0) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/dashboard/organizations/new">Create Organization</Link>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[160px] justify-between"
      >
        <span className="truncate">
          {currentOrg?.name || "Select Organization"}
        </span>
        <svg
          className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-md border bg-popover p-1 shadow-lg">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Organizations
            </div>
            <div className="max-h-60 overflow-auto">
              {organizations.map((org) => (
                <OrganizationItem
                  key={org.id}
                  organization={org}
                  isSelected={org.id === profile?.current_organization_id}
                  onSelect={() => setCurrentOrgMutation.mutate(org.id)}
                  isPending={setCurrentOrgMutation.isPending}
                />
              ))}
            </div>
            <div className="border-t mt-1 pt-1">
              <Link
                to="/dashboard/organizations/new"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Organization
              </Link>
              <Link
                to="/dashboard/organizations"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Manage Organizations
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OrganizationItem({
  organization,
  isSelected,
  onSelect,
  isPending,
}: {
  organization: OrganizationWithRole;
  isSelected: boolean;
  onSelect: () => void;
  isPending: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={onSelect}
      disabled={isPending || isSelected}
    >
      <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground text-xs font-medium">
        {organization.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium truncate">{organization.name}</div>
        <div className="text-xs text-muted-foreground">{organization.role}</div>
      </div>
      {isSelected && (
        <svg
          className="h-4 w-4 text-primary"
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
      )}
    </button>
  );
}
