import { randomBytes, createHash } from 'node:crypto';
export const opaqueId = () => randomBytes(24).toString('base64url');
export const digest = (value:string) => createHash('sha256').update(value).digest('hex');
export const meetingId = () => randomBytes(9).toString('hex').match(/.{1,6}/g)!.join('-');
export const validMeetingId = (value:string) => /^[a-f0-9]{6}-[a-f0-9]{6}-[a-f0-9]{6}$/.test(value);
