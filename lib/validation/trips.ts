import * as z from "zod";

export const CreateTripSchema = z.object({
  name: z.string().min(2, { error: "Trip name must be at least 2 characters long." }).trim(),
  description: z
    .string()
    .trim()
    .max(1000, { error: "Description must be 1000 characters or fewer." })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  currency: z
    .string()
    .trim()
    .length(3, { error: "Currency must be a 3-letter ISO 4217 code, e.g. USD." })
    .toUpperCase(),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;

export const UpdateTripSchema = CreateTripSchema;

export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;

export const InviteMemberSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
