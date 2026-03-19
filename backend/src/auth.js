import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserDB, AchievementDB } from '../db/database.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, heroClass = 'mage' } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, error: 'username, email and password are required' });

    if (UserDB.getByEmail.get(email))
      return res.status(409).json({ success: false, error: 'Email already registered' });
    if (UserDB.getByUsername.get(username))
      return res.status(409).json({ success: false, error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const id   = uuidv4();
    UserDB.create.run(id, username, email, hash, heroClass);
    AchievementDB.award.run(id, 'First Steps'); // welcome badge

    const user  = UserDB.getById.get(id);
    const token = signToken({ id: user.id, username: user.username, heroClass: user.hero_class });
    res.json({ success: true, token, user: sanitize(user) });
  } catch (e) {
    console.error('[register]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'email and password required' });

    const user = UserDB.getByEmail.get(email);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const token = signToken({ id: user.id, username: user.username, heroClass: user.hero_class });
    res.json({ success: true, token, user: sanitize(user) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false });
  try {
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(header.substring(7), process.env.JWT_SECRET || 'edurpg-dev-secret-change-in-prod');
    const user = UserDB.getById.get(decoded.id);
    if (!user) return res.status(404).json({ success: false });
    res.json({ success: true, user: sanitize(user) });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

function sanitize(u) {
  return {
    id: u.id, username: u.username, email: u.email,
    heroClass: u.hero_class, level: u.level, xp: u.xp, totalXp: u.total_xp,
    guildId: u.guild_id,
    stats: { wins: u.wins, losses: u.losses, raidsCompleted: u.raids_done, totalDamageDealt: u.total_dmg },
  };
}

export { sanitize };
export default router;