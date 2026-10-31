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
	name: string;
	role: string | null;
	phone: string | null;
	active: number;
	custom_leave_allowance: number | null;
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
