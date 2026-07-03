import {z} from "zod";

export const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const otpFormSchema = z.object({
  otp: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});

export type EmailFormValues = z.infer<typeof emailFormSchema>;
export type OtpFormValues = z.infer<typeof otpFormSchema>;