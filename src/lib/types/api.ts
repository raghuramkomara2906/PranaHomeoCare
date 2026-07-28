/**
 * TypeScript types mirroring the FastAPI backend's `/api/v1` responses
 * (camelCase, exactly as the API serializes them). These are the contract the
 * `src/services` layer speaks — kept in their own module (not the barrel) so
 * they never collide with the legacy type files.
 *
 * Datetime fields are ISO 8601 strings carrying an IST offset (`+05:30`), so
 * `new Date(value)` yields the correct instant and naive formatting shows IST.
 */

export type ConsultationType = "teleconsultation" | "video_consultation";

export type AppointmentStatusValue =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type MeetingStatusValue =
  | "pending"
  | "ready"
  | "review_required"
  | "revoked";

// --- availability ----------------------------------------------------------
export interface AvailableDate {
  date: string; // YYYY-MM-DD (IST)
  availableCount: number;
}

export interface AvailableDatesResponse {
  timezone: string;
  dates: AvailableDate[];
}

export interface PublicSlot {
  id: string;
  startAt: string;
  endAt: string;
}

export interface PublicSlotsResponse {
  date: string;
  timezone: string;
  slots: PublicSlot[];
}

// --- booking + OTP ---------------------------------------------------------
export interface BookingRequestInput {
  consultationType: ConsultationType;
  slotId: string;
  patientName: string;
  mobileNumber: string; // 10-digit local; normalized to +91 server-side
  smsConsent: boolean;
  termsAccepted: boolean;
  idempotencyKey: string; // UUID
}

export interface BookingRequestResponse {
  id: string;
  status: string; // pending_otp
  consultationType: ConsultationType;
  maskedMobile: string;
  otpExpiresAt: string;
  resendAvailableInSeconds: number;
}

export interface OtpResendResponse {
  id: string;
  maskedMobile: string;
  otpExpiresAt: string;
  resendAvailableInSeconds: number;
  resendCount: number;
  maxResends: number;
}

export interface AppointmentConfirmation {
  bookingReference: string;
  consultationType: ConsultationType;
  status: AppointmentStatusValue;
  startAt: string;
  endAt: string;
  timezone: string;
  maskedMobile: string;
  fee: string; // "free"
  instructions: string;
  clinicPhone: string | null;
  meetingStatus: MeetingStatusValue | null;
  accessToken: string | null; // raw token for the secure URL (only on first verify)
  appointmentPath: string | null; // "/appointment/{token}"
  alreadyConfirmed: boolean;
}

// --- secure appointment access ---------------------------------------------
export interface AppointmentAccess {
  bookingReference: string;
  consultationType: ConsultationType;
  status: AppointmentStatusValue;
  startAt: string;
  endAt: string;
  timezone: string;
  instructions: string;
  maskedMobile: string;
  clinicPhone: string | null;
  meetingStatus: MeetingStatusValue | null;
  cancellationDeadline: string;
  rescheduleDeadline: string;
  canCancel: boolean;
  canReschedule: boolean;
}

export interface CancelResponse {
  bookingReference: string;
  status: AppointmentStatusValue;
  message: string;
}

export interface RescheduleCurrent {
  bookingReference: string;
  consultationType: ConsultationType;
  startAt: string;
  endAt: string;
}

export interface RescheduleOptions {
  timezone: string;
  rescheduleDeadline: string;
  canReschedule: boolean;
  current: RescheduleCurrent;
  dates: AvailableDate[];
}

export interface RescheduleResponse {
  bookingReference: string;
  status: AppointmentStatusValue;
  message: string;
  startAt: string;
  endAt: string;
  meetingStatus: MeetingStatusValue | null;
}

export type JoinStatusState =
  | "pending"
  | "too_early"
  | "available"
  | "ended"
  | "unavailable";

export interface JoinStatus {
  state: JoinStatusState;
  canJoin: boolean;
  meetingStatus: MeetingStatusValue | null;
  joinOpensAt: string | null;
  message: string;
}

export interface JoinResponse {
  joinUrl: string;
}

// --- admin auth ------------------------------------------------------------
export interface AdminDoctor {
  id: string;
  displayName: string;
  qualification: string;
}

export interface AdminMe {
  id: string;
  email: string;
  role: string;
  doctor: AdminDoctor | null;
}

// --- chatbot ---------------------------------------------------------------
export interface QuickReply {
  id: string;
  label: string;
}

export interface ChatAction {
  type: string; // "book"
  path: string;
  label: string;
  consultationType?: ConsultationType | null;
}

export interface ChatIntro {
  greeting: string;
  quickReplies: QuickReply[];
}

export interface ChatMessageInput {
  message?: string;
  choiceId?: string;
}

export interface ChatReply {
  reply: string;
  safety: boolean;
  quickReplies: QuickReply[];
  actions: ChatAction[];
}
// --- admin dashboard -------------------------------------------------------
export interface DashboardSummary {
  timezone: string;
  todaysAppointments: number;
  upcomingAppointments: number;
  teleconsultationsToday: number;
  videoConsultationsToday: number;
  videoLinksPending: number;
  availableSlots: number;
  cancelledToday: number;
  smsDeliveryFailures: number;
}
// --- admin dashboard -------------------------------------------------------
export interface DashboardSummary {
  timezone: string;
  todaysAppointments: number;
  upcomingAppointments: number;
  teleconsultationsToday: number;
  videoConsultationsToday: number;
  videoLinksPending: number;
  availableSlots: number;
  cancelledToday: number;
  smsDeliveryFailures: number;
}
// --- admin appointments ----------------------------------------------------
export interface AdminAppointmentFilters {
  fromDate?: string;
  toDate?: string;
  consultationType?: ConsultationType;
  status?: string;
  meetingStatus?: string;
  q?: string;
}

export interface AdminAppointmentListItem {
  id: string;
  bookingReference: string;
  patientName: string;
  mobile: string;
  consultationType: ConsultationType;
  status: AppointmentStatusValue;
  startAt: string;
  endAt: string;
  meetingStatus: MeetingStatusValue | null;
  lastNotificationStatus: string | null;
}

export interface AdminAppointmentListResponse {
  timezone: string;
  appointments: AdminAppointmentListItem[];
}

export interface AdminEvent {
  eventType: string;
  actorType: string;
  createdAt: string;
  fromSlotId: string | null;
  toSlotId: string | null;
}

export interface AdminNotification {
  notificationType: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  errorCode: string | null;
}

export interface AdminMeeting {
  status: MeetingStatusValue | null;
  hasLink: boolean;
  joinUrl: string | null;
  meetingIdentifier: string | null;
}

export interface AdminAppointmentDetail {
  id: string;
  bookingReference: string;
  patientName: string;
  mobile: string;
  consultationType: ConsultationType;
  status: AppointmentStatusValue;
  startAt: string;
  endAt: string;
  timezone: string;
  slotEffectiveStatus: string;
  otpVerified: boolean;
  bookingCreatedAt: string;
  teleconsultationPhone: string | null;
  meeting: AdminMeeting | null;
  events: AdminEvent[];
  notifications: AdminNotification[];
}

export interface AdminActionResponse {
  id: string;
  status: string;
  message: string;
  startAt?: string | null;
  endAt?: string | null;
  meetingStatus?: MeetingStatusValue | null;
}

export interface AdminMeetingResponse {
  id: string;
  meetingStatus: MeetingStatusValue;
  replaced: boolean;
  message: string;
}
// --- admin slots -----------------------------------------------------------
export interface AdminSlot {
  id: string;
  startAt: string;
  endAt: string;
  baseStatus: string; // available | blocked | archived
  effectiveStatus: string; // available | held | booked | blocked
  blockedReason: string | null;
}

export interface AdminSlotListResponse {
  timezone: string;
  slots: AdminSlot[];
}