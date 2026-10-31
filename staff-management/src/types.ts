export interface Env {
	DB: D1Database;
	AUTH_PIN?: string;
}

export interface Property {
	id: string;
	name: string;
	monthly_leave_allowance: number;
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
