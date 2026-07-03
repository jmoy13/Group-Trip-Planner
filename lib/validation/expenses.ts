import * as z from "zod";

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter a valid amount, e.g. 250 or 250.00." });

const percentageString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter a valid percentage, e.g. 33 or 33.33." });

const sharedFields = {
  description: z
    .string()
    .min(1, { error: "Description is required." })
    .max(255, { error: "Description must be 255 characters or fewer." })
    .trim(),
  amount: moneyString,
  categoryId: z.string().optional(),
  paidById: z.string().min(1, { error: "Payer is required." }),
};

const equalVariant = z.object({
  ...sharedFields,
  splitType: z.literal("EQUAL"),
  participantIds: z
    .array(z.string().min(1))
    .min(1, { error: "At least one participant is required." }),
});

const exactAmountVariant = z.object({
  ...sharedFields,
  splitType: z.literal("EXACT_AMOUNT"),
  participants: z
    .array(
      z.object({
        userId: z.string().min(1),
        amount: moneyString,
      })
    )
    .min(1, { error: "At least one participant is required." }),
});

const percentageVariant = z.object({
  ...sharedFields,
  splitType: z.literal("PERCENTAGE"),
  participants: z
    .array(
      z.object({
        userId: z.string().min(1),
        percentage: percentageString,
      })
    )
    .min(1, { error: "At least one participant is required." }),
});

export const CreateExpenseSchema = z.discriminatedUnion("splitType", [
  equalVariant,
  exactAmountVariant,
  percentageVariant,
]);

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export const UpdateExpenseSchema = CreateExpenseSchema;

export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
