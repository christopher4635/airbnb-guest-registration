// ==============================================================================
// TypeScript Definitions for Hono Backend & Cloudflare Edge Bindings
// ==============================================================================

export type Bindings = {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  ADMIN_PIN?: string;
  CORS_ORIGIN?: string;
  ENVIRONMENT?: string;
};

export interface Booking {
  id: string;
  property: string;           // '1 BHK' | '2 BHK' | '1 Room / Studio'
  guestName: string;
  phone?: string;
  email?: string;
  checkInDate: string;        // YYYY-MM-DD
  checkOutDate: string;       // YYYY-MM-DD
  nights: number;
  guestsCount: number;
  platform: string;           // 'Direct' | 'Booking.com' | 'Airbnb' | 'Blocked'
  reservationCode?: string;
  payout?: string;
  paymentStatus?: string;     // 'Paid in Full' | 'Deposit Paid' | 'Pay on Arrival'
  status: string;             // 'Confirmed' | 'Checked In' | 'Completed' | 'Cancelled' | 'Blocked'
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
