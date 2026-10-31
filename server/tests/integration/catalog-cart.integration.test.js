import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app/app.js";
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from "../setup/database.js";
import { makeProductData } from "../fixtures/product.js";
import { makeUserData } from "../fixtures/user.js";

const registerAndLogin = async () => {
  const user = makeUserData();
  const registration = await request(app)
    .post("/api/auth/register")
    .send(user)
    .expect(201);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ identifier: user.username, password: user.password })
    .expect(200);

  return { user: registration.body.user, accessToken: login.body.accessToken };
};

describe("catalog and cart APIs", () => {
  beforeAll(connectTestDatabase);
  afterEach(clearTestDatabase);
  afterAll(disconnectTestDatabase);

  it("serves health checks and lists products with query defaults", async () => {
    await request(app)
      .get("/health")
      .expect(200, { success: true, message: "OK" });

    const response = await request(app).get("/api/products").expect(200);
    expect(response.body).toMatchObject({
      success: true,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      data: [],
    });
  });

  it("protects product writes and handles duplicate SKUs", async () => {
    const unauthorized = await request(app)
      .post("/api/products")
      .send(makeProductData());
    const { accessToken } = await registerAndLogin();
    const product = makeProductData();

    const created = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(product)
      .expect(201);
    const duplicate = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(product);

    expect(unauthorized.status).toBe(401);
    expect(created.body.data).toMatchObject({
      name: product.name,
      availability: "low_stock",
      discountedPrice: 90,
    });
    expect(duplicate.status).toBe(409);
  });

  it("returns not-found for invalid product IDs and supports cart operations", async () => {
    const { accessToken } = await registerAndLogin();
    const created = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(makeProductData({ stockQuantity: 5, availability: "low_stock" }))
      .expect(201);

    await request(app).get("/api/products/not-an-id").expect(404);

    const cart = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ items: [{ product: created.body.data._id, quantity: 2 }] })
      .expect(200);
    expect(cart.body.data.items).toHaveLength(1);
    expect(cart.body.data.items[0].quantity).toBe(2);

    const insufficient = await request(app)
      .patch(`/api/cart/items/${created.body.data._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ quantity: 6 });
    expect(insufficient.status).toBe(409);
  });
});
