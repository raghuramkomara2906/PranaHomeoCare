import { z } from "zod";

export const patientDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "That name looks too long — please shorten it."),
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "That phone number looks too long."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters.").optional(),
});

export type PatientDetailsFormValues = z.infer<typeof patientDetailsSchema>;
