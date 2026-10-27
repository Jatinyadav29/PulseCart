import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export const createAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), username: user.username },
    config.accessTokenSecret,
    {
      expiresIn: config.accessTokenExpiry,
    },
  );

export const createRefreshToken = (user) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user._id.toString(), jti },
    config.refreshTokenSecret,
    {
      expiresIn: config.refreshTokenExpiry,
    },
  );
  return { token, jti };
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.accessTokenSecret);
export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.refreshTokenSecret);

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
