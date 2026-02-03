-- =============================================================================
-- Multi-Tenancy Schema: Organizations and Memberships
-- =============================================================================
-- This migration creates the core multi-tenancy infrastructure:
-- 1. Organizations table (tenants)
-- 2. Organization members table (user-org relationships with roles)
-- 3. Helper functions for RLS policies
-- 4. RLS policies for tenant isolation
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Create organization roles enum
-- -----------------------------------------------------------------------------
CREATE TYPE public.organization_role AS ENUM ('owner', 'admin', 'member');

-- -----------------------------------------------------------------------------
-- Create organizations table (tenants)
-- -----------------------------------------------------------------------------
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Ensure slug is URL-friendly
  CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' AND char_length(slug) >= 3),
  CONSTRAINT organizations_name_check CHECK (char_length(name) >= 2)
);

-- Create index for slug lookups
CREATE INDEX organizations_slug_idx ON public.organizations (slug);

-- -----------------------------------------------------------------------------
-- Create organization members table (user-org relationships)
-- -----------------------------------------------------------------------------
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Each user can only be a member once per organization
  CONSTRAINT organization_members_unique UNIQUE (organization_id, user_id)
);

-- Create indexes for common queries
CREATE INDEX organization_members_org_id_idx ON public.organization_members (organization_id);
CREATE INDEX organization_members_user_id_idx ON public.organization_members (user_id);

-- -----------------------------------------------------------------------------
-- Create user profiles table (extends auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  current_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- Helper functions for RLS policies
-- -----------------------------------------------------------------------------

-- Get the current user's organization memberships
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid();
$$;

-- Check if user is a member of a specific organization
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
  );
$$;

-- Check if user has specific role in an organization
CREATE OR REPLACE FUNCTION public.has_organization_role(org_id uuid, required_role organization_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND (
        role = required_role
        OR role = 'owner'  -- owners have all permissions
        OR (role = 'admin' AND required_role = 'member')  -- admins have member permissions
      )
  );
$$;

-- Check if user is owner or admin of an organization
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- Check if user is the owner of an organization
CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- Get the current user's default/current organization
CREATE OR REPLACE FUNCTION public.get_current_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    -- First try to get from user profile
    (SELECT current_organization_id FROM public.user_profiles WHERE id = auth.uid()),
    -- Fall back to first organization they're a member of
    (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1)
  );
$$;

-- -----------------------------------------------------------------------------
-- Enable RLS on all tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: Organizations
-- -----------------------------------------------------------------------------

-- Users can view organizations they're members of
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.is_organization_member(id));

-- Authenticated users can create organizations (they become owner)
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins/owners can update organization details
CREATE POLICY "Admins can update organizations"
  ON public.organizations FOR UPDATE
  USING (public.is_organization_admin(id))
  WITH CHECK (public.is_organization_admin(id));

-- Only owners can delete organizations
CREATE POLICY "Owners can delete organizations"
  ON public.organizations FOR DELETE
  USING (public.is_organization_owner(id));

-- -----------------------------------------------------------------------------
-- RLS Policies: Organization Members
-- -----------------------------------------------------------------------------

-- Members can view other members in their organizations
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (public.is_organization_member(organization_id));

-- Admins can add members to organizations
CREATE POLICY "Admins can add members"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.is_organization_admin(organization_id));

-- Admins can update member roles (but not owner role)
CREATE POLICY "Admins can update members"
  ON public.organization_members FOR UPDATE
  USING (
    public.is_organization_admin(organization_id)
    AND (
      -- Can't demote/change owner unless you're the owner
      role != 'owner' OR public.is_organization_owner(organization_id)
    )
  )
  WITH CHECK (
    public.is_organization_admin(organization_id)
    AND (
      -- Can't promote to owner unless you're the owner
      role != 'owner' OR public.is_organization_owner(organization_id)
    )
  );

-- Members can remove themselves, admins can remove non-admins, owners can remove anyone
CREATE POLICY "Members can be removed appropriately"
  ON public.organization_members FOR DELETE
  USING (
    -- Users can remove themselves (leave org)
    user_id = auth.uid()
    -- Admins can remove members
    OR (public.is_organization_admin(organization_id) AND role = 'member')
    -- Owners can remove anyone except themselves
    OR (public.is_organization_owner(organization_id) AND user_id != auth.uid())
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: User Profiles
-- -----------------------------------------------------------------------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid());

-- Users can view profiles of members in their organizations
CREATE POLICY "Users can view org member profiles"
  ON public.user_profiles FOR SELECT
  USING (
    id IN (
      SELECT om.user_id
      FROM public.organization_members om
      WHERE om.organization_id IN (SELECT public.get_user_organization_ids())
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles FOR DELETE
  USING (id = auth.uid());

-- -----------------------------------------------------------------------------
-- Triggers: Auto-update updated_at columns
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Function: Create organization with owner
-- This is a helper function to atomically create an org and add the creator as owner
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  org_name text,
  org_slug text,
  org_logo_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create the organization
  INSERT INTO public.organizations (name, slug, logo_url)
  VALUES (org_name, org_slug, org_logo_url)
  RETURNING id INTO new_org_id;

  -- Add the current user as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  -- Create or update user profile with this as current org
  INSERT INTO public.user_profiles (id, current_organization_id)
  VALUES (auth.uid(), new_org_id)
  ON CONFLICT (id) DO UPDATE
  SET current_organization_id = new_org_id,
      updated_at = timezone('utc'::text, now());

  RETURN new_org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner TO authenticated;
