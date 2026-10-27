export class SessionNotAllowedError extends Error {}
export class SessionUnavailableError extends Error {}

export type AuthLike<S extends { access_token: string }> = {
  getSession: () => Promise<S | null>;
  /** Must throw if the session cannot be created. */
  signInAnonymously: () => Promise<S>;
};

export function createSessionManager<S extends { access_token: string }>(
  auth: AuthLike<S>,
  isAllowed: () => boolean,
) {
  let pending: Promise<S> | null = null;

  async function load(): Promise<S> {
    const existing = await auth.getSession();
    if (existing) return existing;
    return await auth.signInAnonymously();
  }

  return {
    async ensureSession(): Promise<S> {
      if (!isAllowed()) {
        throw new SessionNotAllowedError(
          "A session was requested before the age check",
        );
      }
      // Callers that arrive while a session is being created share that one attempt,
      // so a double tap can't create two anonymous users (and two daily allowances).
      if (!pending) {
        pending = load().finally(() => {
          pending = null;
        });
      }
      return pending;
    },
  };
}
