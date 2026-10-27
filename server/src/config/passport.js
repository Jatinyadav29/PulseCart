import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { findUserForLogin, verifyPassword } from "../services/auth.service.js";

passport.use(
  new LocalStrategy(
    { usernameField: "identifier", passwordField: "password" },
    async (identifier, password, done) => {
      try {
        const user = await findUserForLogin(identifier);
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
