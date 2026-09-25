import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Source } from '../models/Source.js';
import { Transaction } from '../models/Transaction.js';
import { BaseType } from '../models/BaseType.js';

const router = express.Router();

// GET all sources with computed balances (scope-aware)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { baseTypeId, includeHidden } = req.query;

    const filter: Record<string, any> = { isActive: true };
    if (includeHidden !== 'true') {
      filter.isHidden = { $ne: true };
    }

    const sources = await Source.find(filter)
      .populate('scopeAllocations.baseTypeId', 'name icon color')
      .sort({ order: 1, createdAt: 1 });

    // Calculate dynamic balance for each source
    const sourcesWithBalances = await Promise.all(
      sources.map(async (source) => {
        const isSingleScope = baseTypeId && baseTypeId !== 'all';
        const scopeFilter: Record<string, any> = {};
        if (isSingleScope) {
          scopeFilter.baseTypeId = new mongoose.Types.ObjectId(baseTypeId as string);
        }

        // Calculate initial balance for requested scope
        let initialForScope = 0;
        if (isSingleScope) {
          const allocation = source.scopeAllocations?.find(
            (alloc: any) =>
              alloc.baseTypeId?._id?.toString() === baseTypeId.toString() ||
              alloc.baseTypeId?.toString() === baseTypeId.toString()
          );
          if (allocation) {
            initialForScope = allocation.amount || 0;
          } else if (!source.scopeAllocations || source.scopeAllocations.length === 0) {
            // If no explicit scope allocation table, fallback to initialBalance
            initialForScope = source.initialBalance || 0;
          }
        } else {
          // All scopes sum: use sum of scopeAllocations if provided, otherwise source.initialBalance
          if (source.scopeAllocations && source.scopeAllocations.length > 0) {
            initialForScope = source.scopeAllocations.reduce((sum, a) => sum + (a.amount || 0), 0);
          } else {
            initialForScope = source.initialBalance || 0;
          }
        }

        // 1. Income into this source for the scope
        const incomeResult = await Transaction.aggregate([
          { $match: { sourceId: source._id, type: 'income', ...scopeFilter } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalIncome = incomeResult[0]?.total || 0;

        // 2. Expense from this source for the scope
        const expenseResult = await Transaction.aggregate([
          { $match: { sourceId: source._id, type: 'expense', ...scopeFilter } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalExpense = expenseResult[0]?.total || 0;

        // 3. Transfers out of this source for the scope
        const transferOutResult = await Transaction.aggregate([
          { $match: { sourceId: source._id, type: 'transfer', ...scopeFilter } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalTransferOut = transferOutResult[0]?.total || 0;

        // 4. Transfers into this source for the scope
        const transferInResult = await Transaction.aggregate([
          { $match: { toSourceId: source._id, type: 'transfer', ...scopeFilter } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalTransferIn = transferInResult[0]?.total || 0;

        const currentBalance =
          initialForScope + totalIncome - totalExpense - totalTransferOut + totalTransferIn;

        return {
          ...source.toObject(),
          totalIncome,
          totalExpense,
          initialForScope,
          currentBalance: Math.round(currentBalance * 100) / 100,
        };
      })
    );

    res.json(sourcesWithBalances);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching sources', error: error.message });
  }
});

// POST create new source
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, icon, color, initialBalance, scopeAllocations, accountNumber, isHidden, isBalanceHidden, order } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    let formattedAllocations = Array.isArray(scopeAllocations)
      ? scopeAllocations
          .filter((a) => a.baseTypeId)
          .map((a) => ({
            baseTypeId: new mongoose.Types.ObjectId(a.baseTypeId),
            amount: Number(a.amount) || 0,
          }))
      : [];

    let computedInitial =
      formattedAllocations.length > 0
        ? formattedAllocations.reduce((sum, a) => sum + a.amount, 0)
        : initialBalance !== undefined
        ? Number(initialBalance)
        : 0;

    if (computedInitial > 0 && formattedAllocations.length === 0) {
      const defaultBaseType = (await BaseType.findOne({ isDefault: true })) || (await BaseType.findOne());
      if (defaultBaseType) {
        formattedAllocations = [{ baseTypeId: defaultBaseType._id as any, amount: computedInitial }];
      }
    }

    const newSource = new Source({
      name: name.trim(),
      type: type || 'bank',
      icon: icon || 'Wallet',
      color: color || '#10b981',
      initialBalance: computedInitial,
      scopeAllocations: formattedAllocations,
      accountNumber: accountNumber || '',
      isHidden: !!isHidden,
      isBalanceHidden: !!isBalanceHidden,
      order: order !== undefined ? Number(order) : 0,
      isActive: true,
    });

    const saved = await newSource.save();
    const populated = await Source.findById(saved._id).populate('scopeAllocations.baseTypeId', 'name icon color');
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating source', error: error.message });
  }
});

// PUT reorder sources (Batch update order)
router.put('/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ message: 'orderedIds array is required' });
      return;
    }

    await Promise.all(
      orderedIds.map((id: string, index: number) =>
        Source.findByIdAndUpdate(id, { order: index })
      )
    );

    res.json({ message: 'Sources reordered successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error reordering sources', error: error.message });
  }
});

// PUT update source (Fully editable)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, icon, color, initialBalance, scopeAllocations, accountNumber, isHidden, isBalanceHidden, order, isActive } = req.body;

    const source = await Source.findById(id);
    if (!source) {
      res.status(404).json({ message: 'Source not found' });
      return;
    }

    if (name !== undefined) source.name = name.trim();
    if (type !== undefined) source.type = type;
    if (icon !== undefined) source.icon = icon.trim();
    if (color !== undefined) source.color = color.trim();
    if (accountNumber !== undefined) source.accountNumber = accountNumber.trim();
    if (order !== undefined) source.order = Number(order);
    if (isActive !== undefined) source.isActive = Boolean(isActive);
    if (isHidden !== undefined) source.isHidden = Boolean(isHidden);
    if (isBalanceHidden !== undefined) source.isBalanceHidden = Boolean(isBalanceHidden);

    if (Array.isArray(scopeAllocations)) {
      source.scopeAllocations = scopeAllocations
        .filter((a) => a.baseTypeId)
        .map((a) => ({
          baseTypeId: new mongoose.Types.ObjectId(a.baseTypeId),
          amount: Number(a.amount) || 0,
        }));
      source.initialBalance = source.scopeAllocations.reduce((sum, a) => sum + a.amount, 0);
    } else if (initialBalance !== undefined) {
      source.initialBalance = Number(initialBalance);
      const defaultBaseType = (await BaseType.findOne({ isDefault: true })) || (await BaseType.findOne());
      if (defaultBaseType) {
        source.scopeAllocations = [{ baseTypeId: defaultBaseType._id as any, amount: source.initialBalance }];
      }
    }

    const updated = await source.save();
    const populated = await Source.findById(updated._id).populate('scopeAllocations.baseTypeId', 'name icon color');
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating source', error: error.message });
  }
});

// DELETE source
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transactionCount = await Transaction.countDocuments({
      $or: [{ sourceId: id }, { toSourceId: id }],
    });

    if (transactionCount > 0) {
      const force = req.query.force === 'true';
      if (!force) {
        res.status(409).json({
          message: `Cannot delete: ${transactionCount} transaction(s) are linked to this source. Pass ?force=true to delete anyway.`,
          transactionCount,
        });
        return;
      }
    }

    const deleted = await Source.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Source not found' });
      return;
    }

    res.json({ message: 'Source deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting source', error: error.message });
  }
});

export default router;
