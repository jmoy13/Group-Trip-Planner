import * as z from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters long." }).trim(),
  email: z.email({ error: "Please enter a valid email." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." }),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Password is required." }),
});

export type SignInInput = z.infer<typeof SignInSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim().toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." }),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
