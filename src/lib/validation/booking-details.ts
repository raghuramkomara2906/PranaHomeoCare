import { z } from "zod";

/** Patient details step of the booking flow. `mobileNumber` is the 10-digit
 * local number; the backend normalizes it to +91 E.164. */
export const bookingDetailsSchema = z.object({
  patientName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(150, "That name is too long."),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  smsConsent: z
    .boolean()
    .refine((v) => v === true, {
      message: "SMS consent is required to receive appointment messages.",
    }),
  termsAccepted: z
    .boolean()
    .refine((v) => v === true, {
      message: "You must accept the booking terms to continue.",
    }),
});

export type BookingDetailsValues = z.infer<typeof bookingDetailsSchema>;