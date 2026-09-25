import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { Source } from '../models/Source.js';
import { BaseType } from '../models/BaseType.js';

const router = express.Router();

// Helper to compute balance of a source for a given scope
async function calculateSourceBalance(
  source: any,
  baseTypeId?: string | null
): Promise<number> {
  const isSingleScope = baseTypeId && baseTypeId !== 'all';
  const scopeFilter: Record<string, any> = {};
  if (isSingleScope) {
    scopeFilter.baseTypeId = new mongoose.Types.ObjectId(baseTypeId as string);
  }

  let initial = 0;
  if (isSingleScope) {
    const alloc = source.scopeAllocations?.find(
      (a: any) =>
        a.baseTypeId?._id?.toString() === baseTypeId.toString() ||
        a.baseTypeId?.toString() === baseTypeId.toString()
    );
    if (alloc) {
      initial = alloc.amount || 0;
    } else if (!source.scopeAllocations || source.scopeAllocations.length === 0) {
      initial = source.initialBalance || 0;
    }
  } else {
    if (source.scopeAllocations && source.scopeAllocations.length > 0) {
      initial = source.scopeAllocations.reduce((sum: number, a: any) => sum + (a.amount || 0), 0);
    } else {
      initial = source.initialBalance || 0;
    }
  }

  const [incomeRes, expenseRes, transferOutRes, transferInRes] = await Promise.all([
    Transaction.aggregate([
      { $match: { sourceId: source._id, type: 'income', ...scopeFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { sourceId: source._id, type: 'expense', ...scopeFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { sourceId: source._id, type: 'transfer', ...scopeFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { toSourceId: source._id, type: 'transfer', ...scopeFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalInc = incomeRes[0]?.total || 0;
  const totalExp = expenseRes[0]?.total || 0;
  const totalTransOut = transferOutRes[0]?.total || 0;
  const totalTransIn = transferInRes[0]?.total || 0;

  return initial + totalInc - totalExp - totalTransOut + totalTransIn;
}

// GET summary & analytics overview
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { baseTypeId, startDate, endDate } = req.query;

    const matchQuery: Record<string, any> = {};

    if (baseTypeId && baseTypeId !== 'all') {
      matchQuery.baseTypeId = new mongoose.Types.ObjectId(baseTypeId as string);
    }

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) {
        matchQuery.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        matchQuery.date.$lte = end;
      }
    }

    // 1. Calculate Total Net Worth (Current Available Funds from Active Accounts)
    // Exclude accounts marked as hidden or with hidden balances from net balance
    const activeSources = await Source.find({
      isActive: true,
      isHidden: { $ne: true },
      isBalanceHidden: { $ne: true },
    });
    let totalNetWorth = 0;

    for (const src of activeSources) {
      const bal = await calculateSourceBalance(src, baseTypeId as string);
      totalNetWorth += bal;
    }

    // 2. Period Cashflow (Income & Expense)
    const totals = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;

    totals.forEach((item) => {
      if (item._id === 'income') totalIncome = item.totalAmount;
      if (item._id === 'expense') totalExpense = item.totalAmount;
      transactionCount += item.count;
    });

    const netSavings = totalIncome - totalExpense;

    // 3. Scope Breakdown: Calculate total funds & cashflow for EACH Scope
    const allScopes = await BaseType.find({ isHidden: { $ne: true } }).sort({ order: 1 });
    const scopeBreakdown = await Promise.all(
      allScopes.map(async (scope) => {
        let scopeFunds = 0;
        for (const src of activeSources) {
          const bal = await calculateSourceBalance(src, String(scope._id));
          scopeFunds += bal;
        }

        const scopeTotals = await Transaction.aggregate([
          { $match: { baseTypeId: scope._id, ...(matchQuery.date ? { date: matchQuery.date } : {}) } },
          {
            $group: {
              _id: '$type',
              totalAmount: { $sum: '$amount' },
            },
          },
        ]);

        let sInc = 0;
        let sExp = 0;
        scopeTotals.forEach((t) => {
          if (t._id === 'income') sInc = t.totalAmount;
          if (t._id === 'expense') sExp = t.totalAmount;
        });

        return {
          scopeId: scope._id,
          name: scope.name,
          icon: scope.icon,
          color: scope.color,
          totalFunds: Math.round(scopeFunds * 100) / 100,
          income: Math.round(sInc * 100) / 100,
          expense: Math.round(sExp * 100) / 100,
        };
      })
    );

    // 4. Category Breakdown for Expenses with Subcategories
    const categoryAgg = await Transaction.aggregate([
      { $match: { ...matchQuery, type: 'expense', categoryId: { $ne: null } } },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const categoryBreakdown = await Promise.all(
      categoryAgg.map(async (item) => {
        const cat = await Category.findById(item._id);
        const percentage = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;

        // Subcategory breakdown inside this category
        const subAgg = await Transaction.aggregate([
          {
            $match: {
              ...matchQuery,
              type: 'expense',
              categoryId: item._id,
              subcategoryId: { $ne: null },
            },
          },
          {
            $group: {
              _id: '$subcategoryId',
              name: { $first: '$subcategoryName' },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]);

        return {
          categoryId: item._id,
          name: cat?.name || 'Uncategorized',
          icon: cat?.icon || 'Tag',
          color: cat?.color || '#94a3b8',
          amount: Math.round(item.total * 100) / 100,
          count: item.count,
          percentage: Math.round(percentage * 10) / 10,
          subcategories: subAgg.map((s) => ({
            subcategoryId: s._id,
            name: s.name || 'Subcategory',
            amount: s.total,
            count: s.count,
          })),
        };
      })
    );

    // 5. Monthly Trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trendQuery: Record<string, any> = { date: { $gte: sixMonthsAgo } };
    if (baseTypeId && baseTypeId !== 'all') {
      trendQuery.baseTypeId = new mongoose.Types.ObjectId(baseTypeId as string);
    }

    const monthlyTrends = await Transaction.aggregate([
      { $match: trendQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = new Map<string, { month: string; income: number; expense: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      trendMap.set(key, { month: label, income: 0, expense: 0 });
    }

    monthlyTrends.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (trendMap.has(key)) {
        const point = trendMap.get(key)!;
        if (item._id.type === 'income') point.income = item.total;
        if (item._id.type === 'expense') point.expense = item.total;
      }
    });

    res.json({
      summary: {
        totalNetWorth: Math.round(totalNetWorth * 100) / 100, // True available money across accounts!
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netSavings: Math.round(netSavings * 100) / 100,
        transactionCount,
      },
      scopeBreakdown,
      categoryBreakdown,
      monthlyTrends: Array.from(trendMap.values()),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error calculating stats', error: error.message });
  }
});

export default router;
