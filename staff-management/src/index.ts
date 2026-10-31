import { getDashboardHtml } from "./ui";
import type { Env, Property, Staff, AttendanceRecord, SalaryAdvance, StaffDocument } from "./types";

function jsonResponse(data: any, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, X-PIN",
		},
	});
}

function checkAuth(request: Request, env: Env): boolean {
	const expectedPin = env.AUTH_PIN || "4635";
	const authHeader = request.headers.get("Authorization");
	if (authHeader) {
		const token = authHeader.replace(/^Bearer\s+/i, "").trim();
		if (token === expectedPin) return true;
	}
	const customHeader = request.headers.get("X-PIN");
	if (customHeader && customHeader.trim() === expectedPin) return true;

	const url = new URL(request.url);
	const queryPin = url.searchParams.get("pin");
	if (queryPin && queryPin.trim() === expectedPin) return true;

	return false;
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
					"Access-Control-Allow-Headers": "Content-Type, Authorization, X-PIN",
				},
			});
		}

		// 1. Serve Web Application Dashboard
		if (path === "/" || path === "/index.html") {
			return new Response(getDashboardHtml(), {
				headers: { "Content-Type": "text/html; charset=utf-8" },
			});
		}

		// 2. PIN Verification Endpoint
		if (path === "/api/auth/verify" && method === "POST") {
			try {
				const body = (await request.json()) as { pin?: string };
				const expectedPin = env.AUTH_PIN || "4635";
				if (body?.pin === expectedPin) {
					return jsonResponse({ success: true });
				}
				return jsonResponse({ success: false, error: "Invalid PIN" }, 401);
			} catch (err: any) {
				return jsonResponse({ success: false, error: err.message }, 400);
			}
		}

		// 3. API Auth Guard
		if (path.startsWith("/api/")) {
			if (!checkAuth(request, env)) {
				return jsonResponse({ error: "Unauthorized. Enter PIN 4635." }, 401);
			}
		}

		try {
			// GET /api/properties
			if (path === "/api/properties" && method === "GET") {
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
				const propertyId = url.searchParams.get("property_id");
				let query = `
					SELECT s.*, p.name AS property_name, p.monthly_leave_allowance AS property_allowance,
						(SELECT COUNT(*) FROM staff_documents d WHERE d.staff_id = s.id) AS document_count
					FROM staff s
					JOIN properties p ON s.property_id = p.id
					WHERE s.active = 1
				`;
				if (propertyId && propertyId !== "all") {
					query += " AND s.property_id = ?";
					const { results } = await env.DB.prepare(query + " ORDER BY s.name ASC")
						.bind(propertyId)
						.all<Staff>();
					return jsonResponse(results);
				}
				const { results } = await env.DB.prepare(query + " ORDER BY s.name ASC").all<Staff>();
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
						bank_account_name, bank_name, bank_account_number, bank_ifsc, bank_upi_id, bank_qr_code
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
					body.bank_qr_code || null
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
					    bank_upi_id = ?, bank_qr_code = ?
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
				const { results: records } = await env.DB.prepare(
					"SELECT * FROM attendance WHERE date LIKE ? ORDER BY date ASC"
				).bind(`${month}-%`).all<AttendanceRecord>();

				// Calculate cumulative leaves and absences taken up to the end of this month
				const endOfMonthDate = `${month}-31`;
				const { results: cumulative } = await env.DB.prepare(`
					SELECT staff_id, COUNT(*) as count
					FROM attendance
					WHERE date <= ? AND status IN ('leave', 'absent')
					GROUP BY staff_id
				`).bind(endOfMonthDate).all<{ staff_id: string; count: number }>();

				const cumulativeMap: Record<string, number> = {};
				cumulative.forEach((c) => {
					cumulativeMap[c.staff_id] = c.count;
				});

				return jsonResponse({
					records,
					cumulative_taken: cumulativeMap,
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
				return jsonResponse({ success: true, count: statements.length });
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

			return jsonResponse({ error: "Not Found" }, 404);
		} catch (err: any) {
			console.error("API Error:", err);
			return jsonResponse({ error: err.message || "Internal server error" }, 500);
		}
	},
};
