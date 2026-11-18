// ==============================================================================
// TypeScript Definitions for Hono Backend & Cloudflare Edge Bindings
// ==============================================================================

export type Bindings = {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  STAFF_SERVICE?: Fetcher;
  ADMIN_PIN?: string;
  CORS_ORIGIN?: string;
  ENVIRONMENT?: string;
  NOTIFICATION_EMAIL?: string;
  RESEND_API_KEY?: string;
  EMAIL_WEBHOOK_URL?: string;
  SEND_EMAIL?: any;
};

export interface Booking {
  id: string;
  property: string;           // 'Ripple 1 BHK' | '2 BHK' | 'Demilune' | 'Luna (Studio Room)'
  guestName: string;
  phone?: string;
  email?: string;
  checkInDate: string;        // YYYY-MM-DD
  checkOutDate: string;       // YYYY-MM-DD
  nights: number;
  guestsCount: number;
  platform: string;           // 'Direct' | 'Direct Booking' | 'Manual Booking' | 'Booking.com' | 'Airbnb' | 'Blocked'
  bookingMode?: string;       // 'Airbnb' | 'Booking.com' | 'Direct Booking' | 'Manual Booking' | 'Blocked'
  source?: string;            // Canonical source: 'Airbnb' | 'Booking.com' | 'Direct Booking' | 'Manual Booking' | 'Blocked' | 'Other'
  reservationCode?: string;
  externalReservationId?: string;
  externalUid?: string;
  payout?: string;
  totalPrice?: number | null;
  currency?: string;
  taxesFees?: number;
  paymentStatus?: string;     // 'Paid' | 'Paid in Full' | 'Deposit Paid' | 'Pay on Arrival'
  otaPayoutStatus?: string;   // 'Pending Settlement' | 'Settled' | 'N/A'
  status: string;             // 'Confirmed' | 'Checked In' | 'Completed' | 'Cancelled' | 'Blocked'
  notes?: string;
  idDocuments?: any[];
  syncVersion?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Property {
  id: string;
  name: string;
  color: string;
  airbnbListingId?: string;
  bookingComPropertyId?: string;
  airbnbIcalUrl?: string;
  bookingComIcalUrl?: string;
  otherIcalUrl?: string;
  airbnbWebhookUrl?: string;
  bookingComWebhookUrl?: string;
  syncWebhookSecret?: string;
  lastSyncedAt?: string;
  createdAt?: string;
  activeBookingsCount?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;              // YYYY-MM-DD
  property?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialSummary {
  month: string;             // YYYY-MM
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  bookingsCount: number;
  expensesCount: number;
}

export interface Submission {
  id: string;
  reservationCode?: string;
  propertyOption?: string;
  checkInDate?: string;
  checkOutDate?: string;
  arrivalTime?: string;
  totalGuests?: number;
  guestNumber?: string;
  guestName: string;
  age?: number;
  phone?: string;
  email?: string;
  comingFrom?: string;
  goingTo?: string;
  purposeOfVisit?: string;
  customDetails?: Record<string, any> | string;
  idType?: string;
  idNumber?: string;
  frontPhotoKey?: string;
  frontPhotoUrl?: string;
  backPhotoKey?: string;
  backPhotoUrl?: string;
  signatureKey?: string;
  signatureUrl?: string;
  createdAt?: string;
}

export interface GuestInput {
  name: string;
  age?: number;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  frontPhoto?: string;        // base64 data URI or binary
  backPhoto?: string;         // base64 data URI or binary
  isPrimary?: boolean;
  guestNumber?: number;
}

export interface CheckInPayload {
  reservationCode?: string;
  propertyOption?: string;
  checkInDate?: string;
  checkOutDate?: string;
  arrivalTime?: string;
  totalGuests?: number;
  comingFrom?: string;
  goingTo?: string;
  purposeOfVisit?: string;
  customDetails?: Record<string, any>;
  signature?: string;         // base64 data URI
  guests: GuestInput[];
}

export interface Channel {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  is_active?: number;
  type?: 'direct' | 'ota' | 'custom';
  isSystem?: boolean;
  is_system?: number;
  createdAt?: string;
  bookingsCount?: number;
  activeBookingsCount?: number;
}
