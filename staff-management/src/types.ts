export interface Env {
	DB: D1Database;
	AUTH_PIN?: string;
}

export interface Property {
	id: string;
	name: string;
	monthly_leave_allowance: number;
	has_lodging?: number;
	has_fooding?: number;
	has_services?: number;
	services_label?: string;
	business_type?: string;
	created_at?: string;
}

export interface Staff {
	id: string;
	property_id: string;
	property_name?: string;
	property_allowance?: number;
	name: string;
	role: string | null;
	phone: string | null;
	address: string | null;
	salary: number;
	active: number;
	custom_leave_allowance: number | null;
	joining_date?: string | null;
	opening_leave_balance?: number;
	bank_account_name?: string | null;
	bank_name?: string | null;
	bank_account_number?: string | null;
	bank_ifsc?: string | null;
	bank_upi_id?: string | null;
	bank_qr_code?: string | null;
	is_manager?: number;
	manager_pin?: string | null;
	created_at?: string;
}

export interface AttendanceRecord {
	id: string;
	staff_id: string;
	date: string;
	status: "present" | "absent" | "day_off" | "leave";
	notes: string | null;
	updated_at?: string;
}

export interface SalaryAdvance {
	id: string;
	staff_id: string;
	month: string;
	amount: number;
	notes: string | null;
	date: string;
	created_at?: string;
}

export interface SalaryBonus {
	id: string;
	staff_id: string;
	month: string;
	amount: number;
	comments: string | null;
	date: string;
	created_at?: string;
}

export interface SalaryPayment {
	id: string;
	staff_id: string;
	month: string;
	amount: number;
	status: "paid" | "unpaid";
	payment_date?: string | null;
	payment_mode?: string | null;
	reference_no?: string | null;
	notes?: string | null;
	updated_at?: string;
}

export interface StaffDocument {
	id: string;
	staff_id: string;
	file_name: string;
	file_type: string;
	file_size: number;
	file_data?: string;
	created_at?: string;
}

export interface DailyFinance {
	id: string;
	property_id: string;
	property_name?: string;
	date: string;
	lodging_online: number;
	lodging_cash: number;
	fooding_online: number;
	fooding_cash: number;
	services_online?: number;
	services_cash?: number;
	lodging_offline?: number;
	fooding_offline?: number;
	other_sales?: number;
	total_sales: number;
	expenses_total: number;
	expense_notes?: string | null;
	net_revenue: number;
	notes?: string | null;
	submitted_by?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface Room {
	id: string;
	property_id: string;
	room_number: string;
	room_type?: string;
	base_price?: number;
	active: number;
	created_at?: string;
	updated_at?: string;
}

export interface RoomBooking {
	id: string;
	property_id: string;
	room_id: string;
	room_number?: string;
	room_type?: string;
	date: string;
	amount: number;
	payment_mode: "online" | "cash";
	guest_name?: string | null;
	notes?: string | null;
	slot_number?: number;
	created_by?: string | null;
	created_at?: string;
	updated_at?: string;
}


