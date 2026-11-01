import { getDashboardHtml } from "./ui";
import type { Env, Property, Staff, AttendanceRecord, SalaryAdvance, SalaryBonus, SalaryPayment, StaffDocument, DailyFinance } from "./types";

function jsonResponse(data: any, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, X-PIN, X-Auth-PIN",
		},
	});
}

interface AuthContext {
	authorized: boolean;
	role?: "admin" | "manager";
	manager?: {
		id: string;
		name: string;
		property_id: string;
		property_name?: string;
	};
}

async function getAdminPin(env: Env): Promise<string> {
	try {
		const row = await env.DB.prepare(
			"SELECT value FROM app_settings WHERE key = 'admin_pin'"
		).first<{ value: string }>();
		if (row && row.value && row.value.trim().length === 4) {
			return row.value.trim();
		}
	} catch (err) {
		// app_settings table might not exist yet
	}
	return env.AUTH_PIN || "4635";
}

async function getAuthContext(request: Request, env: Env): Promise<AuthContext> {
	const expectedPin = await getAdminPin(env);
	let token = "";
	const authHeader = request.headers.get("Authorization");
	if (authHeader) {
		token = authHeader.replace(/^Bearer\s+/i, "").trim();
	}
	if (!token) {
		const customHeader = request.headers.get("X-PIN") || request.headers.get("X-Auth-PIN");
		if (customHeader) token = customHeader.trim();
	}
	if (!token) {
		const url = new URL(request.url);
		const queryPin = url.searchParams.get("pin");
		if (queryPin) token = queryPin.trim();
	}

	if (!token) return { authorized: false };

	if (token === expectedPin) {
		return { authorized: true, role: "admin" };
	}

	try {
		const manager = await env.DB.prepare(`
			SELECT s.id, s.name, s.property_id, p.name AS property_name
			FROM staff s
			JOIN properties p ON s.property_id = p.id
			WHERE s.active = 1 AND s.is_manager = 1 AND s.manager_pin = ?
		`).bind(token).first<{ id: string; name: string; property_id: string; property_name: string }>();

		if (manager) {
			return { authorized: true, role: "manager", manager };
		}
	} catch (err) {
		console.error("Auth context lookup error:", err);
	}

	return { authorized: false };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		if (method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization, X-PIN, X-Auth-PIN",
				},
			});
		}

		// 1. Serve Web Application Dashboard
		if (path === "/" || path === "/index.html") {
			return new Response(getDashboardHtml(), {
				headers: {
					"Content-Type": "text/html; charset=utf-8",
					"Cache-Control": "no-cache, no-store, must-revalidate",
					"Pragma": "no-cache",
					"Expires": "0"
				},
			});
		}

		// 2. Roles & Appointed Managers Endpoint (for Login User Dropdown - NO SECRETS EXPOSED!)
		if (path === "/api/auth/roles" && method === "GET") {
			try {
				const managers = await env.DB.prepare(`
					SELECT s.id, s.name, s.property_id, p.name AS property_name
					FROM staff s
					JOIN properties p ON s.property_id = p.id
					WHERE s.active = 1 AND s.is_manager = 1
					ORDER BY s.name ASC
				`).all<{ id: string; name: string; property_id: string; property_name: string }>();

				const managerList = managers.results || [];
				return jsonResponse({
					success: true,
					roles: [
						{ id: "admin", role: "admin", name: "Admin (Owner / Full Access)" },
						...(managerList.length > 0 ? managerList.map(m => ({
							id: m.id,
							role: "manager",
							staff_id: m.id,
							name: `Manager: ${m.name} (${m.property_name})`
						})) : [{
							id: "manager",
							role: "manager",
							name: "Manager (Roll Call & Attendance)"
						}])
					]
				});
			} catch (err: any) {
				return jsonResponse({
					success: true,
					roles: [
						{ id: "admin", role: "admin", name: "Admin (Owner / Full Access)" },
						{ id: "manager", role: "manager", name: "Manager (Roll Call & Attendance)" }
					]
				});
			}
		}

		// 3. PIN Verification Endpoint
		if (path === "/api/auth/verify" && method === "POST") {
			try {
				const body = (await request.json()) as { pin?: string; role?: string; staff_id?: string };
				const pin = body?.pin?.trim();
				const selectedRole = body?.role?.trim();
				const selectedStaffId = body?.staff_id?.trim();
				const expectedPin = await getAdminPin(env);

				if (!pin) {
					return jsonResponse({ success: false, error: "Please enter your 4-digit PIN." }, 400);
				}

				// Check 1: Is this the Master Admin PIN? (Always grants Admin access)
				if (pin === expectedPin) {
					return jsonResponse({
						success: true,
						role: "admin",
						name: "Administrator"
					});
				}

				// Check 2: Is this a Manager PIN?
				let manager = null;
				if (selectedStaffId && selectedStaffId !== "manager" && selectedStaffId !== "admin") {
					manager = await env.DB.prepare(`
						SELECT s.id, s.name, s.property_id, p.name AS property_name
						FROM staff s
						JOIN properties p ON s.property_id = p.id
						WHERE s.active = 1 AND s.is_manager = 1 AND s.manager_pin = ? AND s.id = ?
					`).bind(pin, selectedStaffId).first<{ id: string; name: string; property_id: string; property_name: string }>();
				}

				if (!manager) {
					manager = await env.DB.prepare(`
						SELECT s.id, s.name, s.property_id, p.name AS property_name
						FROM staff s
						JOIN properties p ON s.property_id = p.id
						WHERE s.active = 1 AND s.is_manager = 1 AND s.manager_pin = ?
					`).bind(pin).first<{ id: string; name: string; property_id: string; property_name: string }>();
				}

				if (manager) {
					return jsonResponse({
						success: true,
						role: "manager",
						staff_id: manager.id,
						name: manager.name,
						property_id: manager.property_id,
						property_name: manager.property_name
					});
				}

				// Neither Admin nor Manager PIN
				return jsonResponse({ success: false, error: "Incorrect PIN. Please check and try again." }, 401);
			} catch (err: any) {
				return jsonResponse({ success: false, error: err.message }, 400);
			}
		}

		// 3. API Auth Guard & Role Permissions
		let auth: AuthContext = { authorized: false };
		if (path.startsWith("/api/")) {
			auth = await getAuthContext(request, env);
			if (!auth.authorized) {
				return jsonResponse({ error: "Unauthorized. Enter valid PIN." }, 401);
			}

			// Manager Restrictions: can ONLY view properties/staff, attendance, and sales/expenses for their assigned property!
			if (auth.role === "manager") {
				const isAllowedForManager =
					(path === "/api/properties" && method === "GET") ||
					(path === "/api/staff" && method === "GET") ||
					path.startsWith("/api/attendance") || // GET /api/attendance, POST /api/attendance, POST /api/attendance/bulk
					(path === "/api/finances" && (method === "GET" || method === "POST")); // GET & POST for their property only

				if (!isAllowedForManager) {
					return jsonResponse({ error: "Forbidden. Managers only have access to Attendance, Roll Call, and Daily Sales & Expenses." }, 403);
				}
			}
		}

		try {
			// POST /api/admin/change-pin (Admin changes their own 4-digit Master PIN)
			if (path === "/api/admin/change-pin" && method === "POST") {
				if (auth.role !== "admin") {
					return jsonResponse({ error: "Forbidden. Admin only." }, 403);
				}
				try {
					const currentAdminPin = await getAdminPin(env);
					const body = (await request.json()) as { current_pin?: string; new_pin?: string };
					const currentPin = body?.current_pin?.trim();
					const newPin = body?.new_pin?.trim();

					if (!currentPin || currentPin !== currentAdminPin) {
						return jsonResponse({ success: false, error: "Current Admin PIN is incorrect." }, 400);
					}

					if (!newPin || !/^\d{4}$/.test(newPin)) {
						return jsonResponse({ success: false, error: "New PIN must be exactly 4 numeric digits." }, 400);
					}

					await env.DB.prepare(`
						INSERT INTO app_settings (key, value, updated_at)
						VALUES ('admin_pin', ?, CURRENT_TIMESTAMP)
						ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
					`).bind(newPin).run();

					return jsonResponse({ success: true, message: "Admin PIN changed successfully." });
				} catch (err: any) {
					return jsonResponse({ success: false, error: err.message }, 500);
				}
			}

			// POST /api/admin/change-manager-pin (Admin updates a manager's PIN)
			if (path === "/api/admin/change-manager-pin" && method === "POST") {
				if (auth.role !== "admin") {
					return jsonResponse({ error: "Forbidden. Admin only." }, 403);
				}
				try {
					const body = (await request.json()) as { staff_id?: string; new_pin?: string };
					const staffId = body?.staff_id?.trim();
					const newPin = body?.new_pin?.trim();

					if (!staffId) {
						return jsonResponse({ success: false, error: "Staff ID is required." }, 400);
					}
					if (!newPin || !/^\d{4}$/.test(newPin)) {
						return jsonResponse({ success: false, error: "Manager PIN must be exactly 4 numeric digits." }, 400);
					}

					await env.DB.prepare(`
						UPDATE staff SET is_manager = 1, manager_pin = ? WHERE id = ?
					`).bind(newPin, staffId).run();

					return jsonResponse({ success: true, message: "Manager PIN updated successfully." });
				} catch (err: any) {
					return jsonResponse({ success: false, error: err.message }, 500);
				}
			}

			// GET /api/admin/security (Admin lists all appointed managers and their status)
			if (path === "/api/admin/security" && method === "GET") {
				if (auth.role !== "admin") {
					return jsonResponse({ error: "Forbidden. Admin only." }, 403);
				}
				try {
					const managers = await env.DB.prepare(`
						SELECT s.id, s.name, s.role, s.manager_pin, s.property_id, p.name AS property_name
						FROM staff s
						JOIN properties p ON s.property_id = p.id
						WHERE s.active = 1 AND s.is_manager = 1
						ORDER BY s.name ASC
					`).all();

					return jsonResponse({
						success: true,
						managers: managers.results || []
					});
				} catch (err: any) {
					return jsonResponse({ success: false, error: err.message }, 500);
				}
			}

			// GET /api/properties
			if (path === "/api/properties" && method === "GET") {
				if (auth.role === "manager" && auth.manager?.property_id) {
					const { results } = await env.DB.prepare(
						"SELECT * FROM properties WHERE id = ?"
					).bind(auth.manager.property_id).all<Property>();
					return jsonResponse(results);
				}
				const { results } = await env.DB.prepare(
					"SELECT * FROM properties ORDER BY name ASC"
				).all<Property>();
				return jsonResponse(results);
			}

			// PUT /api/properties/:id
			if (path.startsWith("/api/properties/") && method === "PUT") {
				const id = path.split("/")[3];
				const body = (await request.json()) as Partial<Property>;
				if (body.monthly_leave_allowance !== undefined) {
					await env.DB.prepare(
						"UPDATE properties SET monthly_leave_allowance = ? WHERE id = ?"
					).bind(body.monthly_leave_allowance, id).run();
				}
				if (body.name !== undefined) {
					await env.DB.prepare(
						"UPDATE properties SET name = ? WHERE id = ?"
					).bind(body.name, id).run();
				}
				return jsonResponse({ success: true });
			}

			// GET /api/staff
			if (path === "/api/staff" && method === "GET") {
				let propertyId = url.searchParams.get("property_id");
				// Manager access is strictly locked to their assigned property only
				if (auth.role === "manager" && auth.manager?.property_id) {
					propertyId = auth.manager.property_id;
				}

				let query = `
					SELECT s.*, p.name AS property_name, p.monthly_leave_allowance AS property_allowance,
						(SELECT COUNT(*) FROM staff_documents d WHERE d.staff_id = s.id) AS document_count
					FROM staff s
					JOIN properties p ON s.property_id = p.id
					WHERE s.active = 1
				`;
				let results: Staff[] = [];
				if (propertyId && propertyId !== "all") {
					query += " AND s.property_id = ?";
					const res = await env.DB.prepare(query + " ORDER BY s.name ASC")
						.bind(propertyId)
						.all<Staff>();
					results = res.results;
				} else {
					const res = await env.DB.prepare(query + " ORDER BY s.name ASC").all<Staff>();
					results = res.results;
				}

				if (auth.role === "manager") {
					results.forEach((s: any) => {
						delete s.salary;
						delete s.bank_account_name;
						delete s.bank_name;
						delete s.bank_account_number;
						delete s.bank_ifsc;
						delete s.bank_upi_id;
						delete s.bank_qr_code;
						delete s.manager_pin;
					});
				}

				return jsonResponse(results);
			}

			// POST /api/staff
			if (path === "/api/staff" && method === "POST") {
				const body = (await request.json()) as any;
				const id = "stf_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
				await env.DB.prepare(`
					INSERT INTO staff (
						id, property_id, name, role, phone, address, salary, active,
						custom_leave_allowance, joining_date, opening_leave_balance,
						bank_account_name, bank_name, bank_account_number, bank_ifsc, bank_upi_id, bank_qr_code,
						is_manager, manager_pin
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`).bind(
					id,
					body.property_id,
					body.name,
					body.role || null,
					body.phone || null,
					body.address || null,
					body.salary !== undefined ? parseFloat(body.salary) : 0,
					body.custom_leave_allowance !== undefined ? body.custom_leave_allowance : null,
					body.joining_date || null,
					body.opening_leave_balance !== undefined ? parseFloat(body.opening_leave_balance) : 0.0,
					body.bank_account_name || null,
					body.bank_name || null,
					body.bank_account_number || null,
					body.bank_ifsc || null,
					body.bank_upi_id || null,
					body.bank_qr_code || null,
					body.is_manager ? 1 : 0,
					body.manager_pin || null
				).run();
				return jsonResponse({ success: true, id });
			}

			// PUT /api/staff/:id
			if (path.startsWith("/api/staff/") && method === "PUT" && !path.includes("/documents")) {
				const id = path.split("/")[3];
				const body = (await request.json()) as any;
				await env.DB.prepare(`
					UPDATE staff
					SET property_id = ?, name = ?, role = ?, phone = ?, address = ?, salary = ?,
					    custom_leave_allowance = ?, joining_date = ?, opening_leave_balance = ?,
					    bank_account_name = ?, bank_name = ?, bank_account_number = ?, bank_ifsc = ?,
					    bank_upi_id = ?, bank_qr_code = ?,
					    is_manager = ?, manager_pin = ?
					WHERE id = ?
				`).bind(
					body.property_id,
					body.name,
					body.role || null,
					body.phone || null,
					body.address || null,
					body.salary !== undefined ? parseFloat(body.salary) : 0,
					body.custom_leave_allowance !== undefined ? body.custom_leave_allowance : null,
					body.joining_date || null,
					body.opening_leave_balance !== undefined ? parseFloat(body.opening_leave_balance) : 0.0,
					body.bank_account_name || null,
					body.bank_name || null,
					body.bank_account_number || null,
					body.bank_ifsc || null,
					body.bank_upi_id || null,
					body.bank_qr_code !== undefined ? body.bank_qr_code : null,
					body.is_manager ? 1 : 0,
					body.manager_pin || null,
					id
				).run();
				return jsonResponse({ success: true });
			}

			// DELETE /api/staff/:id (soft delete)
			if (path.startsWith("/api/staff/") && method === "DELETE" && !path.includes("/documents")) {
				const id = path.split("/")[3];
				await env.DB.prepare("UPDATE staff SET active = 0 WHERE id = ?").bind(id).run();
				return jsonResponse({ success: true });
			}

			// GET /api/attendance?month=YYYY-MM
			if (path === "/api/attendance" && method === "GET") {
				const month = url.searchParams.get("month"); // e.g. 2026-10
				if (!month) {
					return jsonResponse({ error: "Missing month query param" }, 400);
				}

				let records: AttendanceRecord[] = [];
				let priorLeaves: { staff_id: string; count: number }[] = [];
				const startOfMonthDate = `${month}-01`;

				if (auth.role === "manager" && auth.manager?.property_id) {
					// Manager only gets attendance for staff at their assigned property
					const resRec = await env.DB.prepare(`
						SELECT a.*
						FROM attendance a
						JOIN staff s ON a.staff_id = s.id
						WHERE a.date LIKE ? AND s.property_id = ? AND s.active = 1
						ORDER BY a.date ASC
					`).bind(`${month}-%`, auth.manager.property_id).all<AttendanceRecord>();
					records = resRec.results;

					const resPrior = await env.DB.prepare(`
						SELECT a.staff_id, COUNT(*) as count
						FROM attendance a
						JOIN staff s ON a.staff_id = s.id
						WHERE a.date < ? AND a.status = 'leave' AND s.property_id = ? AND s.active = 1
						GROUP BY a.staff_id
					`).bind(startOfMonthDate, auth.manager.property_id).all<{ staff_id: string; count: number }>();
					priorLeaves = resPrior.results;
				} else {
					const resRec = await env.DB.prepare(
						"SELECT * FROM attendance WHERE date LIKE ? ORDER BY date ASC"
					).bind(`${month}-%`).all<AttendanceRecord>();
					records = resRec.results;

					const resPrior = await env.DB.prepare(`
						SELECT staff_id, COUNT(*) as count
						FROM attendance
						WHERE date < ? AND status = 'leave'
						GROUP BY staff_id
					`).bind(startOfMonthDate).all<{ staff_id: string; count: number }>();
					priorLeaves = resPrior.results;
				}

				const priorMap: Record<string, number> = {};
				priorLeaves.forEach((c) => {
					priorMap[c.staff_id] = c.count;
				});

				return jsonResponse({
					records,
					prior_taken: priorMap,
				});
			}

			// POST /api/attendance
			if (path === "/api/attendance" && method === "POST") {
				const body = (await request.json()) as {
					staff_id: string;
					date: string;
					status: string;
					notes?: string;
				};
				if (!body.staff_id || !body.date || !body.status) {
					return jsonResponse({ error: "Missing required fields" }, 400);
				}

				if (auth.role === "manager" && auth.manager?.property_id) {
					const staffCheck = await env.DB.prepare(
						"SELECT property_id FROM staff WHERE id = ?"
					).bind(body.staff_id).first<{ property_id: string }>();
					if (!staffCheck || staffCheck.property_id !== auth.manager.property_id) {
						return jsonResponse({ error: "Forbidden: You can only mark attendance for staff at your assigned property." }, 403);
					}
				}

				const recordId = `${body.staff_id}_${body.date}`;
				await env.DB.prepare(`
					INSERT INTO attendance (id, staff_id, date, status, notes, updated_at)
					VALUES (?, ?, ?, ?, ?, datetime('now'))
					ON CONFLICT(id) DO UPDATE SET
						status = excluded.status,
						notes = excluded.notes,
						updated_at = datetime('now')
				`).bind(
					recordId,
					body.staff_id,
					body.date,
					body.status,
					body.notes || null
				).run();
				return jsonResponse({ success: true });
			}

			// POST /api/attendance/bulk
			if (path === "/api/attendance/bulk" && method === "POST") {
				const body = (await request.json()) as {
					staff_ids: string[];
					date: string;
					status: string;
				};
				if (!Array.isArray(body.staff_ids) || !body.date || !body.status) {
					return jsonResponse({ error: "Invalid bulk parameters" }, 400);
				}

				if (auth.role === "manager" && auth.manager?.property_id) {
					const placeholders = body.staff_ids.map(() => "?").join(",");
					const { results: staffRows } = await env.DB.prepare(
						`SELECT id, property_id FROM staff WHERE id IN (${placeholders})`
					).bind(...body.staff_ids).all<{ id: string; property_id: string }>();

					const unauthorized = staffRows.some(s => s.property_id !== auth.manager!.property_id);
					if (unauthorized || staffRows.length !== body.staff_ids.length) {
						return jsonResponse({ error: "Forbidden: You can only mark attendance for staff at your assigned property." }, 403);
					}
				}

				const statements = body.staff_ids.map((staffId) => {
					const recordId = `${staffId}_${body.date}`;
					return env.DB.prepare(`
						INSERT INTO attendance (id, staff_id, date, status, notes, updated_at)
						VALUES (?, ?, ?, ?, NULL, datetime('now'))
						ON CONFLICT(id) DO UPDATE SET
							status = excluded.status,
							updated_at = datetime('now')
					`).bind(recordId, staffId, body.date, body.status);
				});

				if (statements.length > 0) {
					await env.DB.batch(statements);
				}
				return jsonResponse({ success: true, count: body.staff_ids.length });
			}

			// -----------------------------------------------------------------
			// SALARY ADVANCES API
			// -----------------------------------------------------------------

			// GET /api/advances?month=YYYY-MM&staff_id=...
			if (path === "/api/advances" && method === "GET") {
				const month = url.searchParams.get("month");
				const staffId = url.searchParams.get("staff_id");
				let query = "SELECT a.*, s.name as staff_name FROM salary_advances a JOIN staff s ON a.staff_id = s.id WHERE 1=1";
				const params: any[] = [];
				if (month) {
					query += " AND a.month = ?";
					params.push(month);
				}
				if (staffId) {
					query += " AND a.staff_id = ?";
					params.push(staffId);
				}
				query += " ORDER BY a.date DESC";
				const stmt = env.DB.prepare(query);
				const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
				return jsonResponse(results);
			}

			// POST /api/advances
			if (path === "/api/advances" && method === "POST") {
				const body = (await request.json()) as {
					staff_id: string;
					month: string;
					amount: number;
					date: string;
					notes?: string;
				};
				if (!body.staff_id || !body.month || !body.amount || !body.date) {
					return jsonResponse({ error: "Missing required fields" }, 400);
				}
				const id = "adv_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
				await env.DB.prepare(`
					INSERT INTO salary_advances (id, staff_id, month, amount, notes, date)
					VALUES (?, ?, ?, ?, ?, ?)
				`).bind(
					id,
					body.staff_id,
					body.month,
					parseFloat(String(body.amount)),
					body.notes || null,
					body.date
				).run();
				return jsonResponse({ success: true, id });
			}

			// DELETE /api/advances/:id
			if (path.startsWith("/api/advances/") && method === "DELETE") {
				const id = path.split("/")[3];
				await env.DB.prepare("DELETE FROM salary_advances WHERE id = ?").bind(id).run();
				return jsonResponse({ success: true });
			}

			// -----------------------------------------------------------------
			// SALARY BONUSES & INCENTIVES API (WITH COMMENTS)
			// -----------------------------------------------------------------

			// GET /api/bonuses?month=YYYY-MM&staff_id=...
			if (path === "/api/bonuses" && method === "GET") {
				const month = url.searchParams.get("month");
				const staffId = url.searchParams.get("staff_id");
				let query = "SELECT b.*, s.name as staff_name FROM salary_bonuses b JOIN staff s ON b.staff_id = s.id WHERE 1=1";
				const params: any[] = [];
				if (month) {
					query += " AND b.month = ?";
					params.push(month);
				}
				if (staffId) {
					query += " AND b.staff_id = ?";
					params.push(staffId);
				}
				query += " ORDER BY b.date DESC, b.created_at DESC";
				const stmt = env.DB.prepare(query);
				const { results } = params.length > 0 ? await stmt.bind(...params).all<SalaryBonus>() : await stmt.all<SalaryBonus>();
				return jsonResponse(results);
			}

			// POST /api/bonuses
			if (path === "/api/bonuses" && method === "POST") {
				const body = (await request.json()) as {
					staff_id: string;
					month: string;
					amount: number | string;
					date: string;
					comments?: string;
				};
				if (!body.staff_id || !body.month || !body.amount || !body.date) {
					return jsonResponse({ error: "Missing required fields: staff_id, month, amount, date" }, 400);
				}
				const cleanAmount = parseFloat(String(body.amount).replace(/[^0-9.]/g, ''));
				if (isNaN(cleanAmount) || cleanAmount <= 0) {
					return jsonResponse({ error: "Invalid bonus amount. Enter a positive number." }, 400);
				}
				const id = "bon_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
				await env.DB.prepare(`
					INSERT INTO salary_bonuses (id, staff_id, month, amount, comments, date)
					VALUES (?, ?, ?, ?, ?, ?)
				`).bind(
					id,
					body.staff_id,
					body.month,
					cleanAmount,
					(body.comments || "").trim() || "Performance / Festival Bonus",
					body.date
				).run();
				return jsonResponse({ success: true, id, amount: cleanAmount });
			}

			// DELETE /api/bonuses/:id
			if (path.startsWith("/api/bonuses/") && method === "DELETE") {
				const id = path.split("/")[3];
				await env.DB.prepare("DELETE FROM salary_bonuses WHERE id = ?").bind(id).run();
				return jsonResponse({ success: true });
			}

			// -----------------------------------------------------------------
			// SALARY PAYMENTS API (PAID / UNPAID STATUS & METHODS)
			// -----------------------------------------------------------------

			// GET /api/payments?month=YYYY-MM
			if (path === "/api/payments" && method === "GET") {
				const month = url.searchParams.get("month");
				if (!month) {
					return jsonResponse({ error: "Missing month" }, 400);
				}
				const { results } = await env.DB.prepare(`
					SELECT * FROM salary_payments WHERE month = ?
				`).bind(month).all<SalaryPayment>();
				return jsonResponse(results);
			}

			// POST /api/payments
			if (path === "/api/payments" && method === "POST") {
				const body = (await request.json()) as {
					staff_id: string;
					month: string;
					amount: number;
					status: "paid" | "unpaid";
					payment_date?: string;
					payment_mode?: string;
					reference_no?: string;
					notes?: string;
				};
				if (!body.staff_id || !body.month || !body.status) {
					return jsonResponse({ error: "Missing required payment fields" }, 400);
				}
				const id = `${body.staff_id}_${body.month}`;
				await env.DB.prepare(`
					INSERT INTO salary_payments (
						id, staff_id, month, amount, status, payment_date, payment_mode, reference_no, notes, updated_at
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
					ON CONFLICT(id) DO UPDATE SET
						amount = excluded.amount,
						status = excluded.status,
						payment_date = excluded.payment_date,
						payment_mode = excluded.payment_mode,
						reference_no = excluded.reference_no,
						notes = excluded.notes,
						updated_at = datetime('now')
				`).bind(
					id,
					body.staff_id,
					body.month,
					parseFloat(String(body.amount || 0)),
					body.status,
					body.payment_date || null,
					body.payment_mode || null,
					body.reference_no || null,
					body.notes || null
				).run();
				return jsonResponse({ success: true, id });
			}

			// -----------------------------------------------------------------
			// DOCUMENTS API
			// -----------------------------------------------------------------

			// GET /api/staff/:id/documents (list documents without heavy data)
			if (path.startsWith("/api/staff/") && path.endsWith("/documents") && method === "GET") {
				const staffId = path.split("/")[3];
				const { results } = await env.DB.prepare(`
					SELECT id, staff_id, file_name, file_type, file_size, created_at
					FROM staff_documents
					WHERE staff_id = ?
					ORDER BY created_at DESC
				`).bind(staffId).all<StaffDocument>();
				return jsonResponse(results);
			}

			// POST /api/staff/:id/documents (upload document)
			if (path.startsWith("/api/staff/") && path.endsWith("/documents") && method === "POST") {
				const staffId = path.split("/")[3];
				const body = (await request.json()) as {
					file_name: string;
					file_type: string;
					file_size: number;
					file_data: string; // base64 data URI
				};
				if (!body.file_name || !body.file_data) {
					return jsonResponse({ error: "Missing file name or data" }, 400);
				}
				const id = "doc_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
				await env.DB.prepare(`
					INSERT INTO staff_documents (id, staff_id, file_name, file_type, file_size, file_data)
					VALUES (?, ?, ?, ?, ?, ?)
				`).bind(
					id,
					staffId,
					body.file_name,
					body.file_type || "application/octet-stream",
					body.file_size || 0,
					body.file_data
				).run();
				return jsonResponse({ success: true, id });
			}

			// GET /api/documents/:id (fetch single document with data for preview/download)
			if (path.startsWith("/api/documents/") && method === "GET") {
				const docId = path.split("/")[3];
				const doc = await env.DB.prepare(`
					SELECT * FROM staff_documents WHERE id = ?
				`).bind(docId).first<StaffDocument>();
				if (!doc) {
					return jsonResponse({ error: "Document not found" }, 404);
				}
				return jsonResponse(doc);
			}

			// DELETE /api/documents/:id
			if (path.startsWith("/api/documents/") && method === "DELETE") {
				const docId = path.split("/")[3];
				await env.DB.prepare("DELETE FROM staff_documents WHERE id = ?").bind(docId).run();
				return jsonResponse({ success: true });
			}

			// GET /api/finances (Manager gets their property only, Admin can filter by property/month/date)
			if (path === "/api/finances" && method === "GET") {
				let propertyId = url.searchParams.get("property_id") || "";
				if (auth.role === "manager") {
					if (!auth.manager?.property_id) {
						return jsonResponse({ error: "Manager has no assigned property" }, 403);
					}
					propertyId = auth.manager.property_id;
				}
				const month = url.searchParams.get("month") || "";
				const date = url.searchParams.get("date") || "";
				const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 1000);

				let query = `
					SELECT f.*, p.name AS property_name
					FROM daily_finances f
					LEFT JOIN properties p ON f.property_id = p.id
					WHERE 1=1
				`;
				const params: any[] = [];

				if (propertyId) {
					query += " AND f.property_id = ?";
					params.push(propertyId);
				}
				if (date) {
					query += " AND f.date = ?";
					params.push(date);
				} else if (month) {
					query += " AND f.date LIKE ? || '%'";
					params.push(month);
				}

				query += " ORDER BY f.date DESC, f.created_at DESC LIMIT ?";
				params.push(limit);

				const { results } = await env.DB.prepare(query).bind(...params).all<DailyFinance>();
				return jsonResponse(results || []);
			}

			// POST /api/finances (Add or update daily sales and expenses record)
			if (path === "/api/finances" && method === "POST") {
				const body = (await request.json()) as Partial<DailyFinance>;
				let propertyId = body.property_id?.trim() || "";
				let submittedBy = "Admin";

				if (auth.role === "manager") {
					if (!auth.manager?.property_id) {
						return jsonResponse({ error: "Manager has no assigned property" }, 403);
					}
					propertyId = auth.manager.property_id;
					submittedBy = `Manager: ${auth.manager.name}`;
				}

				if (!propertyId) {
					return jsonResponse({ error: "Property is required." }, 400);
				}
				const date = body.date?.trim() || "";
				if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
					return jsonResponse({ error: "Valid date (YYYY-MM-DD) is required." }, 400);
				}

				const lodgingOnline = Math.max(0, Math.round(Number(body.lodging_online) || 0));
				const lodgingOffline = Math.max(0, Math.round(Number(body.lodging_offline) || 0));
				const foodingOnline = Math.max(0, Math.round(Number(body.fooding_online) || 0));
				const foodingOffline = Math.max(0, Math.round(Number(body.fooding_offline) || 0));
				const otherSales = Math.max(0, Math.round(Number(body.other_sales) || 0));
				const totalSales = lodgingOnline + lodgingOffline + foodingOnline + foodingOffline + otherSales;
				const expensesTotal = Math.max(0, Math.round(Number(body.expenses_total) || 0));
				const expenseNotes = body.expense_notes?.trim() || null;
				const netRevenue = totalSales - expensesTotal;
				const notes = body.notes?.trim() || null;

				const id = body.id || `fin_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

				await env.DB.prepare(`
					INSERT INTO daily_finances (
						id, property_id, date, lodging_online, lodging_offline,
						fooding_online, fooding_offline, other_sales, total_sales,
						expenses_total, expense_notes, net_revenue, notes, submitted_by,
						created_at, updated_at
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
					ON CONFLICT(property_id, date) DO UPDATE SET
						lodging_online = excluded.lodging_online,
						lodging_offline = excluded.lodging_offline,
						fooding_online = excluded.fooding_online,
						fooding_offline = excluded.fooding_offline,
						other_sales = excluded.other_sales,
						total_sales = excluded.total_sales,
						expenses_total = excluded.expenses_total,
						expense_notes = excluded.expense_notes,
						net_revenue = excluded.net_revenue,
						notes = excluded.notes,
						submitted_by = excluded.submitted_by,
						updated_at = datetime('now')
				`).bind(
					id, propertyId, date, lodgingOnline, lodgingOffline,
					foodingOnline, foodingOffline, otherSales, totalSales,
					expensesTotal, expenseNotes, netRevenue, notes, submittedBy
				).run();

				const saved = await env.DB.prepare(`
					SELECT f.*, p.name AS property_name
					FROM daily_finances f
					LEFT JOIN properties p ON f.property_id = p.id
					WHERE f.property_id = ? AND f.date = ?
				`).bind(propertyId, date).first<DailyFinance>();

				return jsonResponse({ success: true, finance: saved });
			}

			// DELETE /api/finances/:id (Admin only)
			if (path.startsWith("/api/finances/") && method === "DELETE") {
				if (auth.role !== "admin") {
					return jsonResponse({ error: "Forbidden. Admin only can delete financial records." }, 403);
				}
				const finId = path.split("/")[3];
				await env.DB.prepare("DELETE FROM daily_finances WHERE id = ?").bind(finId).run();
				return jsonResponse({ success: true });
			}

			return jsonResponse({ error: "Not Found" }, 404);
		} catch (err: any) {
			console.error("API Error:", err);
			return jsonResponse({ error: err.message || "Internal server error" }, 500);
		}
	},
};
