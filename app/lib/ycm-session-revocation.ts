import type { YcmSession } from './ycm-access-control';

/** Production boundary for server-side session revocation.
 * Keep revocation state outside the signed cookie so logout and emergency
 * account suspension can invalidate an otherwise unexpired token.
 */
export interface YcmSessionRevocationStore {
  revoke(sessionId: string, expiresAt: number, reason: string): Promise<void>;
  isRevoked(sessionId: string): Promise<boolean>;
}

export async function assertSessionNotRevoked(store: YcmSessionRevocationStore, session: YcmSession) {
  if (await store.isRevoked(session.sessionId)) {
    throw new Error('YCM_SESSION_REVOKED');
  }
}
