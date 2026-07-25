export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  durationMinutes: number;
  /** Placeholder pricing — confirm real pricing before launch. */
  price: number;
  currency: string;
  isPriceEstimate?: boolean;
  appropriateFor: string[];
  included: string[];
  isOnline: true;
}
