import mongoose from 'mongoose';
import { NAME_MAX_LENGTH, RELATIONS } from '@umer/shared';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A family member. The birth date is stored as plain "YYYY-MM-DD" strings in
 * both calendars — never as a timestamp — so it can't drift across time zones.
 * Ages are not stored: they are derived from the birth date on every read,
 * which is what keeps them correct day after day.
 */
const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: NAME_MAX_LENGTH },
    relation: { type: String, enum: [...RELATIONS, ''], default: '' },
    dobAd: { type: String, required: true, match: ISO_DATE },
    dobBs: { type: String, required: true, match: ISO_DATE },
    enteredIn: { type: String, enum: ['BS', 'AD'], required: true },
  },
  { timestamps: true, versionKey: false },
);

memberSchema.index({ createdAt: -1 });

export const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);
