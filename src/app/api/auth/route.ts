import { api, body, sameOrigin } from '@/lib/http';
import { credentials } from '@/lib/schemas';
import { hashPassword, verifyPassword } from '@/lib/password';
import { createSession, revokeSession, currentPerson } from '@/lib/session';
import { query } from '@/lib/db';
import { opaqueId, digest } from '@/lib/ids';
import { limit } from '@/lib/rate-limit';
import { invariant } from '@/lib/errors';
export const POST = (req: Request) =>
  api(async () => {
    sameOrigin(req);
    const raw = await body(req);
    const input = credentials.parse(raw);
    await limit('auth:' + digest(input.email), 10);
    await limit('auth-global', 200);
    const [user] = await query<{ id: string; name: string; password: string }>(
      'SELECT id,name,password FROM people WHERE email=$1',
      [input.email],
    );
    if (raw.mode === 'register') {
      invariant(!user, 409, 'Unable to create this account. Try signing in.');
      invariant(input.name, 400, 'Enter your name.');
      const previous = await currentPerson();
      const id = previous && !previous.account ? previous.id : opaqueId();
      const hash = await hashPassword(input.password);
      if (previous && !previous.account) {
        await query('UPDATE people SET email=$1,password=$2,name=$3,account=TRUE WHERE id=$4', [
          input.email,
          hash,
          input.name,
          id,
        ]);
      } else {
        await query('INSERT INTO people(id,name,email,password,account) VALUES($1,$2,$3,$4,TRUE)', [
          id,
          input.name,
          input.email,
          hash,
        ]);
      }
      await revokeSession();
      await createSession(id);
      return { person: { id, name: input.name, account: true } };
    }
    invariant(
      user && (await verifyPassword(input.password, user.password || '')),
      401,
      'Email or password is incorrect.',
    );
    await revokeSession();
    await createSession(user.id);
    return { person: { id: user.id, name: user.name, account: true } };
  });
