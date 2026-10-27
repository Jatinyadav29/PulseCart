import jwt from "jsonwebtoken";
import passport from "../config/passport.js";
import { config } from "../config/env.js";
import {
  findRefreshToken,
  issueTokens,
  registerUser,
  revokeRefreshToken,
} from "../services/auth.service.js";
import { verifyRefreshToken } from "../utils/token.js";
import logger from "../config/logger.js";

const getRefreshToken = (req) =>
  req.cookies?.[config.refreshCookieName] ?? req.body?.refreshToken;
const setRefreshCookie = (res, token) =>
  res.cookie(config.refreshCookieName, token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: config.nodeEnv === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

export const register = async (req, res, next) => {
  const { username, email, password } = req.body ?? {};

  try {
    const user = await registerUser({
      username,
      email,
      password,
    });
    logger.info("User registered", { userId: user._id.toString() });
    return res.status(201).json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    if (error?.code === 11000) {
      logger.warn("Registration rejected because the user already exists");
      return res.status(409).json({
        success: false,
        message: "Username or email is already registered",
      });
    }
    return next(error);
  }
};

export const login = (req, res, next) => {
  return passport.authenticate(
    "local",
    { session: false },
    async (error, user, info) => {
      if (error) return next(error);
      if (!user) {
        logger.warn("Login rejected because credentials were invalid");
        return res.status(401).json({
          success: false,
          message: info?.message ?? "Invalid credentials",
        });
      }

      try {
        const tokens = await issueTokens(user);
        setRefreshCookie(res, tokens.refreshToken);
        logger.info("User logged in", { userId: user._id.toString() });
        return res.json({
          success: true,
          accessToken: tokens.accessToken,
          user: user.toSafeObject(),
        });
      } catch (issueError) {
        return next(issueError);
      }
    },
  )(req, res, next);
};

export const refresh = async (req, res, next) => {
  const token = getRefreshToken(req);
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Refresh token required" });

  try {
    const payload = verifyRefreshToken(token);
    const stored = await findRefreshToken(payload.jti, token);
    if (!stored)
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });

    await revokeRefreshToken(payload.jti);
    const tokens = await issueTokens(stored.user);
    setRefreshCookie(res, tokens.refreshToken);
    return res.json({ success: true, accessToken: tokens.accessToken });
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  const token = getRefreshToken(req);
  res.clearCookie(config.refreshCookieName);
  if (!token) return res.json({ success: true, message: "Logged out" });

  try {
    const payload = verifyRefreshToken(token);
    await revokeRefreshToken(payload.jti);
  } catch (error) {
    if (
      !(
        error instanceof jwt.TokenExpiredError ||
        error instanceof jwt.JsonWebTokenError
      )
    )
      return next(error);
  }
  return res.json({ success: true, message: "Logged out" });
};

export const me = (req, res) =>
  res.json({ success: true, user: req.user.toSafeObject() });
