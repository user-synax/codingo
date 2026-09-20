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

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(50, "At most 50 characters."),
  age: z.coerce.number().int().min(13, "You must be at least 13.").max(80, "At most 80."),
  country: z.string().trim().min(2, "Country is required.").max(100),
  countryCode: z.string().trim().length(2).toUpperCase().optional().or(z.literal("")),
  language: z.enum(["javascript"], { errorMap: () => ({ message: "Pick JavaScript for now — more coming soon." }) }),
  avatar: z.string().trim().url("Invalid avatar URL.").optional().or(z.literal("")).or(z.undefined()),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
