import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { admin, userClient } from '../lib/supabase.js';
import { ApiError } from './errors.js';

export async function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.session_token || req.cookies?.access_token;
    if (!token) throw new ApiError(401, 'Missing token');
    const payload = jwt.verify(token, env.SUPABASE_JWT_SECRET, { audience: 'authenticated' });
    const { data: profile } = await admin.from('profiles').select('*').eq('id', payload.sub).single();
    if (!profile) throw new ApiError(401, 'Profile not found');
    req.user = profile;
    req.token = token;
    req.sb = userClient(token);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired session'));
  }
}

export const requireAdmin = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new ApiError(403, 'Admins only'));

export const bearerFromQuery = (req, _res, next) => {
  if (!req.headers.authorization && req.query.token)
    req.headers.authorization = `Bearer ${req.query.token}`;
  next();
};
