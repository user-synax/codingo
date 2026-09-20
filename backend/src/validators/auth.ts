import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "At least 3 characters.")
    .max(30, "At most 30 characters.")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, _ . - only."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(6, "At least 6 characters.").max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
