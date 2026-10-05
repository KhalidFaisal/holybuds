import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function verifyAdminPassword(password) {
  let hash = null;
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    if (settings && settings.adminPasswordHash) {
      hash = settings.adminPasswordHash;
    }
  } catch (e) {
    console.error('Failed to fetch admin password hash from DB', e);
  }

  if (!hash) {
    hash = process.env.ADMIN_PASSWORD_HASH;
  }
  
  if (!hash) {
    throw new Error('No admin password hash configured in DB or env');
  }
  return bcrypt.compare(password, hash);
}

export function generateToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const raw = authHeader.slice(7).trim();
    if (raw && raw !== 'null' && raw !== 'undefined') {
      return raw;
    }
  }
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/admin_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export function requireAdmin(request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return false;
  }
  return true;
}
