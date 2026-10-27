import { z } from "zod";

const credentials = {
  password: z.string().min(8, "Password must be at least 8 characters long"),
};

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must be at most 30 characters long"),
  email: z
    .string()
    .trim()
    .email("A valid email address is required")
    .transform((value) => value.toLowerCase()),
  ...credentials,
});

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    email: z
      .string()
      .trim()
      .email("A valid email address is required")
      .optional(),
    username: z.string().trim().min(1).optional(),
    ...credentials,
  })
  .transform(({ identifier, email, username, password }) => ({
    identifier: identifier ?? email ?? username,
    password,
  }))
  .refine(({ identifier }) => Boolean(identifier), {
    message: "Email or username is required",
    path: ["identifier"],
  });
