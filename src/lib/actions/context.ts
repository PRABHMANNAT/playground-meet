import type { DB } from '../db';
import type { Meeting, Person } from '../types';
import type { Action } from '../schemas';
export type Context = { db: DB; room: Meeting; person: Person };
export type Handler = (ctx: Context, action: Action) => Promise<void>;
