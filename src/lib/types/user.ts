export type UserRole = "PATIENT" | "PRACTITIONER";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
}
