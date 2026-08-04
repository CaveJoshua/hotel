import { Router } from 'express';
import { z } from 'zod';
import { asyncH, ApiError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';
import { admin } from '../lib/supabase.js';

const r = Router();

r.get('/rooms', asyncH(async (req, res) => {
  let q = admin.from('rooms').select('*').eq('is_active', true)
    .order('rating_avg', { ascending: false });
  if (req.query.category) q = q.ilike('category', req.query.category);
  if (req.query.q) q = q.or(`name.ilike.%${req.query.q}%,description.ilike.%${req.query.q}%`);
  const { data, error } = await q;
  if (error) throw new ApiError(500, error.message);
  return res.json(data || []);
}));

r.get('/rooms/:slug', asyncH(async (req, res) => {
  const { data, error } = await admin.from('rooms').select('*')
    .eq('slug', req.params.slug).single();
  if (error || !data) throw new ApiError(404, 'Room not found');
  return res.json(data);
}));

const rangeSchema = z.object({
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.coerce.number().int().min(1).max(12).default(1),
});

r.get('/availability', validate(rangeSchema, 'query'), asyncH(async (req, res) => {
  const { check_in, check_out, guests } = req.query;
  if (check_out <= check_in) throw new ApiError(422, 'Check-out must be after check-in');
  const { data, error } = await admin.rpc('available_rooms',
    { p_check_in: check_in, p_check_out: check_out, p_guests: guests });
  if (error) throw new ApiError(500, error.message);
  return res.json(data || []);
}));

export default r;
