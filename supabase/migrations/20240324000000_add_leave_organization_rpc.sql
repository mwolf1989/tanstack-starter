-- =============================================================================
-- Atomic Leave Organization RPC Function
-- =============================================================================
-- This migration adds an RPC function to handle organization leaving atomically,
-- preventing a TOCTOU (time-of-check-time-of-use) race condition where:
-- 1. Owner checks membership (they are owner)
-- 2. Owner checks member count (count is 2)
-- 3. Another member leaves simultaneously
-- 4. Owner deletion proceeds
-- 5. Organization ends up with 0 members and no owner
--
-- The RPC uses FOR UPDATE to lock the membership row during the check,
-- ensuring atomicity of the entire operation.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.leave_organization(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role organization_role;
  member_count integer;
  user_profile_current_org uuid;
BEGIN
  -- Lock the user's membership row to prevent race conditions
  SELECT role INTO user_role
  FROM public.organization_members
  WHERE organization_id = org_id AND user_id = auth.uid()
  FOR UPDATE;

  -- Check if user is actually a member
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this organization';
  END IF;

  -- If user is owner, check member count (with lock held)
  IF user_role = 'owner' THEN
    -- Lock all member rows for this org to get accurate count
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
  SELECT current_organization_id INTO user_profile_current_org
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF user_profile_current_org = org_id THEN
    UPDATE public.user_profiles
    SET current_organization_id = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.leave_organization TO authenticated;
