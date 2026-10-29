import { Hono } from 'hono';
import { Bindings } from '../types';

const expensesRoute = new Hono<{ Bindings: Bindings }>();

// Helper to ensure expenses table exists
async function ensureExpensesTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      property TEXT DEFAULT 'All Units',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `).run();
}

// 1. GET /api/expenses - List expenses with optional month / property filter
expensesRoute.get('/', async (c) => {
  try {
    await ensureExpensesTable(c.env.DB);
    const month = c.req.query('month'); // e.g. '2026-10'
    const property = c.req.query('property'); // e.g. '1 BHK'

    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params: any[] = [];

    if (month) {
      query += ` AND strftime('%Y-%m', date) = ?`;
      params.push(month);
    }
    if (property && property !== 'ALL' && property !== 'All Units') {
      query += ` AND (property = ? OR property = 'All Units')`;
      params.push(property);
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const stmt = c.env.DB.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    const expenses = results || [];

    const total = expenses.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

    return c.json({
      success: true,
      data: expenses,
      totalExpenses: total,
      count: expenses.length
    });
  } catch (err: any) {
    console.error('Error fetching expenses:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. GET /api/expenses/summary - Month-wise Financial Overview (Revenue vs Expenses vs Profit)
expensesRoute.get('/summary', async (c) => {
  try {
    await ensureExpensesTable(c.env.DB);
    const month = c.req.query('month') || new Date().toISOString().slice(0, 7); // Default YYYY-MM

    // 1. Fetch all non-cancelled bookings for this month
    // A booking belongs to this month if its check_in or check_out overlaps with the month
    const { results: bookingRows } = await c.env.DB.prepare(`
      SELECT id, property, guest_name, payout, check_in_date, check_out_date, platform, notes
      FROM bookings
      WHERE status != 'Cancelled'
        AND (strftime('%Y-%m', check_in_date) = ? OR strftime('%Y-%m', check_out_date) = ?)
    `).bind(month, month).all();

    let totalRevenue = 0;
    const revenueByProperty: Record<string, number> = {};

    (bookingRows || []).forEach((b: any) => {
      let amount = 0;
      if (b.payout) {
        // Parse numbers out of payout string e.g. '₹2,500' -> 2500
        const num = parseFloat(String(b.payout).replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) amount = num;
      }
      if (amount === 0 && b.notes) {
        // Fallback: check if notes contain 'Rate: 2500' or similar
        const match = String(b.notes).match(/Rate:\s*₹?\s*([0-9,.]+)/i);
        if (match) {
          const num = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(num)) amount = num;
        }
      }

      totalRevenue += amount;
      const prop = b.property || 'General';
      revenueByProperty[prop] = (revenueByProperty[prop] || 0) + amount;
    });

    // 2. Fetch expenses for this month
    const { results: expenseRows } = await c.env.DB.prepare(`
      SELECT * FROM expenses WHERE strftime('%Y-%m', date) = ? ORDER BY date ASC
    `).bind(month).all();

    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};
    const expensesByProperty: Record<string, number> = {};

    (expenseRows || []).forEach((e: any) => {
      const amt = Number(e.amount) || 0;
      totalExpenses += amt;

      const cat = e.category || 'Other';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;

      const prop = e.property || 'All Units';
      expensesByProperty[prop] = (expensesByProperty[prop] || 0) + amt;
    });

    const netProfit = totalRevenue - totalExpenses;

    return c.json({
      success: true,
      month,
      financials: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
        bookingsCount: (bookingRows || []).length,
        expensesCount: (expenseRows || []).length
      },
      breakdowns: {
        revenueByProperty,
        expensesByCategory,
        expensesByProperty
      },
      expenses: expenseRows || []
    });
  } catch (err: any) {
    console.error('Error calculating financial summary:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. POST /api/expenses - Add an expense
expensesRoute.post('/', async (c) => {
  try {
    await ensureExpensesTable(c.env.DB);
    const body = await c.req.json();
    const title = (body.title || '').trim();
    const amount = parseFloat(body.amount);
    const category = body.category || 'Other';
    const date = body.date || new Date().toISOString().slice(0, 10);
    const property = body.property || 'All Units';
    const notes = (body.notes || '').trim();

    if (!title) {
      return c.json({ success: false, error: 'Expense title / description is required.' }, 400);
    }
    if (isNaN(amount) || amount <= 0) {
      return c.json({ success: false, error: 'Valid expense amount is required.' }, 400);
    }

    const id = body.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO expenses (id, title, amount, category, date, property, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, title, amount, category, date, property, notes, now, now).run();

    const created = await c.env.DB.prepare(`SELECT * FROM expenses WHERE id = ?`).bind(id).first();
    return c.json({ success: true, message: 'Expense recorded successfully.', data: created }, 201);
  } catch (err: any) {
    console.error('Error creating expense:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. PUT /api/expenses/:id - Update an expense
expensesRoute.put('/:id', async (c) => {
  try {
    await ensureExpensesTable(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await c.env.DB.prepare(`SELECT * FROM expenses WHERE id = ?`).bind(id).first();
    if (!existing) {
      return c.json({ success: false, error: 'Expense not found.' }, 404);
    }

    const title = body.title !== undefined ? body.title.trim() : existing.title;
    const amount = body.amount !== undefined ? parseFloat(body.amount) : existing.amount;
    const category = body.category !== undefined ? body.category : existing.category;
    const date = body.date !== undefined ? body.date : existing.date;
    const property = body.property !== undefined ? body.property : existing.property;
    const notes = body.notes !== undefined ? body.notes.trim() : existing.notes;
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE expenses SET
        title = ?, amount = ?, category = ?, date = ?, property = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(title, amount, category, date, property, notes, now, id).run();

    const updated = await c.env.DB.prepare(`SELECT * FROM expenses WHERE id = ?`).bind(id).first();
    return c.json({ success: true, message: 'Expense updated.', data: updated });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 5. DELETE /api/expenses/:id - Delete an expense
expensesRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare(`DELETE FROM expenses WHERE id = ?`).bind(id).run();
    return c.json({ success: true, message: 'Expense deleted.' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default expensesRoute;
