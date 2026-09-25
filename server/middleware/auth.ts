import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'expense_manager_jwt_secret_key_2026_super_secure';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ message: 'Access denied: No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired authentication token' });
  }
};

export const optionalAuthenticateToken = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      req.userId = decoded.id;
    } catch {
      // Continue even if token is invalid or expired
    }
  }
  next();
};
