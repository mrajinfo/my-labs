import mongoose from 'mongoose';
import { todayDayNumber } from '@umer/shared';
import { env } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';
import { describeDay, serializeMember } from '../lib/serializeMember.js';
import { Member } from '../models/Member.js';
import { parseMemberInput } from '../validation/member.js';

const MAX_RESULTS = 1000;

const byDaysUntilBirthday = (calendar) => (a, b) =>
  (a.age[calendar]?.birthday?.daysUntil ?? Infinity) -
    (b.age[calendar]?.birthday?.daysUntil ?? Infinity) || a.name.localeCompare(b.name);

const SORTS = {
  recent: () => (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  name: () => (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  oldest: () => (a, b) => a.dob.ad.localeCompare(b.dob.ad),
  youngest: () => (a, b) => b.dob.ad.localeCompare(a.dob.ad),
  birthday: byDaysUntilBirthday,
};

const today = () => todayDayNumber(env.timeZone);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function assertObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Member not found');
}

/** GET /api/members?q=&sort=recent|name|oldest|youngest|birthday&calendar=BS|AD */
export async function listMembers(req, res) {
  const todayDay = today();
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
  const filter = q
    ? {
        $or: [
          { name: { $regex: escapeRegex(q), $options: 'i' } },
          { relation: { $regex: escapeRegex(q), $options: 'i' } },
        ],
      }
    : {};

  const docs = await Member.find(filter).sort({ createdAt: -1 }).limit(MAX_RESULTS).lean();
  const members = docs.map((doc) => serializeMember(doc, todayDay));

  const sortKey = Object.hasOwn(SORTS, req.query.sort) ? req.query.sort : 'recent';
  const calendar = req.query.calendar === 'AD' ? 'ad' : 'bs';
  members.sort(SORTS[sortKey](calendar));

  res.json({ asOf: describeDay(todayDay, env.timeZone), count: members.length, members });
}

/** GET /api/members/:id */
export async function getMember(req, res) {
  assertObjectId(req.params.id);
  const doc = await Member.findById(req.params.id).lean();
  if (!doc) throw new HttpError(404, 'Member not found');
  const todayDay = today();
  res.json({ asOf: describeDay(todayDay, env.timeZone), member: serializeMember(doc, todayDay) });
}

/** POST /api/members  { name, relation?, calendar: "BS" | "AD", dob: "YYYY-MM-DD" } */
export async function createMember(req, res) {
  const todayDay = today();
  const doc = await Member.create(parseMemberInput(req.body, todayDay));
  res
    .status(201)
    .location(`/api/members/${doc.id}`)
    .json({ asOf: describeDay(todayDay, env.timeZone), member: serializeMember(doc, todayDay) });
}

/** PUT /api/members/:id  — same body as POST */
export async function updateMember(req, res) {
  assertObjectId(req.params.id);
  const todayDay = today();
  const doc = await Member.findByIdAndUpdate(req.params.id, parseMemberInput(req.body, todayDay), {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
  if (!doc) throw new HttpError(404, 'Member not found');
  res.json({ asOf: describeDay(todayDay, env.timeZone), member: serializeMember(doc, todayDay) });
}

/** DELETE /api/members/:id */
export async function deleteMember(req, res) {
  assertObjectId(req.params.id);
  const doc = await Member.findByIdAndDelete(req.params.id).lean();
  if (!doc) throw new HttpError(404, 'Member not found');
  res.status(204).end();
}
