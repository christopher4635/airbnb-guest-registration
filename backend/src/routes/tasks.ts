import { Hono } from 'hono';
import { Bindings } from '../types';

const tasksRoute = new Hono<{ Bindings: Bindings }>();

const VALID_CATEGORIES = new Set(['buy', 'todo', 'maintenance', 'idea', 'alert']);
const VALID_PRIORITIES = new Set(['urgent', 'normal', 'low']);

async function ensureTasksTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS property_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'todo',
      property TEXT NOT NULL DEFAULT 'All Units',
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending',
      estimated_cost REAL DEFAULT 0,
      due_date TEXT,
      notes TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}

function mapTaskRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    category: row.category || 'todo',
    property: row.property || 'All Units',
    priority: row.priority || 'normal',
    status: row.status || 'pending',
    estimatedCost: Number(row.estimated_cost) || 0,
    dueDate: row.due_date || '',
    notes: row.notes || '',
    completedAt: row.completed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// 1. GET /api/tasks - List all tasks/checklist items
tasksRoute.get('/', async (c) => {
  try {
    await ensureTasksTable(c.env.DB);
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM property_tasks
      ORDER BY
        CASE WHEN status = 'done' THEN 1 ELSE 0 END ASC,
        CASE priority WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END ASC,
        CASE WHEN due_date IS NOT NULL AND trim(due_date) != '' THEN 0 ELSE 1 END ASC,
        due_date ASC,
        created_at DESC
    `).all();

    return c.json({
      success: true,
      data: (results || []).map(mapTaskRow)
    });
  } catch (err: any) {
    console.error('Error fetching property tasks:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. POST /api/tasks - Create new task / shopping item / maintenance / idea
tasksRoute.post('/', async (c) => {
  try {
    await ensureTasksTable(c.env.DB);
    const body = await c.req.json();
    const title = String(body.title || '').trim();
    if (!title) {
      return c.json({ success: false, error: 'Task title is required.' }, 400);
    }

    const rawCat = String(body.category || 'todo').toLowerCase().trim();
    const category = VALID_CATEGORIES.has(rawCat) ? rawCat : 'todo';
    const rawPri = String(body.priority || 'normal').toLowerCase().trim();
    const priority = VALID_PRIORITIES.has(rawPri) ? rawPri : 'normal';
    const property = String(body.property || 'All Units').trim() || 'All Units';
    const estimatedCost = Math.max(0, Number(body.estimatedCost ?? body.estimated_cost ?? 0) || 0);
    const dueDate = String(body.dueDate ?? body.due_date ?? '').trim() || null;
    const notes = String(body.notes || '').trim();
    const status = body.status === 'done' ? 'done' : 'pending';
    const id = `tsk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    await c.env.DB.prepare(`
      INSERT INTO property_tasks (
        id, title, category, property, priority, status,
        estimated_cost, due_date, notes, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      title,
      category,
      property,
      priority,
      status,
      estimatedCost,
      dueDate,
      notes,
      status === 'done' ? new Date().toISOString() : null
    ).run();

    const created = await c.env.DB.prepare(`SELECT * FROM property_tasks WHERE id = ?`).bind(id).first();
    return c.json({ success: true, data: mapTaskRow(created) }, 201);
  } catch (err: any) {
    console.error('Error creating task:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. PUT /api/tasks/:id - Update task details
tasksRoute.put('/:id', async (c) => {
  try {
    await ensureTasksTable(c.env.DB);
    const id = c.req.param('id');
    const existing: any = await c.env.DB.prepare(`SELECT * FROM property_tasks WHERE id = ?`).bind(id).first();
    if (!existing) {
      return c.json({ success: false, error: 'Task not found.' }, 404);
    }

    const body = await c.req.json();
    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    if (!title) {
      return c.json({ success: false, error: 'Task title cannot be empty.' }, 400);
    }

    const rawCat = body.category !== undefined ? String(body.category).toLowerCase().trim() : existing.category;
    const category = VALID_CATEGORIES.has(rawCat) ? rawCat : existing.category;
    const rawPri = body.priority !== undefined ? String(body.priority).toLowerCase().trim() : existing.priority;
    const priority = VALID_PRIORITIES.has(rawPri) ? rawPri : existing.priority;
    const property = body.property !== undefined ? (String(body.property).trim() || 'All Units') : existing.property;
    const estimatedCost = body.estimatedCost !== undefined
      ? Math.max(0, Number(body.estimatedCost) || 0)
      : Number(existing.estimated_cost) || 0;
    const dueDate = body.dueDate !== undefined ? (String(body.dueDate).trim() || null) : existing.due_date;
    const notes = body.notes !== undefined ? String(body.notes).trim() : existing.notes;
    const status = body.status !== undefined ? (body.status === 'done' ? 'done' : 'pending') : existing.status;
    const completedAt = status === 'done'
      ? (existing.completed_at || new Date().toISOString())
      : null;

    await c.env.DB.prepare(`
      UPDATE property_tasks SET
        title = ?, category = ?, property = ?, priority = ?, status = ?,
        estimated_cost = ?, due_date = ?, notes = ?, completed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      title, category, property, priority, status,
      estimatedCost, dueDate, notes, completedAt, id
    ).run();

    const updated = await c.env.DB.prepare(`SELECT * FROM property_tasks WHERE id = ?`).bind(id).first();
    return c.json({ success: true, data: mapTaskRow(updated) });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. PUT /api/tasks/:id/toggle - Toggle pending <-> done
tasksRoute.put('/:id/toggle', async (c) => {
  try {
    await ensureTasksTable(c.env.DB);
    const id = c.req.param('id');
    const existing: any = await c.env.DB.prepare(`SELECT * FROM property_tasks WHERE id = ?`).bind(id).first();
    if (!existing) {
      return c.json({ success: false, error: 'Task not found.' }, 404);
    }

    const nextStatus = existing.status === 'done' ? 'pending' : 'done';
    const completedAt = nextStatus === 'done' ? new Date().toISOString() : null;

    await c.env.DB.prepare(`
      UPDATE property_tasks SET
        status = ?, completed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(nextStatus, completedAt, id).run();

    const updated = await c.env.DB.prepare(`SELECT * FROM property_tasks WHERE id = ?`).bind(id).first();
    return c.json({ success: true, data: mapTaskRow(updated) });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 5. DELETE /api/tasks/:id - Delete task
tasksRoute.delete('/:id', async (c) => {
  try {
    await ensureTasksTable(c.env.DB);
    const id = c.req.param('id');
    await c.env.DB.prepare(`DELETE FROM property_tasks WHERE id = ?`).bind(id).run();
    return c.json({ success: true, message: `Task ${id} deleted.` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default tasksRoute;
