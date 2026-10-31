import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app/app.js";
import { User } from "../../src/models/user.model.js";
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../setup/database.js";
import { makeUserData } from "../fixtures/user.js";

describe("authentication API", () => {
  beforeAll(connectTestDatabase);
  afterEach(clearTestDatabase);
  afterAll(disconnectTestDatabase);

  it("registers a user and never returns the password hash", async () => {
    const user = makeUserData();
    const response = await request(app).post("/api/auth/register").send(user);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      user: { username: user.username, email: user.email },
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate registration and invalid input", async () => {
    const user = makeUserData();
    await User.create({
      username: user.username,
      email: user.email,
      passwordHash: "already-hashed",
    });

    const duplicate = await request(app)
      .post("/api/auth/register")
      .send(user);
    const invalid = await request(app).post("/api/auth/register").send({
      username: "x",
      email: "not-an-email",
      password: "short",
    });

    expect(duplicate.status).toBe(409);
    expect(invalid.status).toBe(400);
    expect(invalid.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
  });

  it("logs in, authenticates a protected route, rotates refresh tokens, and logs out", async () => {
    const user = makeUserData();
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send(user).expect(201);
    const login = await agent
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(login.body.accessToken).toEqual(expect.any(String));
    expect(login.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );

    await agent
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .expect(200);

    const refreshed = await agent.post("/api/auth/refresh").expect(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));

    await agent.post("/api/auth/logout").expect(200);
    await agent.post("/api/auth/refresh").expect(401);
  });

  it("rejects missing, malformed, and invalid access tokens", async () => {
    const missing = await request(app).get("/api/auth/me");
    const malformed = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-jwt");

    expect(missing.status).toBe(401);
    expect(malformed.status).toBe(401);
  });
});
