import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';

const router = express.Router();

// GET all categories (with optional type and baseTypeId filters)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, baseTypeId, includeHidden } = req.query;
    const filter: Record<string, any> = {};

    if (includeHidden !== 'true') {
      filter.isHidden = { $ne: true };
    }

    if (type) {
      filter.type = type;
    }

    if (baseTypeId && baseTypeId !== 'all') {
      filter.$or = [{ baseTypeId: null }, { baseTypeId: baseTypeId }];
    }

    const categories = await Category.find(filter)
      .populate('baseTypeId', 'name icon color')
      .sort({ order: 1, createdAt: 1 });

    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// POST create category
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, icon, color, baseTypeId, monthlyBudget, subcategories, isHidden, order } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const newCategory = new Category({
      name: name.trim(),
      type: type || 'expense',
      icon: icon || 'Tag',
      color: color || '#f59e0b',
      baseTypeId: baseTypeId ? baseTypeId : null,
      monthlyBudget: monthlyBudget !== undefined ? Number(monthlyBudget) : 0,
      subcategories: Array.isArray(subcategories) ? subcategories : [],
      isHidden: !!isHidden,
      order: order !== undefined ? Number(order) : 0,
    });

    const saved = await newCategory.save();
    const populated = await Category.findById(saved._id).populate('baseTypeId', 'name icon color');
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// PUT update category (Fully editable)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, icon, color, baseTypeId, monthlyBudget, subcategories, isHidden, order } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    if (name !== undefined) category.name = name.trim();
    if (type !== undefined) category.type = type;
    if (icon !== undefined) category.icon = icon.trim();
    if (color !== undefined) category.color = color.trim();
    if (baseTypeId !== undefined) category.baseTypeId = baseTypeId ? baseTypeId : null;
    if (monthlyBudget !== undefined) category.monthlyBudget = Number(monthlyBudget);
    if (Array.isArray(subcategories)) category.subcategories = subcategories as any;
    if (isHidden !== undefined) category.isHidden = Boolean(isHidden);
    if (order !== undefined) category.order = Number(order);

    const updated = await category.save();
    const populated = await Category.findById(updated._id).populate('baseTypeId', 'name icon color');
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
});

// POST add subcategory to category
router.post('/:id/subcategories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Subcategory name is required' });
      return;
    }

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const newSub = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      icon: icon || category.icon || 'Tag',
      color: color || category.color || '#f59e0b',
    };

    category.subcategories.push(newSub as any);
    await category.save();

    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding subcategory', error: error.message });
  }
});

// DELETE subcategory from category
router.delete('/:id/subcategories/:subId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, subId } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    category.subcategories = category.subcategories.filter(
      (sub: any) => sub._id.toString() !== subId
    );
    await category.save();

    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting subcategory', error: error.message });
  }
});

// DELETE category
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transactionCount = await Transaction.countDocuments({ categoryId: id });

    if (transactionCount > 0) {
      const force = req.query.force === 'true';
      if (!force) {
        res.status(409).json({
          message: `Cannot delete: ${transactionCount} transaction(s) are categorized under this category. Pass ?force=true to delete anyway.`,
          transactionCount,
        });
        return;
      }
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.json({ message: 'Category deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

export default router;
