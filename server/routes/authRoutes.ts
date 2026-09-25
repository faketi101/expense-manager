import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { BaseType } from '../models/BaseType.js';
import { Source } from '../models/Source.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'expense_manager_jwt_secret_key_2026_super_secure';

const generateToken = (id: string, email: string): string => {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '30d' });
};

// POST /register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, currency } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      currency: currency || '৳',
      hideBalances: false,
    });

    const savedUser = await user.save();

    // Assign any existing unowned data to this first registered user
    await Promise.all([
      BaseType.updateMany({ userId: { $exists: false } }, { userId: savedUser._id }),
      Source.updateMany({ userId: { $exists: false } }, { userId: savedUser._id }),
      Category.updateMany({ userId: { $exists: false } }, { userId: savedUser._id }),
      Transaction.updateMany({ userId: { $exists: false } }, { userId: savedUser._id }),
    ]);

    const token = generateToken(String(savedUser._id), savedUser.email);

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        currency: savedUser.currency,
        hideBalances: savedUser.hideBalances,
        defaultScope: savedUser.defaultScope || 'personal',
        scopeBarOrder: savedUser.scopeBarOrder || 'default_first',
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = generateToken(String(user._id), user.email);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        hideBalances: user.hideBalances,
        defaultScope: user.defaultScope || 'personal',
        scopeBarOrder: user.scopeBarOrder || 'default_first',
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// GET /me (Verify session)
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        hideBalances: user.hideBalances,
        defaultScope: user.defaultScope || 'personal',
        scopeBarOrder: user.scopeBarOrder || 'default_first',
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// PUT /preferences
router.put('/preferences', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currency, hideBalances, defaultScope, scopeBarOrder } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (currency !== undefined) user.currency = currency;
    if (hideBalances !== undefined) user.hideBalances = !!hideBalances;
    if (defaultScope !== undefined) user.defaultScope = defaultScope;
    if (scopeBarOrder !== undefined) user.scopeBarOrder = scopeBarOrder;

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        hideBalances: user.hideBalances,
        defaultScope: user.defaultScope || 'personal',
        scopeBarOrder: user.scopeBarOrder || 'default_first',
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating preferences', error: error.message });
  }
});

export default router;
