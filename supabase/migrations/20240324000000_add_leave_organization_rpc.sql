-- =============================================================================
-- Fix race condition in leave organization operation
-- =============================================================================
-- This migration adds an atomic RPC function for leaving an organization.
-- The previous implementation had a TOCTOU (time-of-check-time-of-use) race
-- condition where separate queries checked membership status and member count
-- before deleting, potentially leading to orphaned organizations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: Leave organization atomically
-- Uses row locking (FOR UPDATE) to prevent race conditions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leave_organization(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role organization_role;
  member_count integer;
  user_current_org uuid;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Lock the user's membership row to prevent race conditions
  -- This ensures no other transaction can modify or delete this row until we're done
  SELECT role INTO user_role
  FROM public.organization_members
  WHERE organization_id = org_id AND user_id = auth.uid()
  FOR UPDATE;

  -- Check if user is a member
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this organization';
  END IF;

  -- If user is the owner, check if there are other members
  IF user_role = 'owner' THEN
    -- Lock all member rows for this org to get accurate count
    -- and prevent other members from leaving simultaneously
    SELECT COUNT(*) INTO member_count
    FROM public.organization_members
    WHERE organization_id = org_id
    FOR UPDATE;

    IF member_count > 1 THEN
      RAISE EXCEPTION 'You must transfer ownership before leaving the organization';
    END IF;
  END IF;

  -- Delete the membership
  DELETE FROM public.organization_members
  WHERE organization_id = org_id AND user_id = auth.uid();

  -- Clear current organization if it was this one
  SELECT current_organization_id INTO user_current_org
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF user_current_org = org_id THEN
    UPDATE public.user_profiles
    SET current_organization_id = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.leave_organization TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.leave_organization IS
  'Atomically leave an organization with proper locking to prevent race conditions. '
  'Owners must transfer ownership before leaving if other members exist.';
