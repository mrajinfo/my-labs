import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { isDatabaseReady } from '../config/db.js';
import { HttpError } from '../lib/httpError.js';

/** Data routes answer 503 straight away while MongoDB is unavailable. */
export function requireDatabase(req, res, next) {
  if (isDatabaseReady()) return next();
  next(new HttpError(503, "Can't reach the database. Check that MongoDB is running, then try again."));
}

export function apiNotFound(req, res, next) {
  next(new HttpError(404, `There is no API route for ${req.method} ${req.originalUrl}`));
}

function fieldErrorsFromZod(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path[0] ?? 'body';
    fields[key] ??= issue.message;
  }
  return fields;
}

function fieldErrorsFromMongoose(error) {
  return Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value.message]));
}

const DATABASE_ERRORS = new Set([
  'MongoServerSelectionError',
  'MongooseServerSelectionError',
  'MongoNetworkError',
  'MongoNotConnectedError',
]);

// Express recognises error handlers by their four parameters.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = 500;
  let body = { message: 'Something went wrong on the server. Please try again.' };

  if (err instanceof HttpError) {
    status = err.status;
    body = { message: err.message, ...(err.fieldErrors && { fieldErrors: err.fieldErrors }) };
  } else if (err instanceof ZodError) {
    status = 400;
    body = { message: 'Please fix the highlighted fields', fieldErrors: fieldErrorsFromZod(err) };
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    body = { message: 'Please fix the highlighted fields', fieldErrors: fieldErrorsFromMongoose(err) };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 404;
    body = { message: 'Member not found' };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    body = { message: 'The request body must be valid JSON' };
  } else if (err.type === 'entity.too.large') {
    status = 413;
    body = { message: 'The request body is too large' };
  } else if (DATABASE_ERRORS.has(err.name) || !isDatabaseReady()) {
    status = 503;
    body = { message: "Can't reach the database. Check that MongoDB is running, then try again." };
  }

  if (status >= 500) console.error(err);
  if (res.headersSent) return;
  res.status(status).json(body);
}
