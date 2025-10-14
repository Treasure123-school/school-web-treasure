import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Use full URL for OAuth callback - required for production
const REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
const BASE_URL = REPLIT_DEV_DOMAIN ? `https://${REPLIT_DEV_DOMAIN}` : 'http://0.0.0.0:5000';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BASE_URL}/api/auth/google/callback`;

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
            return done(null, false, { message: "No email found in Google profile" });
          }

          // Step 1: Check if user exists by google_id
          let user = await storage.getUserByGoogleId(googleId);
          
          // Step 2: If not found by google_id, check by email
          if (!user) {
            user = await storage.getUserByEmail(email);
          }

          // Step 3: If user exists, validate their authorization
          if (user) {
            // Get role name for validation
            const role = await storage.getRole(user.roleId);
            const roleName = role?.name?.toLowerCase();
            
            // Check if user is staff (teacher/admin)
            if (roleName === 'teacher' || roleName === 'admin') {
              // For teachers, check if they are pre-approved
              if (roleName === 'teacher') {
                const approvedTeacher = await storage.getApprovedTeacherByEmail(email);
                if (!approvedTeacher) {
                  return done(null, false, { 
                    message: "Access denied: Only pre-approved teachers can use Google Sign-In. Please apply through the Job Vacancy page first." 
                  });
                }
              }
              
              // Check account status
              if (user.status === 'active') {
                // Update google_id if not set
                if (!user.googleId) {
                  await storage.updateUserGoogleId(user.id, googleId);
                  user.googleId = googleId;
                }
                // ALLOW LOGIN - Active staff member (admin or pre-approved teacher)
                return done(null, user);
              } else if (user.status === 'pending') {
                // DENY - Account pending approval
                return done(null, false, { 
                  message: "Your account is awaiting Admin approval. You will be notified once verified." 
                });
              } else if (user.status === 'suspended' || user.status === 'disabled') {
                // DENY - Account suspended/disabled
                return done(null, false, { 
                  message: "Access denied: Your account has been suspended by THS Admin." 
                });
              }
            }
            
            // If student/parent trying to use Google login
            if (roleName === 'student' || roleName === 'parent') {
              return done(null, false, { 
                message: "Students and parents must use THS username and password to login. Contact your teacher if you forgot your credentials." 
              });
            }
            
            // Unknown role or local auth provider conflict
            if (user.authProvider === 'local') {
              return done(null, false, { 
                message: "This email is registered with a password. Please use password login instead." 
              });
            }
          }

          // Step 4: No existing user found - mark as new user needing approval
          return done(null, { 
            googleId, 
            email, 
            firstName, 
            lastName, 
            profileImageUrl,
            isNewUser: true,
            requiresApproval: true
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
