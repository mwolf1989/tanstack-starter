-- =============================================================================
-- Update Todos Table for Multi-Tenancy
-- =============================================================================
-- This migration updates the existing todos table to support organization-level
-- data isolation while maintaining backward compatibility.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Add organization_id column to todos
-- -----------------------------------------------------------------------------
ALTER TABLE public.todos
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for organization queries
CREATE INDEX todos_organization_id_idx ON public.todos (organization_id);

-- Create composite index for common query pattern
CREATE INDEX todos_org_user_idx ON public.todos (organization_id, user_id);

-- -----------------------------------------------------------------------------
-- Drop existing user-only RLS policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can insert their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;

-- -----------------------------------------------------------------------------
-- Create new organization-scoped RLS policies
-- -----------------------------------------------------------------------------

-- Users can view todos in their organizations
CREATE POLICY "Members can view organization todos"
  ON public.todos FOR SELECT
  USING (
    -- Can view if user is member of the todo's organization
    public.is_organization_member(organization_id)
    -- Or if it's a personal todo (no org) and belongs to the user
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

-- Users can create todos in organizations they belong to
CREATE POLICY "Members can create organization todos"
  ON public.todos FOR INSERT
  WITH CHECK (
    -- Can create if user is member of the organization
    (organization_id IS NOT NULL AND public.is_organization_member(organization_id) AND user_id = auth.uid())
    -- Or if it's a personal todo (no org)
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

-- Users can update todos they created in their organizations
-- Note: organization_id changes are prevented by the trigger below
CREATE POLICY "Members can update organization todos"
  ON public.todos FOR UPDATE
  USING (
    -- Must be the creator AND member of the organization
    user_id = auth.uid()
    AND (
      public.is_organization_member(organization_id)
      OR organization_id IS NULL
    )
  )
  WITH CHECK (
    -- Must remain the creator and member of the (possibly new) organization
    user_id = auth.uid()
    AND (
      public.is_organization_member(organization_id)
      OR organization_id IS NULL
    )
  );

-- Trigger to prevent moving todos between organizations
-- (RLS WITH CHECK cannot reference OLD values, so we use a trigger)
CREATE OR REPLACE FUNCTION public.prevent_todo_org_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent changing organization_id unless user is admin of both orgs
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
    -- Check if user is admin of old org (or old org is NULL)
    IF OLD.organization_id IS NOT NULL AND NOT public.is_organization_admin(OLD.organization_id) THEN
      RAISE EXCEPTION 'Cannot move todo: you must be an admin of the source organization';
    END IF;
    -- Check if user is admin of new org (or new org is NULL)
    IF NEW.organization_id IS NOT NULL AND NOT public.is_organization_admin(NEW.organization_id) THEN
      RAISE EXCEPTION 'Cannot move todo: you must be an admin of the target organization';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_todo_org_change_trigger
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_todo_org_change();

-- Users can delete their own todos, admins can delete any org todo
CREATE POLICY "Members can delete organization todos"
  ON public.todos FOR DELETE
  USING (
    -- Creator can delete their own todos
    (user_id = auth.uid() AND (public.is_organization_member(organization_id) OR organization_id IS NULL))
    -- Admins can delete any todo in their organization
    OR public.is_organization_admin(organization_id)
  );

-- -----------------------------------------------------------------------------
-- Add updated_at column if it doesn't exist (the trigger references it)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.todos
    ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
  END IF;
END $$;
