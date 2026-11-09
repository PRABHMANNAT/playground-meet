import {test,expect} from 'vitest';import {meetingId,validMeetingId,opaqueId,digest} from '../../src/lib/ids';
test('room links have 72 random bits and do not collide in a representative batch',()=>{const ids=new Set(Array.from({length:1000},meetingId));expect(ids.size).toBe(1000);for(const id of ids)expect(validMeetingId(id)).toBe(true);});
test('malformed room identifiers cannot become query or path fragments',()=>{for(const id of ['../admin',"' OR 1=1",'aaaaaa-aaaaaa-aaaaaa/','AAAAAA-AAAAAA-AAAAAA'])expect(validMeetingId(id)).toBe(false);});
test('sessions are opaque and only one-way hashes need persistence',()=>{const value=opaqueId();expect(value.length).toBe(32);expect(digest(value)).toHaveLength(64);expect(digest(value)).not.toContain(value);});
