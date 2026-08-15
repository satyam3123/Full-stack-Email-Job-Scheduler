import { Router } from 'express';
import { env } from '../config.js';
import { passport } from '../auth.js';

export const authRouter = Router();

authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));

authRouter.get('/google/callback', passport.authenticate('google', { failureRedirect: `${env.FRONTEND_URL}/?auth=failed` }), (req, res) => {
  req.session.userId = (req.user as { id: string }).id;
  res.redirect(`${env.FRONTEND_URL}/dashboard`);
});

authRouter.get('/me', (req, res) => {
  if (!req.isAuthenticated() || !req.user) return res.status(401).json({ user: null });
  const user = req.user as { id: string; name: string; email: string; avatarUrl: string | null };
  return res.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
});

authRouter.post('/logout', (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) return next(logoutError);
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie('reachinbox.sid');
      return res.status(204).end();
    });
  });
});
