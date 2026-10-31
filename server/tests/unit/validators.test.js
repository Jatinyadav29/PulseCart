import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
} from "../../src/validators/auth.validator.js";
import {
  cartCreateSchema,
  cartItemUpdateSchema,
} from "../../src/validators/cart.validator.js";
import { productQuerySchema } from "../../src/validators/product.validator.js";

describe("request validators", () => {
  it("normalizes registration email and rejects short passwords", () => {
    const result = registerSchema.safeParse({
      username: "tester",
      email: "TESTER@EXAMPLE.COM",
      password: "short",
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["password"]);

    expect(
      registerSchema.parse({
        username: "tester",
        email: "TESTER@EXAMPLE.COM",
        password: "long-enough-password",
      }).email,
    ).toBe("tester@example.com");
  });

  it("accepts login email and transforms it to identifier", () => {
    expect(
      loginSchema.parse({
        email: " TESTER@EXAMPLE.COM ",
        password: "long-enough-password",
      }),
    ).toEqual({
      identifier: "TESTER@EXAMPLE.COM",
      password: "long-enough-password",
    });
  });

  it("coerces product query defaults and rejects an invalid sort field", () => {
    expect(productQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(productQuerySchema.safeParse({ sortBy: "name" }).success).toBe(
      false,
    );
  });

  it("requires positive integer cart quantities and valid product IDs", () => {
    expect(
      cartCreateSchema.safeParse({
        items: [{ product: "not-an-id", quantity: 1 }],
      }).success,
    ).toBe(false);
    expect(cartItemUpdateSchema.safeParse({ quantity: 0 }).success).toBe(false);
  });
});
