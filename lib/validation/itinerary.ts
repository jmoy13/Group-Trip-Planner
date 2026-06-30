import * as z from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const optionalDateTime = z
  .union([z.literal(""), z.coerce.date()])
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value));

export const CreateItineraryItemSchema = z.object({
  title: z
    .string()
    .min(1, { error: "Title is required." })
    .max(150, { error: "Title must be 150 characters or fewer." })
    .trim(),
  description: optionalText(2000),
  location: optionalText(200),
  startTime: optionalDateTime,
  endTime: optionalDateTime,
  // dayIndex is the user-facing day number (Day 1, Day 2, ...), 1-indexed — not a zero-based offset
  dayIndex: z.coerce.number().int().min(1, { error: "Day must be 1 or greater." }),
});

export type CreateItineraryItemInput = z.infer<typeof CreateItineraryItemSchema>;

export const UpdateItineraryItemSchema = CreateItineraryItemSchema;

export type UpdateItineraryItemInput = z.infer<typeof UpdateItineraryItemSchema>;

export const ReorderItineraryItemsSchema = z.object({
  dayIndex: z.number().int().min(1),
  orderedItemIds: z.array(z.cuid()).min(1),
});

export type ReorderItineraryItemsInput = z.infer<typeof ReorderItineraryItemsSchema>;
