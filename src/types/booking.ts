// ─────────────────────────────────────────────
// Booking / Task Management Types
// ─────────────────────────────────────────────

export type BookingStatus =
  | "New"
  | "On Process"
  | "Ready To Submit"
  | "Waiting - Need More Info"
  | "Submitted"
  | "Approved"
  | "Rejected"
  | "Finished - Approved"
  | "Finished - Rejected"
  | "Cancelled";

export type AgentGroup =
  | "FIT"          // Free Independent Traveler / Walk-in
  | "Agency"       // Travel agency
  | "Corporate"    // Corporate client
  | "OTA";         // Online Travel Agent

export type VisaServiceType =
  | "Standard"
  | "Express"
  | "Express, VIP";

export type VisaTypeCategory = "Single" | "Multiple" | "Double";

export type AppointmentStatus =
  | "No Appointment"
  | "Scheduled"
  | "Completed"
  | "Rescheduled"
  | "Missed";

export interface BookingApplicant {
  id: string;
  name: string;
  passportNumber: string;
  nationality: string;
}

export interface BookingVisaPackage {
  id: string;
  name: string;           // e.g. "Tourist Visa 30 Days"
  country: string;        // Destination country
  visaType: VisaTypeCategory;
  stayDuration: number;      // in days
  processingTimeDays: number; // estimated processing time in working days
  price: number;
  currency: string;
  serviceType: VisaServiceType;
}

export interface Booking {
  id: string;
  // Order number / reference
  bookingNumber: string;

  // People
  applicant: BookingApplicant;
  pic: string;                 // Person In Charge name
  analyst: string | null;      // Analyst assigned
  fieldAgent: string | null;   // Field Agent assigned

  // Grouping
  agentGroup: AgentGroup;
  agentGroupName: string | null; // e.g. "TRIP DEALS", "STARLIGHT TOUR AND TRAVEL", etc.
  salesName: string;             // Sales person who acquired this booking

  // Visa Details
  visaPackage: BookingVisaPackage;
  applyCity: string;             // City where the visa is applied

  // Status
  status: BookingStatus;
  appointmentStatus: AppointmentStatus;
  appointmentDate: string | null; // ISO date

  // Dates & Deadlines
  departureDate: string;         // ISO date - tanggal pemberangkatan
  createdAt: string;             // ISO date - booking created
  updatedAt: string;             // ISO date - last updated

  // Notes
  notes: string | null;
}

// ─────────────────────────────────────────────
// Deadline Computation Helpers
// ─────────────────────────────────────────────

/**
 * Calculate the deadline for visa processing.
 * Deadline = departureDate - buffer (in calendar days before departure)
 * The visa must be ready before the departure date, so:
 * - We consider the processing time from the visa package
 * - Add a safety buffer (e.g., 7 calendar days)
 * - The "submission deadline" = departureDate - processingTimeDays - buffer
 */
export function calculateSubmissionDeadline(
  departureDate: string,
  processingTimeDays: number,
  bufferDays: number = 7
): Date {
  const departure = new Date(departureDate);
  const totalDaysNeeded = processingTimeDays + bufferDays;
  const deadline = new Date(departure);
  deadline.setDate(deadline.getDate() - totalDaysNeeded);
  return deadline;
}

/**
 * Get the urgency level based on how close the deadline is.
 */
export function getDeadlineUrgency(
  departureDate: string,
  processingTimeDays: number,
): "overdue" | "critical" | "urgent" | "normal" | "comfortable" {
  const deadline = calculateSubmissionDeadline(departureDate, processingTimeDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffMs = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "critical";
  if (diffDays <= 7) return "urgent";
  if (diffDays <= 14) return "normal";
  return "comfortable";
}

/**
 * Get remaining days until departure.
 */
export function getDaysUntilDeparture(departureDate: string): number {
  const departure = new Date(departureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  departure.setHours(0, 0, 0, 0);
  return Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
