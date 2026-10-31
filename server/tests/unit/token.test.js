import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/token.js";

const user = { _id: "507f1f77bcf86cd799439011", username: "tester" };

describe("token utilities", () => {
  it("creates and verifies an access token with the user subject", () => {
    const token = createAccessToken(user);
    const payload = verifyAccessToken(token);

    expect(payload).toMatchObject({ sub: user._id, username: user.username });
  });

  it("creates a refresh token with a unique token identifier", () => {
    const first = createRefreshToken(user);
    const second = createRefreshToken(user);

    expect(first.jti).not.toBe(second.jti);
    expect(verifyRefreshToken(first.token)).toMatchObject({
      sub: user._id,
      jti: first.jti,
    });
  });

  it("hashes the same token deterministically without exposing the token", () => {
    const token = createRefreshToken(user).token;

    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({ sub: user._id }, "wrong-secret");

    expect(() => verifyAccessToken(token)).toThrow();
  });
});
