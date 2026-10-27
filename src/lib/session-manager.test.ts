import { describe, expect, it } from "vitest";

import {
    createSessionManager,
    SessionNotAllowedError,
    type AuthLike,
} from "./session-manager";

type FakeSession = { access_token: string };

function fakeAuth(initial: FakeSession | null, failFirstSignIn = false) {
  let stored = initial;
  let signIns = 0;
  const api: AuthLike<FakeSession> = {
    getSession: async () => {
      await Promise.resolve();
      return stored;
    },
    signInAnonymously: async () => {
      signIns += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (failFirstSignIn && signIns === 1) throw new Error("network");
      stored = { access_token: `token-${signIns}` };
      return stored;
    },
  };
  return { api, signIns: () => signIns };
}

describe("session manager", () => {
  it("refuses to start a session before the age check", async () => {
    const auth = fakeAuth(null);
    const manager = createSessionManager(auth.api, () => false);
    await expect(manager.ensureSession()).rejects.toBeInstanceOf(
      SessionNotAllowedError,
    );
    expect(auth.signIns()).toBe(0);
  });

  it("reuses an existing session", async () => {
    const auth = fakeAuth({ access_token: "existing" });
    const manager = createSessionManager(auth.api, () => true);
    expect((await manager.ensureSession()).access_token).toBe("existing");
    expect(auth.signIns()).toBe(0);
  });

  it("creates a session when there is none", async () => {
    const auth = fakeAuth(null);
    const manager = createSessionManager(auth.api, () => true);
    expect((await manager.ensureSession()).access_token).toBe("token-1");
    expect(auth.signIns()).toBe(1);
  });

  it("creates only one anonymous user when two calls arrive together", async () => {
    const auth = fakeAuth(null);
    const manager = createSessionManager(auth.api, () => true);
    const [a, b] = await Promise.all([
      manager.ensureSession(),
      manager.ensureSession(),
    ]);
    expect(a).toBe(b);
    expect(auth.signIns()).toBe(1);
  });

  it("tries again after a failure instead of remembering it", async () => {
    const auth = fakeAuth(null, true);
    const manager = createSessionManager(auth.api, () => true);
    await expect(manager.ensureSession()).rejects.toThrow("network");
    expect((await manager.ensureSession()).access_token).toBe("token-2");
    expect(auth.signIns()).toBe(2);
  });
});
