export type FaqCategory =
  | "Appointments"
  | "Online Consultations"
  | "Payments"
  | "Rescheduling and Cancellations"
  | "Technical Support"
  | "Privacy"
  | "Website Assistant";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  homepageFeatured?: boolean;
}
