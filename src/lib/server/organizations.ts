import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  type Organization,
  type OrganizationMember,
  type OrganizationRole,
  type OrganizationWithRole,
  type UserProfile,
} from "~/schema/organization";

import { getSupabaseServerClient } from "./auth";

// =============================================================================
// Organization Queries
// =============================================================================

/**
 * Get all organizations the current user is a member of
 */
export const getUserOrganizations = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrganizationWithRole[]> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
      .from("organization_members")
      .select(
        `
        role,
        organizations (
          id,
          name,
          slug,
          logo_url,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id);

    if (error) {
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    return (data || []).map((member) => ({
      ...(member.organizations as unknown as Organization),
      role: member.role as OrganizationRole,
    }));
  }
);

/**
 * Get a single organization by ID
 */
export const getOrganization = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { id: string } }): Promise<Organization | null> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: org, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", data.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }

    return org as Organization;
  }
);

/**
 * Get a single organization by slug
 */
export const getOrganizationBySlug = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { slug: string } }): Promise<Organization | null> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: org, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", data.slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }

    return org as Organization;
  }
);

/**
 * Get members of an organization
 */
export const getOrganizationMembers = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { organizationId: string } }) => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: members, error } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        organization_id,
        user_id,
        role,
        created_at,
        updated_at,
        user_profiles (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("organization_id", data.organizationId);

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    // Also fetch emails from auth.users via RPC or separate query
    // For now, return without emails (can be enhanced with service role)
    return (members || []).map((member) => ({
      ...member,
      user: {
        id: member.user_id,
        display_name:
          (member.user_profiles as { display_name?: string } | null)
            ?.display_name || null,
        avatar_url:
          (member.user_profiles as { avatar_url?: string } | null)
            ?.avatar_url || null,
      },
    }));
  }
);

/**
 * Get current user's profile
 */
export const getUserProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserProfile | null> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found - profile doesn't exist yet
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return data as UserProfile;
  }
);

/**
 * Get current user's role in an organization
 */
export const getUserRoleInOrganization = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { organizationId: string } }): Promise<OrganizationRole | null> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: membership, error } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", data.organizationId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not a member
      throw new Error(`Failed to fetch role: ${error.message}`);
    }

    return membership.role as OrganizationRole;
  }
);

// =============================================================================
// Organization Mutations
// =============================================================================

/**
 * Create a new organization with the current user as owner
 */
export const createOrganization = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { name: string; slug: string; logo_url?: string | null } }): Promise<Organization> => {
    // Validate input
    const validated = CreateOrganizationSchema.parse(data);

    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Use the helper function that creates org and adds owner atomically
    const { data: orgId, error } = await supabase.rpc(
      "create_organization_with_owner",
      {
        org_name: validated.name,
        org_slug: validated.slug,
        org_logo_url: validated.logo_url || null,
      }
    );

    if (error) {
      if (error.code === "23505") {
        // Unique violation
        throw new Error("An organization with this slug already exists");
      }
      throw new Error(`Failed to create organization: ${error.message}`);
    }

    // Fetch the created organization
    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch created organization: ${fetchError.message}`);
    }

    return org as Organization;
  }
);

/**
 * Update an organization's details (admin/owner only)
 */
export const updateOrganization = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: string; updates: { name?: string; slug?: string; logo_url?: string | null } } }): Promise<Organization> => {
    // Validate updates
    const validatedUpdates = UpdateOrganizationSchema.parse(data.updates);

    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user has permission to update this organization
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", data.id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      throw new Error("You are not a member of this organization");
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("Only admins and owners can update organization settings");
    }

    const { data: org, error } = await supabase
      .from("organizations")
      .update(validatedUpdates)
      .eq("id", data.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("An organization with this slug already exists");
      }
      throw new Error(`Failed to update organization: ${error.message}`);
    }

    return org as Organization;
  }
);

/**
 * Delete an organization (owner only)
 */
export const deleteOrganization = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: string } }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify the current user is the owner of this organization
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", data.id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      throw new Error("You are not a member of this organization");
    }

    if (membership.role !== "owner") {
      throw new Error("Only the organization owner can delete the organization");
    }

    const { error } = await supabase.from("organizations").delete().eq("id", data.id);

    if (error) {
      throw new Error(`Failed to delete organization: ${error.message}`);
    }
  }
);

/**
 * Set the user's current/active organization
 */
export const setCurrentOrganization = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { organizationId: string } }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user is a member of this organization
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", data.organizationId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      throw new Error("You are not a member of this organization");
    }

    // Upsert user profile with current organization
    const { error } = await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        current_organization_id: data.organizationId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      throw new Error(`Failed to set current organization: ${error.message}`);
    }
  }
);

// =============================================================================
// Member Management
// =============================================================================

/**
 * Add a member to an organization (admin/owner only)
 *
 * TODO: Replace with invitation-based flow for production use.
 * Current implementation accepts arbitrary user IDs which could add users
 * without their consent. A proper implementation should:
 * 1. Accept email address instead of userId
 * 2. Create a pending invitation record
 * 3. Send invitation email to the user
 * 4. User accepts invitation to become a member
 *
 * This function is kept for development/testing purposes only.
 */
export const addOrganizationMember = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { organizationId: string; userId: string; role: "admin" | "member" };
  }): Promise<OrganizationMember> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify the current user is an admin or owner of this organization
    const { data: currentUserMembership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", data.organizationId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !currentUserMembership) {
      throw new Error("You are not a member of this organization");
    }

    const currentUserRole = currentUserMembership.role as OrganizationRole;
    if (currentUserRole !== "owner" && currentUserRole !== "admin") {
      throw new Error("Only admins and owners can add members");
    }

    // Verify the target user exists in auth.users by checking if they have a profile
    // Note: This is a basic check. The user must have signed up already.
    // A proper invitation flow would not require this.
    const { data: targetProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", data.userId)
      .single();

    if (!targetProfile) {
      throw new Error(
        "User not found. They must sign up before being added to an organization."
      );
    }

    const { data: member, error } = await supabase
      .from("organization_members")
      .insert({
        organization_id: data.organizationId,
        user_id: data.userId,
        role: data.role,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("User is already a member of this organization");
      }
      throw new Error(`Failed to add member: ${error.message}`);
    }

    return member as OrganizationMember;
  }
);

/**
 * Update a member's role (admin/owner only)
 */
export const updateMemberRole = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { memberId: string; role: "owner" | "admin" | "member" };
  }): Promise<OrganizationMember> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch the target member to get org context and their current role
    const { data: targetMember, error: targetError } = await supabase
      .from("organization_members")
      .select("organization_id, role, user_id")
      .eq("id", data.memberId)
      .single();

    if (targetError || !targetMember) {
      throw new Error("Member not found");
    }

    // Fetch current user's role in this organization
    const { data: currentUserMembership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", targetMember.organization_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !currentUserMembership) {
      throw new Error("You are not a member of this organization");
    }

    const currentUserRole = currentUserMembership.role as OrganizationRole;
    const targetCurrentRole = targetMember.role as OrganizationRole;

    // Authorization checks:
    // 1. Only owners can promote to owner or demote owners
    // 2. Admins can only change member roles (not other admins or owners)
    // 3. Members cannot change anyone's role
    if (currentUserRole === "member") {
      throw new Error("You don't have permission to change member roles");
    }

    if (currentUserRole === "admin") {
      // Admins can only modify members, not other admins or owners
      if (targetCurrentRole !== "member") {
        throw new Error("You don't have permission to modify this member's role");
      }
      // Admins cannot promote to owner or admin
      if (data.role === "owner") {
        throw new Error("Only owners can transfer ownership");
      }
    }

    // Owners can do anything except demote themselves (handled by RLS)
    if (data.role === "owner" && currentUserRole !== "owner") {
      throw new Error("Only owners can transfer ownership");
    }

    const { data: member, error } = await supabase
      .from("organization_members")
      .update({ role: data.role })
      .eq("id", data.memberId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return member as OrganizationMember;
  }
);

/**
 * Remove a member from an organization
 */
export const removeMember = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { memberId: string } }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch the target member to get org context and their role
    const { data: targetMember, error: targetError } = await supabase
      .from("organization_members")
      .select("organization_id, role, user_id")
      .eq("id", data.memberId)
      .single();

    if (targetError || !targetMember) {
      throw new Error("Member not found");
    }

    // Fetch current user's role in this organization
    const { data: currentUserMembership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", targetMember.organization_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !currentUserMembership) {
      throw new Error("You are not a member of this organization");
    }

    const currentUserRole = currentUserMembership.role as OrganizationRole;
    const targetRole = targetMember.role as OrganizationRole;

    // Authorization checks:
    // 1. Users can remove themselves (but owners must transfer ownership first - handled elsewhere)
    // 2. Admins can remove members (not other admins or owners)
    // 3. Owners can remove anyone except themselves
    const isSelf = targetMember.user_id === user.id;

    if (!isSelf) {
      if (currentUserRole === "member") {
        throw new Error("You don't have permission to remove members");
      }

      if (currentUserRole === "admin" && targetRole !== "member") {
        throw new Error("You don't have permission to remove this member");
      }

      // Owners cannot remove themselves via this function (use leaveOrganization)
      if (targetRole === "owner") {
        throw new Error("Cannot remove the organization owner");
      }
    }

    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", data.memberId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }
);

/**
 * Leave an organization (any member can leave)
 *
 * This uses an atomic RPC function with row locking to prevent race conditions.
 * The RPC ensures that if an owner is trying to leave while being the only
 * member, the check and delete happen atomically.
 */
export const leaveOrganization = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { organizationId: string } }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Use atomic RPC function to prevent race conditions
    const { error } = await supabase.rpc("leave_organization", {
      org_id: data.organizationId,
    });

    if (error) {
      // Map PostgreSQL exception messages to user-friendly errors
      if (error.message.includes("transfer ownership")) {
        throw new Error(
          "You must transfer ownership before leaving the organization"
        );
      }
      if (error.message.includes("not a member")) {
        throw new Error("You are not a member of this organization");
      }
      if (error.message.includes("not authenticated")) {
        throw new Error("Unauthorized");
      }
      throw new Error(`Failed to leave organization: ${error.message}`);
    }
  }
);

/**
 * Check if a slug is available
 */
export const checkSlugAvailability = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { slug: string } }): Promise<boolean> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { count, error } = await supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("slug", data.slug);

    if (error) {
      throw new Error(`Failed to check slug: ${error.message}`);
    }

    return count === 0;
  }
);
