export interface Practitioner {
  id: string;
  name: string;
  title: string;
  /** Each entry should carry its own verification source once confirmed. */
  qualifications: string[];
  registrationPlaceholder: string;
  yearsExperiencePlaceholder: string;
  languages: string[];
  philosophy: string;
  values: string[];
  areasOfConsultation: string[];
  availabilitySummary: string;
  photoAlt: string;
}
