import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { optionalAuthenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(optionalAuthenticateToken);

// GET transactions with rich filtering and pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      baseTypeId,
      sourceId,
      categoryId,
      subcategoryId,
      type,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filters: any[] = [];

    if (baseTypeId && baseTypeId !== 'all') {
      filters.push({ baseTypeId });
    }

    if (sourceId && sourceId !== 'all') {
      filters.push({ $or: [{ sourceId: sourceId }, { toSourceId: sourceId }] });
    }

    if (categoryId && categoryId !== 'all') {
      filters.push({ categoryId });
    }

    if (subcategoryId && subcategoryId !== 'all') {
      filters.push({ subcategoryId });
    }

    if (type && type !== 'all') {
      filters.push({ type });
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filters.push({ date: dateFilter });
    }

    if (search && typeof search === 'string' && search.trim()) {
      filters.push({
        $or: [
          { note: { $regex: search.trim(), $options: 'i' } },
          { subcategoryName: { $regex: search.trim(), $options: 'i' } },
        ],
      });
    }

    const authReq = req as AuthRequest;
    if (authReq.userId) {
      filters.push({
        $or: [{ userId: new mongoose.Types.ObjectId(authReq.userId) }, { userId: { $exists: false } }],
      });
    }

    const query = filters.length > 0 ? { $and: filters } : {};

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('baseTypeId', 'name icon color')
        .populate('sourceId', 'name icon color type')
        .populate('toSourceId', 'name icon color type')
        .populate('categoryId', 'name icon color type subcategories')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// POST create transaction (Always scope-wise)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type,
      amount,
      date,
      baseTypeId,
      sourceId,
      toSourceId,
      categoryId,
      subcategoryId,
      subcategoryName,
      note,
      tags,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ message: 'Valid positive amount is required' });
      return;
    }

    if (!baseTypeId) {
      res.status(400).json({ message: 'Base type (Scope: Personal, Office, etc.) is required' });
      return;
    }

    if (!sourceId) {
      res.status(400).json({ message: 'Payment source is required' });
      return;
    }

    if (type === 'transfer' && !toSourceId) {
      res.status(400).json({ message: 'Destination source is required for transfers' });
      return;
    }

    const authReq = req as AuthRequest;

    const newTx = new Transaction({
      type: type || 'expense',
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      baseTypeId,
      sourceId,
      toSourceId: type === 'transfer' ? toSourceId : null,
      categoryId: type !== 'transfer' ? categoryId : null,
      subcategoryId: type !== 'transfer' ? subcategoryId : null,
      subcategoryName: type !== 'transfer' ? subcategoryName || '' : '',
      note: note || '',
      tags: Array.isArray(tags) ? tags : [],
      userId: authReq.userId ? new mongoose.Types.ObjectId(authReq.userId) : undefined,
    });

    const saved = await newTx.save();
    const populated = await Transaction.findById(saved._id)
      .populate('baseTypeId', 'name icon color')
      .populate('sourceId', 'name icon color type')
      .populate('toSourceId', 'name icon color type')
      .populate('categoryId', 'name icon color type subcategories');

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
});

// PUT update transaction (Fully editable)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      type,
      amount,
      date,
      baseTypeId,
      sourceId,
      toSourceId,
      categoryId,
      subcategoryId,
      subcategoryName,
      note,
      tags,
    } = req.body;

    const tx = await Transaction.findById(id);
    if (!tx) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    if (type !== undefined) tx.type = type;
    if (amount !== undefined) tx.amount = Number(amount);
    if (date !== undefined) tx.date = new Date(date);
    if (baseTypeId !== undefined) tx.baseTypeId = baseTypeId;
    if (sourceId !== undefined) tx.sourceId = sourceId;
    if (toSourceId !== undefined) tx.toSourceId = type === 'transfer' ? toSourceId : null;
    if (categoryId !== undefined) tx.categoryId = type !== 'transfer' ? categoryId : null;
    if (subcategoryId !== undefined) tx.subcategoryId = type !== 'transfer' ? subcategoryId : null;
    if (subcategoryName !== undefined) tx.subcategoryName = type !== 'transfer' ? subcategoryName : '';
    if (note !== undefined) tx.note = note.trim();
    if (tags !== undefined) tx.tags = Array.isArray(tags) ? tags : [];

    const saved = await tx.save();
    const populated = await Transaction.findById(saved._id)
      .populate('baseTypeId', 'name icon color')
      .populate('sourceId', 'name icon color type')
      .populate('toSourceId', 'name icon color type')
      .populate('categoryId', 'name icon color type subcategories');

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating transaction', error: error.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }
    res.json({ message: 'Transaction deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
});

export default router;
