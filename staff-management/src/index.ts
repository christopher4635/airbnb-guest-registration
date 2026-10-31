import { getDashboardHtml } from "./ui";
import type { Env, Property, Staff, AttendanceRecord } from "./types";

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
					SELECT s.*, p.name AS property_name, p.monthly_leave_allowance AS property_allowance
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
					INSERT INTO staff (id, property_id, name, role, phone, active, custom_leave_allowance)
					VALUES (?, ?, ?, ?, ?, 1, ?)
				`).bind(
					id,
					body.property_id,
					body.name,
					body.role || null,
					body.phone || null,
					body.custom_leave_allowance !== undefined ? body.custom_leave_allowance : null
				).run();
				return jsonResponse({ success: true, id });
			}

			// PUT /api/staff/:id
			if (path.startsWith("/api/staff/") && method === "PUT") {
				const id = path.split("/")[3];
				const body = (await request.json()) as any;
				await env.DB.prepare(`
					UPDATE staff
					SET property_id = ?, name = ?, role = ?, phone = ?, custom_leave_allowance = ?
					WHERE id = ?
				`).bind(
					body.property_id,
					body.name,
					body.role || null,
					body.phone || null,
					body.custom_leave_allowance !== undefined ? body.custom_leave_allowance : null,
					id
				).run();
				return jsonResponse({ success: true });
			}

			// DELETE /api/staff/:id (soft delete)
			if (path.startsWith("/api/staff/") && method === "DELETE") {
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
				const { results } = await env.DB.prepare(
					"SELECT * FROM attendance WHERE date LIKE ? ORDER BY date ASC"
				).bind(`${month}-%`).all<AttendanceRecord>();
				return jsonResponse(results);
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

			return jsonResponse({ error: "Not Found" }, 404);
		} catch (err: any) {
			console.error("API Error:", err);
			return jsonResponse({ error: err.message || "Internal server error" }, 500);
		}
	},
};
