export interface StatusBreakdownItem {
  status: string;
  count: number;
}

export interface MonthlyCountItem {
  month: string; // "YYYY-MM"
  count: number;
}

export interface AnalyticsSummary {
  totalAppointments: number;
  totalPatients: number;
  cancellationRate: number;
  statusBreakdown: StatusBreakdownItem[];
  patientsPerMonth: MonthlyCountItem[];
}
