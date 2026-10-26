/**
 * API tests. They need a MongoDB server; set MONGODB_URI_TEST to point at a
 * throwaway database. When none is reachable the tests are skipped.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import mongoose from 'mongoose';
import request from 'supertest';
import { calculateAge, parseIsoDate, toDayNumber, todayDayNumber } from '@umer/shared';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { Member } from '../src/models/Member.js';

const uri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/nepali_age_calculator_test';
const app = createApp({ logRequests: false });
let connected = false;

before(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    await Member.deleteMany({});
    connected = true;
  } catch {
    connected = false;
  }
});

after(async () => {
  if (connected) await Member.deleteMany({});
  await mongoose.disconnect();
});

const needsDb = (t) => {
  if (!connected) t.skip(`MongoDB not reachable at ${uri}`);
  return connected;
};

describe('members API', () => {
  let aamaId;

  it('reports health and today in both calendars', async (t) => {
    if (!needsDb(t)) return;
    const res = await request(app).get('/api/health').expect(200);
    assert.equal(res.body.database, 'connected');
    assert.match(res.body.today.bs, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('saves a BS birth date and returns both calendars with a live age', async (t) => {
    if (!needsDb(t)) return;
    const res = await request(app)
      .post('/api/members')
      .send({ name: '  Aama ', relation: 'Mother', calendar: 'BS', dob: '2032-08-17' })
      .expect(201);
    const { member } = res.body;
    aamaId = member.id;
    assert.equal(member.name, 'Aama');
    assert.deepEqual(member.dob, { bs: '2032-08-17', ad: '1975-12-03' });
    assert.equal(member.enteredIn, 'BS');

    const today = todayDayNumber(env.timeZone);
    const expected = calculateAge(toDayNumber(parseIsoDate('2032-08-17'), 'BS'), today, 'BS');
    assert.deepEqual(
      [member.age.bs.years, member.age.bs.months, member.age.bs.days],
      [expected.years, expected.months, expected.days],
    );
    assert.equal(member.age.totalDays, expected.totalDays);
  });

  it('saves an AD birth date', async (t) => {
    if (!needsDb(t)) return;
    const res = await request(app)
      .post('/api/members')
      .send({ name: 'Ravi', relation: 'Son', calendar: 'AD', dob: '2019-02-28' })
      .expect(201);
    assert.deepEqual(res.body.member.dob, { ad: '2019-02-28', bs: '2075-11-16' });
  });

  it('reports every invalid field at once', async (t) => {
    if (!needsDb(t)) return;
    const res = await request(app)
      .post('/api/members')
      .send({ name: '', relation: 'Pet', calendar: 'BS', dob: '2080-06-32' })
      .expect(400);
    assert.deepEqual(Object.keys(res.body.fieldErrors).sort(), ['dob', 'name', 'relation']);
  });

  it('rejects future and unsupported dates', async (t) => {
    if (!needsDb(t)) return;
    const future = await request(app)
      .post('/api/members')
      .send({ name: 'Later', calendar: 'AD', dob: '2040-01-01' })
      .expect(400);
    assert.match(future.body.fieldErrors.dob, /future/);
    const early = await request(app)
      .post('/api/members')
      .send({ name: 'Early', calendar: 'BS', dob: '1970-01-01' })
      .expect(400);
    assert.match(early.body.fieldErrors.dob, /aren't supported/);
  });

  it('lists members sorted by the next birthday', async (t) => {
    if (!needsDb(t)) return;
    const res = await request(app).get('/api/members?sort=birthday').expect(200);
    assert.equal(res.body.count, 2);
    const days = res.body.members.map((m) => m.age.bs.birthday.daysUntil);
    assert.deepEqual(days, [...days].sort((a, b) => a - b));
  });

  it('updates a member', async (t) => {
    if (!needsDb(t)) return;
    const res = await request(app)
      .put(`/api/members/${aamaId}`)
      .send({ name: 'Aama', relation: 'Mother', calendar: 'AD', dob: '1975-12-02' })
      .expect(200);
    assert.deepEqual(res.body.member.dob, { ad: '1975-12-02', bs: '2032-08-16' });
    assert.equal(res.body.member.enteredIn, 'AD');
  });

  it('deletes a member', async (t) => {
    if (!needsDb(t)) return;
    await request(app).delete(`/api/members/${aamaId}`).expect(204);
    await request(app).get(`/api/members/${aamaId}`).expect(404);
    await request(app).delete('/api/members/not-an-id').expect(404);
  });

  it('answers unknown API routes with JSON', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    assert.match(res.body.message, /no API route/);
  });
});
