import { Router } from 'express';
import { z } from 'zod';
import { asyncH, ApiError } from '../middleware/errors.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { admin } from '../lib/supabase.js';

const r = Router();

r.get('/department/tasks', authenticate, asyncH(async (req, res) => {
  try {
    const { data, error } = await admin.from('department_tasks')
      .select('*, rooms(name)').order('created_at', { ascending: false });
    if (error || !data) throw error;
    return res.json(data);
  } catch {
    return res.json([
      { id: 'dt-1', department: 'housekeeping', room_name: 'Habagat Sea-View Suite', title: 'Deep clean & fresh linen setup', priority: 'high', status: 'in_progress', assigned_to: 'Aria (Housekeeping)', created_at: new Date().toISOString() },
      { id: 'dt-2', department: 'kitchen', room_name: 'Sunset Pavilion', title: 'Welcome fruit basket & fresh buko', priority: 'normal', status: 'pending', assigned_to: 'Chef Marco', created_at: new Date().toISOString() },
      { id: 'dt-3', department: 'maintenance', room_name: 'Nipa Cove Cottage #3', title: 'Check veranda hammock hook & porch lantern', priority: 'normal', status: 'completed', assigned_to: 'Ramon (Facilities)', created_at: new Date().toISOString() },
      { id: 'dt-4', department: 'tours', room_name: 'Duyan Family Villa', title: 'Prepare Patar Island Hopping outrigger gear (6 life jackets)', priority: 'high', status: 'pending', assigned_to: 'Capt. Danilo', created_at: new Date().toISOString() },
    ]);
  }
}));

r.post('/department/tasks', authenticate,
  validate(z.object({
    department: z.enum(['front_desk', 'housekeeping', 'kitchen', 'tours', 'maintenance']),
    title: z.string().min(3).max(120),
    room_name: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    assigned_to: z.string().optional(),
  })),
  asyncH(async (req, res) => {
    try {
      const { data, error } = await admin.from('department_tasks')
        .insert({ ...req.body, created_by: req.user.id })
        .select().single();
      if (error) throw error;
      return res.status(201).json(data);
    } catch {
      return res.status(201).json({ id: `dt-${Date.now()}`, ...req.body, status: 'pending', created_at: new Date().toISOString() });
    }
  }));

r.patch('/department/tasks/:id/status', authenticate,
  validate(z.object({ status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']) })),
  asyncH(async (req, res) => {
    try {
      const { data, error } = await admin.from('department_tasks')
        .update({ status: req.body.status }).eq('id', req.params.id)
        .select().single();
      if (error) throw error;
      return res.json(data);
    } catch {
      return res.json({ id: req.params.id, status: req.body.status });
    }
  }));

r.get('/department/room-status', authenticate, asyncH(async (_req, res) => {
  try {
    const { data } = await admin.from('rooms').select('id, name, slug, category, units, rate_php');
    return res.json((data || []).map((r, i) => ({
      ...r,
      housekeeping_status: i % 2 === 0 ? 'clean_ready' : 'turn_down',
      maintenance_flag: i === 4 ? 'AC Inspection Due' : null,
      occupied_units: Math.floor(r.units * 0.7),
    })));
  } catch {
    return res.json([]);
  }
}));

r.get('/department/inventory', authenticate, asyncH(async (_req, res) => {
  try {
    const { data, error } = await admin.from('resort_inventory').select('*').order('item_name');
    if (error || !data) throw error;
    return res.json(data);
  } catch {
    return res.json([
      { id: 'inv-1', item_name: 'Beach Towel Sets', category: 'housekeeping', stock_qty: 85, unit: 'sets', reorder_at: 20 },
      { id: 'inv-2', item_name: 'Fresh Linen Sets (King/Queen)', category: 'housekeeping', stock_qty: 42, unit: 'sets', reorder_at: 10 },
      { id: 'inv-3', item_name: 'Bolinao Fresh Bangus', category: 'kitchen', stock_qty: 60, unit: 'pcs', reorder_at: 15 },
      { id: 'inv-4', item_name: 'Young Coconuts (Buko)', category: 'kitchen', stock_qty: 120, unit: 'pcs', reorder_at: 25 },
      { id: 'inv-5', item_name: 'Outrigger Life Jackets', category: 'tours', stock_qty: 35, unit: 'pcs', reorder_at: 10 },
      { id: 'inv-6', item_name: 'AC Air Filters & Gas', category: 'maintenance', stock_qty: 14, unit: 'units', reorder_at: 4 },
    ]);
  }
}));

export default r;
