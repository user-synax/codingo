import { z } from "zod";

export const USERNAME_RE = /^[a-zA-Z0-9_.-]+$/;

// Reserved for auto-generated Google-signup placeholders (asked to pick a real
// one during onboarding). Email/password signup may not claim this prefix.
export const TEMP_USERNAME_PREFIX = "google_user_";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters.")
  .max(30, "At most 30 characters.")
  .regex(USERNAME_RE, "Letters, numbers, _ . - only.")
  .refine((u) => !u.startsWith(TEMP_USERNAME_PREFIX), {
    message: "That username is reserved. Pick another one.",
  });

export const registerSchema = z.object({
  username: usernameSchema,
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
  language: z.enum(["javascript", "python"], { errorMap: () => ({ message: "Pick JavaScript or Python — more coming soon." }) }),
  avatar: z.string().trim().url("Invalid avatar URL.").optional().or(z.literal("")).or(z.undefined()),
  // Google signups get a temp `google_user_*` username — they pick a real one here.
  username: usernameSchema.optional(),
});

// Google Identity Services credential (ID token) sent by the official button.
export const googleCredentialSchema = z.object({
  credential: z.string().trim().min(1, "Google credential is required.").max(8192),
});

export type GoogleCredentialInput = z.infer<typeof googleCredentialSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
