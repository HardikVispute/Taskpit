import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters.").max(100, "Name must be 100 characters or less."),
  joinCode: z.string().trim().min(3, "Organization code must be at least 3 characters.").max(32, "Organization code cannot exceed 32 characters.").optional(),
  joinSecret: z.string().trim().min(4, "Secret code must be at least 4 characters.").max(64, "Secret code cannot exceed 64 characters.").optional(),
});

export const joinOrganizationSchema = z.object({
  joinCode: z.string().trim().min(1, "Organization code is required."),
  joinSecret: z.string().trim().min(1, "Passcode / secret is required."),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type JoinOrganizationInput = z.infer<typeof joinOrganizationSchema>;

