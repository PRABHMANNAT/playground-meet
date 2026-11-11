import { z } from 'zod';
import { maxBrowserUrl, parseBrowserUrl } from './browser-url';
export const displayName = z.string().trim().min(1).max(60);
export const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
  name: displayName.optional(),
});
export const roomInput = z.object({
  title: z.string().trim().min(1).max(100),
  lobby: z.boolean().default(true),
});
export const safeUrl = z.union([
  z.literal(''),
  z
    .url()
    .max(2000)
    .refine((v) => new URL(v).protocol === 'https:', 'Use an HTTPS product URL'),
]);
export const actionInput = z.discriminatedUnion('type', [
  z.object({ type: z.literal('chat'), text: z.string().trim().min(1).max(2000) }),
  z.object({ type: z.literal('reaction'), emoji: z.enum(['👏', '❤️', '🎉', '👍', '💡', '😂']) }),
  z.object({ type: z.literal('hand'), raised: z.boolean() }),
  z.object({
    type: z.literal('notes'),
    text: z.string().max(20000),
    version: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('poll'),
    question: z.string().trim().min(1).max(200),
    options: z.array(z.string().trim().min(1).max(100)).min(2).max(6),
  }),
  z.object({
    type: z.literal('vote'),
    pollId: z.string().max(60),
    option: z.number().int().min(0).max(5),
  }),
  z.object({ type: z.literal('close-poll'), pollId: z.string().max(60) }),
  z.object({
    type: z.literal('stroke'),
    id: z.string().uuid(),
    color: z.enum(['#FF7548', '#123B3F', '#0864B6', '#8b5cf6']),
    points: z
      .array(z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]))
      .min(2)
      .max(500),
  }),
  z.object({ type: z.literal('clear-board') }),
  z.object({ type: z.literal('timer'), seconds: z.number().int().min(0).max(3600) }),
  z.object({ type: z.literal('review'), url: safeUrl, task: z.string().max(2000) }),
  z.object({
    type: z.literal('browser'),
    url: z
      .string()
      .max(maxBrowserUrl)
      .transform((value, ctx) => {
        const url = parseBrowserUrl(value);
        if (url) return url.href;
        ctx.addIssue({ code: 'custom', message: 'Enter a public HTTPS page URL.' });
        return z.NEVER;
      })
      .nullable(),
  }),
  z.object({
    type: z.literal('marker'),
    kind: z.enum(['bug', 'idea', 'moment']),
    text: z.string().trim().min(1).max(2000),
  }),
  z.object({
    type: z.literal('rating'),
    rating: z.number().int().min(1).max(5),
    text: z.string().max(1000),
  }),
  z.object({ type: z.literal('admit'), memberId: z.string().max(80) }),
  z.object({ type: z.literal('remove'), memberId: z.string().max(80) }),
  z.object({ type: z.literal('mute'), memberId: z.string().max(80) }),
  z.object({ type: z.literal('lock'), locked: z.boolean() }),
  z.object({ type: z.literal('lobby'), enabled: z.boolean() }),
  z.object({ type: z.literal('end') }),
]);
export type Action = z.infer<typeof actionInput>;
