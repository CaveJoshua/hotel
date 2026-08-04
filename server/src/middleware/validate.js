import { ApiError } from './errors.js';
export const validate = (schema, where = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[where]);
  if (!parsed.success)
    return next(new ApiError(422, parsed.error.issues.map((i) => i.message).join('; ')));
  req[where] = parsed.data;
  next();
};
