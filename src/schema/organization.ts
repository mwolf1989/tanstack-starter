import { z } from "zod";

// Organization role enum
export const OrganizationRoleSchema = z.enum(["owner", "admin", "member"]);
export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;

// Organization schema
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must be lowercase alphanumeric with hyphens, not starting or ending with hyphen"
    ),
  logo_url: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

// Organization member schema
export const OrganizationMemberSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: OrganizationRoleSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  current_organization_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// Create organization input schema
export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
  logo_url: z.string().url().optional(),
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

// Update organization input schema
export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .optional(),
  logo_url: z.string().url().nullable().optional(),
});
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

// Invite member input schema
export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: OrganizationRoleSchema.exclude(["owner"]), // Can't invite as owner
});
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

// Update member role input schema
export const UpdateMemberRoleSchema = z.object({
  member_id: z.string().uuid(),
  role: OrganizationRoleSchema,
});
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

// Organization with membership info (for current user context)
export const OrganizationWithRoleSchema = OrganizationSchema.extend({
  role: OrganizationRoleSchema,
});
export type OrganizationWithRole = z.infer<typeof OrganizationWithRoleSchema>;

// Member with user info
export const MemberWithUserSchema = OrganizationMemberSchema.extend({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    display_name: z.string().nullable().optional(),
    avatar_url: z.string().url().nullable().optional(),
  }),
});
export type MemberWithUser = z.infer<typeof MemberWithUserSchema>;
