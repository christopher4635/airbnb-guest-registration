import type { Env, Property, Room, RoomBooking } from "./types";

export interface AiAuthContext {
	role?: "admin" | "manager";
	manager?: {
		id: string;
		name: string;
		property_id: string;
		property_name?: string;
	};
}

export interface BookingChatDraft {
	property_id?: string | null;
	room_id?: string | null;
	room_number?: string | null;
	guest_name?: string | null;
	guest_names?: string[];
	guest_count?: number | null;
	check_in_date?: string | null;
	check_out_date?: string | null;
	nights?: number | null;
	payment_mode?: "online" | "cash" | null;
	amount?: number | null;
	notes?: string | null;
	confirm_overlap?: boolean;
}

export interface CreateRoomBookingInput {
	property_id: string;
	room_id: string;
	payment_mode?: "online" | "cash";
	guest_name?: string | null;
	guest_count?: number | null;
	guests_json?: string | null;
	guest_id_image?: string | null;
	notes?: string | null;
	date?: string;
	check_in_date?: string;
	check_out_date?: string;
	is_range?: boolean;
	include_checkout_day?: boolean;
	amount?: number;
	rate_per_day?: number;
	platform?: string;
}

export interface CreateRoomBookingResult {
	success: boolean;
	isMultiDay: boolean;
	nights: number;
	group_booking_id: string | null;
	total_stay_amount: number;
	booking?: RoomBooking;
	bookings: RoomBooking[];
}

export type CreateRoomBookingFn = (input: CreateRoomBookingInput) => Promise<CreateRoomBookingResult>;

interface ChatHistoryMessage {
	role: "user" | "assistant";
	content: string;
}

interface ParsedAiJson {
	intent?: "create_booking" | "check_availability" | "cancel" | "chat";
	customer_name?: string | null;
	guest_names?: string[] | null;
	room_number?: string | null;
	property_name?: string | null;
	guest_count?: number | null;
	check_in_date?: string | null;
	check_out_date?: string | null;
	nights?: number | null;
	payment_mode?: "online" | "cash" | null;
	amount?: number | null;
	notes?: string | null;
	confirm_overlap?: boolean | null;
	assistant_reply?: string | null;
}

function getIstTodayIso(): string {
	// Default operational timezone: Asia/Kolkata (UTC+5:30)
	const nowIst = new Date(Date.now() + 330 * 60 * 1000);
	return nowIst.toISOString().split("T")[0];
}

function addDaysIso(isoDate: string, days: number): string {
	const d = new Date(`${isoDate}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().split("T")[0];
}

function normalizeRoomToken(value: string): string {
	return value
		.toLowerCase()
		.replace(/\b(room|rm|no\.?|number|#)\b/gi, "")
		.replace(/[^a-z0-9]+/g, "")
		.trim();
}

function isCancelMessage(text: string): boolean {
	return /^(cancel|reset|clear|start over|stop|nevermind|never mind)$/i.test(text.trim());
}

function isConfirmMessage(text: string): boolean {
	return /^(confirm|yes|yep|yeah|ok|okay|proceed|book anyway|force|go ahead|do it)\b/i.test(text.trim());
}

function isAvailabilityQuery(text: string): boolean {
	const lower = text.toLowerCase().trim();
	const asksAvailability = /\b(?:available|vacant|free|empty|occupancy|list\s+rooms|which\s+rooms?|what\s+rooms?|show\s+rooms?|room\s+status)\b/i.test(lower);
	const hasCustomerField = /(customer\s*name|guest\s*name|number\s*of\s*person)/i.test(lower);
	const hasBookingVerb = /\b(?:book|reserve|check[\s-]*in)\b/i.test(lower);
	return asksAvailability && !hasCustomerField && !hasBookingVerb;
}

/**
 * Deterministic extractor handles structured forms like:
 *   Customer Name: Rahul Sharma
 *   Room No. 102
 *   Number of person: 2
 * as well as natural inline variants and short follow-up replies.
 */
function parseDeterministicBooking(
	text: string,
	todayIso: string,
	rooms: Array<Room & { property_name?: string }>,
	pendingDraft?: BookingChatDraft | null
): Partial<BookingChatDraft> {
	const result: Partial<BookingChatDraft> = {};
	const trimmed = text.trim();
	const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

	// 1. Key-value line extraction (works across newlines, commas, or inline labels)
	const normalizedForKv = trimmed
		.replace(/,\s*(?=(?:customer\s*name|guest\s*name|name|room\s*no\.?|room\s*number|room|number\s*of\s*persons?|no\.?\s*of\s*persons?|persons?|guests?|pax|check[\s-]*in|check[\s-]*out|date|nights?|amount|price|rate|payment(?:\s*mode)?|notes?)\b)/gi, "\n")
		.replace(/\s+(?=(?:customer\s*name|guest\s*name|room\s*no\.?|room\s*number|number\s*of\s*persons?|no\.?\s*of\s*persons?|check[\s-]*in(?:\s*date)?|check[\s-]*out(?:\s*date)?|payment\s*mode|payment\s*method)\b)/gi, "\n");
	const kvLines = normalizedForKv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

	for (const line of kvLines) {
		let m: RegExpMatchArray | null;

		if ((m = line.match(/^(?:customer\s*name|guest\s*name|guests?\s*names?|customer|guest|name)\s*[:=\-]\s*(.+)$/i))) {
			const val = m[1].trim();
			if (val && !/^(?:n\/a|none|-)$/i.test(val)) {
				result.guest_name = val;
				const splitNames = val.split(/\s*(?:,|&|\band\b)\s*/i).map((s) => s.trim()).filter(Boolean);
				if (splitNames.length > 0) result.guest_names = splitNames;
			}
			continue;
		}

		if ((m = line.match(/^(?:room\s*no\.?|room\s*number|rm\s*no\.?|room)\s*[:=\-.]?\s*(.+)$/i))) {
			const val = m[1].trim();
			if (val) result.room_number = val;
			continue;
		}

		if ((m = line.match(/^(?:number\s*of\s*persons?|no\.?\s*of\s*persons?|persons?|guests?|pax|people|headcount)\s*[:=\-.]?\s*(\d+)/i))) {
			const n = parseInt(m[1], 10);
			if (Number.isFinite(n) && n > 0 && n <= 30) result.guest_count = n;
			continue;
		}

		if ((m = line.match(/^(?:check[\s-]*in(?:\s*date)?|date)\s*[:=\-]\s*(.+)$/i))) {
			const rawDate = m[1].trim().toLowerCase();
			if (rawDate === "today") result.check_in_date = todayIso;
			else if (rawDate === "tomorrow") result.check_in_date = addDaysIso(todayIso, 1);
			else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) result.check_in_date = rawDate;
			continue;
		}

		if ((m = line.match(/^(?:check[\s-]*out(?:\s*date)?)\s*[:=\-]\s*(\d{4}-\d{2}-\d{2})$/i))) {
			result.check_out_date = m[1];
			continue;
		}

		if ((m = line.match(/^(?:nights?|days?)\s*[:=\-]\s*(\d+)/i))) {
			const n = parseInt(m[1], 10);
			if (Number.isFinite(n) && n > 0 && n <= 90) result.nights = n;
			continue;
		}

		if ((m = line.match(/^(?:amount|price|rate|tariff|total)\s*[:=\-]\s*[₹rs.\s]*(\d+(?:\.\d+)?)/i))) {
			const amt = Math.round(Number(m[1]));
			if (Number.isFinite(amt) && amt >= 0) result.amount = amt;
			continue;
		}

		if ((m = line.match(/^(?:payment(?:\s*mode|\s*method)?|mode)\s*[:=\-]\s*(.+)$/i))) {
			const mode = m[1].trim().toLowerCase();
			if (/cash/.test(mode)) result.payment_mode = "cash";
			else if (/online|upi|gpay|paytm|card|bank|ota/.test(mode)) result.payment_mode = "online";
			continue;
		}

		if ((m = line.match(/^(?:notes?|remarks?)\s*[:=\-]\s*(.+)$/i))) {
			result.notes = m[1].trim();
			continue;
		}
	}

	// 2. Inline pattern fallbacks when fields aren't strictly Key: Value lines
	if (!result.room_number) {
		const inlineRoom = trimmed.match(/\b(?:room\s*no\.?|rm\s*no\.?|room|rm)\s*[#:\-.]?\s*([a-z0-9][a-z0-9\s-]{0,16}?)(?=\s*(?:,|\n|for\b|with\b|number\b|persons?\b|guests?\b|pax\b|cash\b|online\b|$))/i);
		if (inlineRoom?.[1]) {
			result.room_number = inlineRoom[1].trim();
		} else {
			// Check direct room match (e.g. "Studio Room 1", "101", "1 BHK")
			for (const r of rooms) {
				const escaped = r.room_number.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				if (new RegExp(`(?:^|\\s|#)${escaped}(?:\\s|,|$)`, "i").test(trimmed)) {
					result.room_number = r.room_number;
					break;
				}
			}
		}
	}

	if (!result.guest_count) {
		const inlineCount = trimmed.match(/\b(\d{1,2})\s*(?:persons?|people|guests?|pax|adults?|members?)\b/i);
		if (inlineCount?.[1]) {
			const n = parseInt(inlineCount[1], 10);
			if (n > 0 && n <= 30) result.guest_count = n;
		}
	}

	if (!result.payment_mode) {
		if (/\bcash\b/i.test(trimmed)) result.payment_mode = "cash";
		else if (/\b(?:online|upi|gpay|phonepe|paytm|card)\b/i.test(trimmed)) result.payment_mode = "online";
	}

	if (!result.check_in_date) {
		if (/\btomorrow\b/i.test(trimmed)) result.check_in_date = addDaysIso(todayIso, 1);
		else if (/\btoday\b/i.test(trimmed)) result.check_in_date = todayIso;
		else {
			const isoMatch = trimmed.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
			if (isoMatch) result.check_in_date = isoMatch[1];
		}
	}

	if (!result.nights) {
		const nightsMatch = trimmed.match(/\b(\d{1,2})\s*nights?\b/i);
		if (nightsMatch?.[1]) result.nights = parseInt(nightsMatch[1], 10);
	}

	if (result.amount === undefined) {
		const amtMatch = trimmed.match(/(?:₹|rs\.?\s*)(\d{3,6})\b/i);
		if (amtMatch?.[1]) result.amount = parseInt(amtMatch[1], 10);
	}

	if (!result.guest_name) {
		const forGuestMatch = trimmed.match(/\bfor\s+([A-Za-z][A-Za-z\s.&,-]{1,60}?)(?=\s*(?:\bwith\b|\bfor\s+\d+|\broom\b|\bnumber\s+of\b|\bpersons?\b|\bpeople\b|\bguests?\b|\bpax\b|\bby\b|\bon\b|\btoday\b|\btomorrow\b|\bcash\b|\bonline\b|\bupi\b|\d{4}-\d{2}-\d{2}|$))/i);
		if (forGuestMatch?.[1]) {
			const candidateName = forGuestMatch[1].trim();
			if (
				candidateName &&
				!/^(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an|the|today|tomorrow|cash|online|upi)(?:\s*(?:persons?|people|guests?|pax|nights?|days?))?$/i.test(candidateName)
			) {
				result.guest_name = candidateName;
				const splitNames = candidateName.split(/\s*(?:,|&|\band\b)\s*/i).map((s) => s.trim()).filter(Boolean);
				if (splitNames.length > 0) result.guest_names = splitNames;
			}
		}
	}

	// 3. Conversational short-answer handling if pendingDraft is missing exactly one item
	if (pendingDraft) {
		if (isConfirmMessage(trimmed)) {
			result.confirm_overlap = true;
		}

		// Bare number reply when room or guest_count was missing
		if (/^\d{1,4}$/.test(trimmed)) {
			const exactRoom = rooms.find((r) => normalizeRoomToken(r.room_number) === normalizeRoomToken(trimmed));
			if (!pendingDraft.room_number && exactRoom) {
				result.room_number = exactRoom.room_number;
			} else if (!pendingDraft.guest_count && parseInt(trimmed, 10) >= 1 && parseInt(trimmed, 10) <= 30) {
				result.guest_count = parseInt(trimmed, 10);
			} else if (!pendingDraft.room_number) {
				result.room_number = trimmed;
			}
		} else if (
			lines.length === 1 &&
			!result.guest_name &&
			!pendingDraft.guest_name &&
			!result.room_number &&
			!result.guest_count &&
			!isConfirmMessage(trimmed) &&
			!/^(?:cash|online|today|tomorrow|\d+)$/i.test(trimmed) &&
			trimmed.length >= 2 &&
			trimmed.length <= 80 &&
			!/\b(?:book|available|vacant|status|help|hi|hello)\b/i.test(trimmed)
		) {
			result.guest_name = trimmed;
		}
	}

	return result;
}

function extractFirstJsonObject(raw: string): ParsedAiJson | null {
	if (!raw) return null;
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start) return null;
	try {
		return JSON.parse(raw.slice(start, end + 1)) as ParsedAiJson;
	} catch {
		return null;
	}
}

async function parseWithWorkersAI(
	env: Env,
	userMessage: string,
	history: ChatHistoryMessage[],
	roomsContext: Array<{ property_name: string; room_number: string; room_type: string; base_price: number; occupied_today: boolean }>,
	todayIso: string,
	pendingDraft?: BookingChatDraft | null
): Promise<ParsedAiJson | null> {
	if (!env.AI || typeof env.AI.run !== "function") {
		return null;
	}

	const tomorrowIso = addDaysIso(todayIso, 1);
	const systemPrompt = [
		"You are the booking intake assistant for a hotel/property staff portal.",
		`Today's date is ${todayIso} and tomorrow is ${tomorrowIso}.`,
		`Available rooms config: ${JSON.stringify(roomsContext)}.`,
		pendingDraft ? `Current partial booking draft: ${JSON.stringify(pendingDraft)}.` : "No existing draft.",
		"Extract booking details from the staff member's message into ONE valid JSON object with NO markdown or extra prose.",
		"Schema:",
		"{",
		'  "intent": "create_booking" | "check_availability" | "cancel" | "chat",',
		'  "customer_name": string | null,',
		'  "guest_names": string[] | null,',
		'  "room_number": string | null,',
		'  "property_name": string | null,',
		'  "guest_count": number | null,',
		'  "check_in_date": "YYYY-MM-DD" | null,',
		'  "check_out_date": "YYYY-MM-DD" | null,',
		'  "nights": number | null,',
		'  "payment_mode": "online" | "cash" | null,',
		'  "amount": number | null,',
		'  "notes": string | null,',
		'  "confirm_overlap": boolean,',
		'  "assistant_reply": string | null',
		"}",
		"Rules:",
		"- If the user asks about room availability or says hello/help, set intent accordingly and give a helpful concise assistant_reply.",
		"- If the user provides customer name, room number, or number of persons (or answers a clarification), set intent='create_booking'.",
		"- Keep room_number matching one of the configured rooms when obvious.",
		"- guest_count is the integer number of persons staying (e.g., '2 pax', 'Number of person: 3').",
		"- Return JSON only."
	].join("\n");

	const recentHistory = history.slice(-4).map((m) => ({
		role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
		content: String(m.content || "").slice(0, 500),
	}));

	try {
		const response: any = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
			messages: [
				{ role: "system", content: systemPrompt },
				...recentHistory,
				{ role: "user", content: userMessage.slice(0, 1000) },
			],
			temperature: 0.1,
			max_tokens: 350,
		});

		const textOutput =
			typeof response === "string"
				? response
				: typeof response?.response === "string"
					? response.response
					: typeof response?.result?.response === "string"
						? response.result.response
						: "";

		return extractFirstJsonObject(textOutput);
	} catch (err) {
		console.error("Workers AI booking parse fallback:", err);
		return null;
	}
}

function resolveMatchingRooms(
	roomQuery: string,
	rooms: Array<Room & { property_name?: string }>
): Array<Room & { property_name?: string }> {
	const clean = roomQuery.trim().toLowerCase();
	const token = normalizeRoomToken(roomQuery);

	// 1. Exact room_number match (case-insensitive)
	const exact = rooms.filter((r) => r.room_number.trim().toLowerCase() === clean);
	if (exact.length > 0) return exact;

	// 2. Normalized alphanumeric room_number match (e.g., "Room 101" -> "101", "studio 1" -> "studio1")
	if (token) {
		const tokenExact = rooms.filter((r) => normalizeRoomToken(r.room_number) === token);
		if (tokenExact.length > 0) return tokenExact;
	}

	// 3. Match by room_type (e.g. "Ripple", "Luna")
	const typeMatches = rooms.filter((r) => (r.room_type || "").trim().toLowerCase() === clean);
	if (typeMatches.length > 0) return typeMatches;

	// 4. Partial normalized match (e.g. "studio 1" inside "Studio Room 1")
	if (token && token.length >= 2) {
		const partial = rooms.filter((r) => normalizeRoomToken(r.room_number).includes(token));
		if (partial.length > 0) return partial;
	}

	return [];
}

function buildStayDateList(checkInDate: string, checkOutDate?: string | null, nights?: number | null): { dates: string[]; actualCheckOut: string; isRange: boolean } {
	if (checkOutDate && /^\d{4}-\d{2}-\d{2}$/.test(checkOutDate) && checkOutDate > checkInDate) {
		const dates: string[] = [];
		const cur = new Date(`${checkInDate}T00:00:00Z`);
		const end = new Date(`${checkOutDate}T00:00:00Z`);
		while (cur < end && dates.length < 90) {
			dates.push(cur.toISOString().split("T")[0]);
			cur.setUTCDate(cur.getUTCDate() + 1);
		}
		if (dates.length === 0) dates.push(checkInDate);
		return { dates, actualCheckOut: checkOutDate, isRange: dates.length > 1 };
	}

	if (nights && nights > 1) {
		const capped = Math.min(90, Math.max(1, Math.round(nights)));
		const dates: string[] = [];
		for (let i = 0; i < capped; i++) {
			dates.push(addDaysIso(checkInDate, i));
		}
		return { dates, actualCheckOut: addDaysIso(checkInDate, capped), isRange: capped > 1 };
	}

	return { dates: [checkInDate], actualCheckOut: checkInDate, isRange: false };
}

export async function handleAiBookingChat(
	env: Env,
	auth: AiAuthContext,
	body: {
		message?: string;
		messages?: ChatHistoryMessage[];
		pendingDraft?: BookingChatDraft | null;
		property_id?: string;
		default_date?: string;
	},
	createBookingFn: CreateRoomBookingFn
) {
	const rawMessage = (body.message || "").trim();
	if (!rawMessage) {
		return { statusCode: 400, payload: { error: "Please type booking details to continue." } };
	}

	const todayIso = body.default_date && /^\d{4}-\d{2}-\d{2}$/.test(body.default_date)
		? body.default_date
		: getIstTodayIso();

	// Resolve eligible properties and rooms respecting role restrictions
	let scopedPropertyId = body.property_id?.trim() || "";
	if (auth.role === "manager") {
		if (!auth.manager?.property_id) {
			return { statusCode: 403, payload: { error: "Manager has no assigned property." } };
		}
		scopedPropertyId = auth.manager.property_id;
	}

	let propQuery = `
		SELECT * FROM properties
		WHERE (active IS NULL OR active = 1) AND has_lodging = 1
	`;
	const propParams: any[] = [];
	if (scopedPropertyId && scopedPropertyId !== "all") {
		propQuery += " AND id = ?";
		propParams.push(scopedPropertyId);
	}
	const { results: propResults } = await env.DB.prepare(propQuery).bind(...propParams).all<Property>();
	const activeProps = propResults || [];

	if (activeProps.length === 0) {
		return {
			statusCode: 200,
			payload: {
				status: "error",
				reply: "No active lodging properties are currently configured for room bookings.",
				pendingDraft: null,
			},
		};
	}

	const propIds = activeProps.map((p) => p.id);
	const placeholders = propIds.map(() => "?").join(",");
	const { results: roomResults } = await env.DB.prepare(`
		SELECT r.*, p.name AS property_name
		FROM rooms r
		JOIN properties p ON r.property_id = p.id
		WHERE (r.active IS NULL OR r.active = 1) AND r.property_id IN (${placeholders})
		ORDER BY p.name ASC, CAST(r.room_number AS INTEGER) ASC, r.room_number ASC
	`).bind(...propIds).all<Room & { property_name?: string }>();
	const eligibleRooms = roomResults || [];

	if (eligibleRooms.length === 0) {
		return {
			statusCode: 200,
			payload: {
				status: "error",
				reply: "No active rooms are configured yet. Please add rooms under Lodging Settings first.",
				pendingDraft: null,
			},
		};
	}

	if (isCancelMessage(rawMessage)) {
		return {
			statusCode: 200,
			payload: {
				status: "cancelled",
				reply: "Booking draft cleared. Send details whenever you're ready:\nCustomer Name:\nRoom No.\nNumber of person",
				pendingDraft: null,
			},
		};
	}

	// Fetch today's bookings for availability context
	const { results: todayBookedRows } = await env.DB.prepare(`
		SELECT room_id, guest_name, guest_count, payment_mode, amount
		FROM room_bookings
		WHERE date = ? AND property_id IN (${placeholders})
	`).bind(todayIso, ...propIds).all<{ room_id: string; guest_name: string | null; guest_count: number | null; payment_mode: string; amount: number }>();

	const todayBookedSet = new Set((todayBookedRows || []).map((b) => b.room_id));
	const roomsContext = eligibleRooms.map((r) => ({
		property_name: r.property_name || r.property_id,
		room_number: r.room_number,
		room_type: r.room_type || "Standard",
		base_price: r.base_price || 0,
		occupied_today: todayBookedSet.has(r.id),
	}));

	const prevDraft: BookingChatDraft = body.pendingDraft ? { ...body.pendingDraft } : {};
	const deterministic = parseDeterministicBooking(rawMessage, todayIso, eligibleRooms, body.pendingDraft);

	// Skip LLM round-trip if deterministic structured parser already captured everything needed or it's an obvious cancel/confirm
	const hasAllDeterministicCore =
		!!(deterministic.guest_name || prevDraft.guest_name) &&
		!!(deterministic.room_number || prevDraft.room_number) &&
		!!(deterministic.guest_count || prevDraft.guest_count);

	let aiParsed: ParsedAiJson | null = null;
	if (!hasAllDeterministicCore && !isConfirmMessage(rawMessage)) {
		aiParsed = await parseWithWorkersAI(
			env,
			rawMessage,
			Array.isArray(body.messages) ? body.messages : [],
			roomsContext,
			todayIso,
			body.pendingDraft
		);
	}

	// Handle pure conversational / availability inquiries
	if (isAvailabilityQuery(rawMessage) || aiParsed?.intent === "check_availability") {
		const checkDate = deterministic.check_in_date || aiParsed?.check_in_date || todayIso;
		const { results: dateBooked } = await env.DB.prepare(`
			SELECT room_id, guest_name FROM room_bookings
			WHERE date = ? AND property_id IN (${placeholders})
		`).bind(checkDate, ...propIds).all<{ room_id: string; guest_name: string | null }>();
		const bookedByRoom = new Map<string, string[]>();
		for (const row of dateBooked || []) {
			const list = bookedByRoom.get(row.room_id) || [];
			list.push(row.guest_name || "Guest");
			bookedByRoom.set(row.room_id, list);
		}
		const lines = eligibleRooms.map((r) => {
			const guests = bookedByRoom.get(r.id);
			const prefix = activeProps.length > 1 ? `[${r.property_name}] ` : "";
			return guests && guests.length > 0
				? `• ${prefix}Room ${r.room_number} (${r.room_type || "Standard"}, ₹${r.base_price || 0}) — Booked (${guests.join(", ")})`
				: `• ${prefix}Room ${r.room_number} (${r.room_type || "Standard"}, ₹${r.base_price || 0}) — Available`;
		});
		return {
			statusCode: 200,
			payload: {
				status: "info",
				reply: `Room availability for ${checkDate}:\n${lines.join("\n")}\n\nTo book, type Customer Name, Room No., and Number of person.`,
				pendingDraft: Object.keys(prevDraft).length > 0 ? prevDraft : null,
			},
		};
	}

	if (aiParsed?.intent === "chat" && !deterministic.guest_name && !deterministic.room_number && !deterministic.guest_count && !body.pendingDraft) {
		return {
			statusCode: 200,
			payload: {
				status: "info",
				reply:
					aiParsed.assistant_reply ||
					`Hi! Type booking details like:\nCustomer Name: Rahul Sharma\nRoom No. ${eligibleRooms[0]?.room_number || "101"}\nNumber of person: 2`,
				pendingDraft: null,
			},
		};
	}

	// Merge draft: previous draft -> Workers AI extraction -> explicit deterministic extraction (highest priority)
	const merged: BookingChatDraft = {
		...prevDraft,
		...(aiParsed?.property_name
			? {
				property_id:
					activeProps.find((p) => p.name.toLowerCase().includes(aiParsed!.property_name!.toLowerCase()))?.id ||
					prevDraft.property_id,
			}
			: {}),
		...(aiParsed?.customer_name ? { guest_name: aiParsed.customer_name.trim() } : {}),
		...(Array.isArray(aiParsed?.guest_names) && aiParsed!.guest_names!.length > 0
			? { guest_names: aiParsed!.guest_names!.map((s) => String(s).trim()).filter(Boolean) }
			: {}),
		...(aiParsed?.room_number ? { room_number: String(aiParsed.room_number).trim() } : {}),
		...(aiParsed?.guest_count && aiParsed.guest_count > 0 ? { guest_count: Math.round(aiParsed.guest_count) } : {}),
		...(aiParsed?.check_in_date && /^\d{4}-\d{2}-\d{2}$/.test(aiParsed.check_in_date)
			? { check_in_date: aiParsed.check_in_date }
			: {}),
		...(aiParsed?.check_out_date && /^\d{4}-\d{2}-\d{2}$/.test(aiParsed.check_out_date)
			? { check_out_date: aiParsed.check_out_date }
			: {}),
		...(aiParsed?.nights && aiParsed.nights > 0 ? { nights: Math.round(aiParsed.nights) } : {}),
		...(aiParsed?.payment_mode === "cash" || aiParsed?.payment_mode === "online"
			? { payment_mode: aiParsed.payment_mode }
			: {}),
		...(aiParsed?.amount !== null && aiParsed?.amount !== undefined && aiParsed.amount >= 0
			? { amount: Math.round(Number(aiParsed.amount)) }
			: {}),
		...(aiParsed?.notes ? { notes: aiParsed.notes.trim() } : {}),
		...(aiParsed?.confirm_overlap ? { confirm_overlap: true } : {}),
		...deterministic,
	};

	if (!merged.guest_name && merged.guest_names && merged.guest_names.length > 0) {
		merged.guest_name = merged.guest_names.join(", ");
	}
	if ((!merged.guest_names || merged.guest_names.length === 0) && merged.guest_name) {
		merged.guest_names = merged.guest_name.split(/\s*(?:,|&|\band\b)\s*/i).map((s) => s.trim()).filter(Boolean);
	}

	// Resolve Room No. against configured active rooms
	let resolvedRoom: (Room & { property_name?: string }) | null = null;
	if (merged.room_number) {
		const propertyScopedRooms = merged.property_id
			? eligibleRooms.filter((r) => r.property_id === merged.property_id)
			: eligibleRooms;
		const candidates = resolveMatchingRooms(merged.room_number, propertyScopedRooms);

		if (candidates.length === 1) {
			resolvedRoom = candidates[0];
			merged.room_id = resolvedRoom.id;
			merged.room_number = resolvedRoom.room_number;
			merged.property_id = resolvedRoom.property_id;
		} else if (candidates.length > 1) {
			const options = candidates.map((r) => `${r.property_name} — Room ${r.room_number}`).join(", ");
			return {
				statusCode: 200,
				payload: {
					status: "needs_info",
					reply: `Multiple rooms match "${merged.room_number}": ${options}. Please specify which property/room.`,
					pendingDraft: merged,
				},
			};
		} else {
			const roomList = eligibleRooms.map((r) => `${r.room_number} (${r.room_type || "Standard"})`).join(", ");
			merged.room_number = null;
			merged.room_id = null;
			return {
				statusCode: 200,
				payload: {
					status: "needs_info",
					reply: `I couldn't find Room "${deterministic.room_number || aiParsed?.room_number || ""}". Available rooms here: ${roomList}. Which Room No. should I book?`,
					pendingDraft: merged,
				},
			};
		}
	}

	// Check missing required fields (Customer Name, Room No., Number of person)
	const missing: string[] = [];
	if (!merged.guest_name) missing.push("Customer Name");
	if (!resolvedRoom) missing.push("Room No.");
	if (!merged.guest_count || merged.guest_count < 1) missing.push("Number of person");

	if (missing.length > 0) {
		const captured: string[] = [];
		if (merged.guest_name) captured.push(`Customer: ${merged.guest_name}`);
		if (resolvedRoom) captured.push(`Room: ${resolvedRoom.room_number}`);
		if (merged.guest_count) captured.push(`Persons: ${merged.guest_count}`);

		const roomHint = !resolvedRoom
			? ` (Rooms: ${eligibleRooms.map((r) => r.room_number).join(", ")})`
			: "";

		return {
			statusCode: 200,
			payload: {
				status: "needs_info",
				reply: `${captured.length > 0 ? `Noted ${captured.join(" · ")}.\n` : ""}Please provide: ${missing.join(", ")}${roomHint}.`,
				pendingDraft: merged,
			},
		};
	}

	// At this point we have Customer Name, resolvedRoom, and Number of person!
	const checkInDate = merged.check_in_date || todayIso;
	const stayInfo = buildStayDateList(checkInDate, merged.check_out_date, merged.nights);
	const room = resolvedRoom!;
	const guestCount = Math.max(1, Math.round(merged.guest_count!));
	const paymentMode: "online" | "cash" = merged.payment_mode === "cash" ? "cash" : "online";
	const defaultTotalAmount = Math.max(0, Math.round((room.base_price || 0) * stayInfo.dates.length));
	const totalAmount = merged.amount !== null && merged.amount !== undefined ? Math.max(0, Math.round(merged.amount)) : defaultTotalAmount;

	// Conflict check on target date(s) unless user explicitly confirmed overlap
	if (!merged.confirm_overlap) {
		const datePlaceholders = stayInfo.dates.map(() => "?").join(",");
		const { results: existingOnDates } = await env.DB.prepare(`
			SELECT date, guest_name, slot_number
			FROM room_bookings
			WHERE room_id = ? AND date IN (${datePlaceholders})
			ORDER BY date ASC, slot_number ASC
		`).bind(room.id, ...stayInfo.dates).all<{ date: string; guest_name: string | null; slot_number: number | null }>();

		if (existingOnDates && existingOnDates.length > 0) {
			const conflictDesc = existingOnDates
				.slice(0, 3)
				.map((b) => `${b.date} (${b.guest_name || "Guest"})`)
				.join(", ");
			const vacantToday = eligibleRooms
				.filter((r) => !todayBookedSet.has(r.id) && r.id !== room.id)
				.map((r) => r.room_number);
			const altHint = vacantToday.length > 0 ? `\nVacant rooms today: ${vacantToday.join(", ")}.` : "";

			return {
				statusCode: 200,
				payload: {
					status: "needs_confirmation",
					reply: `Room ${room.room_number} already has a booking on ${conflictDesc}.${altHint}\nReply "confirm" to add another booking slot for ${merged.guest_name} (${guestCount} person${guestCount > 1 ? "s" : ""}), or enter a different Room No.`,
					pendingDraft: merged,
				},
			};
		}
	}

	const namesList =
		merged.guest_names && merged.guest_names.length > 0
			? merged.guest_names
			: [merged.guest_name!];

	const created = await createBookingFn({
		property_id: room.property_id,
		room_id: room.id,
		payment_mode: paymentMode,
		guest_name: merged.guest_name!,
		guest_count: guestCount,
		guests_json: JSON.stringify(namesList),
		notes: merged.notes || null,
		date: checkInDate,
		check_in_date: checkInDate,
		check_out_date: stayInfo.actualCheckOut,
		is_range: stayInfo.isRange,
		amount: totalAmount,
		platform: "Direct (AI Chat)",
	});

	const mainBooking = created.booking;
	const staySummary = created.isMultiDay
		? `${checkInDate} → ${stayInfo.actualCheckOut} (${created.nights} nights)`
		: checkInDate;

	return {
		statusCode: 200,
		payload: {
			status: "created",
			usedAi: Boolean(aiParsed),
			booking: mainBooking,
			bookings: created.bookings,
			pendingDraft: null,
			reply:
				`Room ${room.room_number} booked successfully!\n` +
				`• Customer: ${merged.guest_name}\n` +
				`• Room: ${room.room_number} (${room.room_type || "Standard"})\n` +
				`• Persons: ${guestCount}\n` +
				`• Date: ${staySummary}\n` +
				`• Tariff: ₹${totalAmount.toLocaleString("en-IN")} (${paymentMode.toUpperCase()})`,
		},
	};
}
