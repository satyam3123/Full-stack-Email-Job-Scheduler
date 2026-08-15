import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './config.js';
import { prisma } from './db.js';

passport.use(new GoogleStrategy({
  clientID: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  callbackURL: env.GOOGLE_CALLBACK_URL
}, async (_accessToken, _refreshToken, profile: Profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('Google did not provide an email address.'));
    const user = await prisma.user.upsert({
      where: { googleId: profile.id },
      update: {
        email,
        name: profile.displayName || email,
        avatarUrl: profile.photos?.[0]?.value
      },
      create: {
        googleId: profile.id,
        email,
        name: profile.displayName || email,
        avatarUrl: profile.photos?.[0]?.value
      }
    });
    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}));

passport.serializeUser((user, done) => done(null, (user as { id: string }).id));
passport.deserializeUser(async (id: string, done) => {
  try {
    done(null, await prisma.user.findUnique({ where: { id } }));
  } catch (error) {
    done(error as Error);
  }
});

export { passport };
