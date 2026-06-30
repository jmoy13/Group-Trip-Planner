import * as z from "zod";

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter a valid amount, e.g. 250 or 250.00." });

export const CreateBudgetCategorySchema = z.object({
  name: z
    .string()
    .min(1, { error: "Category name is required." })
    .max(100, { error: "Category name must be 100 characters or fewer." })
    .trim(),
  plannedAmount: moneyString,
});

export type CreateBudgetCategoryInput = z.infer<typeof CreateBudgetCategorySchema>;

export const UpdateBudgetCategorySchema = CreateBudgetCategorySchema;

export type UpdateBudgetCategoryInput = z.infer<typeof UpdateBudgetCategorySchema>;
