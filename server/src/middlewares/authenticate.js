import { verifyAccessToken } from "../utils/token.js";
import { User } from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  const header = req.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access token required" });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    req.user = user;
    return next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired access token" });
  }
};
