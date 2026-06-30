import * as z from "zod";

export const ProposeDestinationSchema = z.object({
  tripId: z.cuid(),
  name: z
    .string()
    .min(1, { error: "Destination name is required." })
    .max(120, { error: "Destination name must be 120 characters or fewer." })
    .trim(),
  notes: z
    .string()
    .trim()
    .max(2000, { error: "Notes must be 2000 characters or fewer." })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  imageUrl: z
    .url({ error: "Please enter a valid image URL." })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ProposeDestinationInput = z.infer<typeof ProposeDestinationSchema>;

export const ProposeDateOptionSchema = z
  .object({
    tripId: z.cuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate > d.startDate, {
    error: "End date must be after start date.",
    path: ["endDate"],
  });

export type ProposeDateOptionInput = z.infer<typeof ProposeDateOptionSchema>;

export const CastVoteSchema = z.object({
  tripId: z.cuid(),
  optionId: z.cuid(),
});

export type CastVoteInput = z.infer<typeof CastVoteSchema>;

export const FinalizeTripSchema = z.object({
  tripId: z.cuid(),
  finalDestinationId: z.cuid({ error: "Choose a destination to finalize." }),
  finalDateOptionId: z.cuid({ error: "Choose a date range to finalize." }),
});

export type FinalizeTripInput = z.infer<typeof FinalizeTripSchema>;