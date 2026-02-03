-- =============================================================================
-- Fix: RLS INSERT Policy for organization_members
-- =============================================================================
-- Issue: HEA-30 - The original INSERT policy only checked if the requester
-- was an admin, but didn't validate the role being inserted. This allowed
-- privilege escalation where an admin could insert a member with role='owner'.
--
-- Fix: Add check to ensure only owners can insert members with owner role.
-- =============================================================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can add members" ON public.organization_members;

-- Create the fixed policy with role validation
CREATE POLICY "Admins can add members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    -- User must be an admin or owner of the organization
    public.is_organization_admin(organization_id)
    -- AND: only owners can add other owners
    AND (role != 'owner' OR public.is_organization_owner(organization_id))
  );
