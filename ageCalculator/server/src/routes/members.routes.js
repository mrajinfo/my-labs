import { Router } from 'express';
import {
  createMember,
  deleteMember,
  getMember,
  listMembers,
  updateMember,
} from '../controllers/members.controller.js';

// Express 5 forwards rejected promises to the error handler, so no try/catch here.
export const membersRouter = Router();

membersRouter.get('/', listMembers);
membersRouter.post('/', createMember);
membersRouter.get('/:id', getMember);
membersRouter.put('/:id', updateMember);
membersRouter.delete('/:id', deleteMember);
