import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { User } from "../../src/models/user.model.js";

export const makeUserData = (overrides = {}) => {
  const suffix = crypto.randomUUID().slice(0, 8);
  return {
    username: `tester_${suffix}`,
    email: `tester_${suffix}@example.com`,
    password: "TestPassword123!",
    ...overrides,
  };
};

export const createUser = async (overrides = {}) => {
  const data = makeUserData(overrides);
  const passwordHash = await bcrypt.hash(data.password, 4);
  const user = await User.create({
    username: data.username,
    email: data.email,
    passwordHash,
  });
  return { data, user };
};
