import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

export function setupGoogleAuth() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth not configured: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return false;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const firstName = profile.name?.givenName || "";
          const lastName = profile.name?.familyName || "";
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          const existingUser = await storage.getUserByGoogleId(googleId);

          if (existingUser) {
            return done(null, existingUser);
          }

          const existingEmailUser = await storage.getUserByEmail(email);
          if (existingEmailUser) {
            if (existingEmailUser.authProvider === 'local') {
              return done(new Error("Email already registered with password login. Please use password login."));
            }
            return done(null, existingEmailUser);
          }

          return done(null, { 
            googleId, 
            email, 
            firstName, 
            lastName, 
            profileImageUrl,
            isNewUser: true 
          } as any);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id || user.googleId);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserByGoogleId(id) || await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  return true;
}
