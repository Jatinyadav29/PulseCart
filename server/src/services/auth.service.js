import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
} from "../utils/token.js";

const refreshExpiryDate = (token) => new Date(token.exp * 1000);

export const registerUser = async ({ username, email, password }) => {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash });
  return user;
};

export const findUserForLogin = async (identifier) =>
  User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
  }).select("+passwordHash");

export const verifyPassword = (password, passwordHash) =>
  bcrypt.compare(password, passwordHash);

export const issueTokens = async (user) => {
  const accessToken = createAccessToken(user);
  const { token: refreshToken, jti } = createRefreshToken(user);
  const decoded = JSON.parse(
    Buffer.from(refreshToken.split(".")[1], "base64url").toString("utf8"),
  );

  await RefreshToken.create({
    jti,
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiryDate(decoded),
  });

  return { accessToken, refreshToken };
};

export const findRefreshToken = async (jti, token) => {
  const stored = await RefreshToken.findOne({ jti }).populate("user");
  if (
    !stored ||
    stored.expiresAt <= new Date() ||
    stored.tokenHash !== hashToken(token)
  ) {
    return null;
  }
  return stored;
};

export const revokeRefreshToken = (jti) => RefreshToken.deleteOne({ jti });
