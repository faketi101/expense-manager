import express, { Request, Response } from 'express';
import { BaseType } from '../models/BaseType.js';
import { Transaction } from '../models/Transaction.js';

const router = express.Router();

// GET all base types
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const baseTypes = await BaseType.find().sort({ order: 1, createdAt: 1 });
    res.json(baseTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching base types', error });
  }
});

// POST create base type
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, icon, color, description, isDefault, order } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    if (isDefault) {
      await BaseType.updateMany({}, { isDefault: false });
    }

    const newType = new BaseType({
      name: name.trim(),
      icon: icon || 'Folder',
      color: color || '#3b82f6',
      description: description || '',
      isDefault: !!isDefault,
      order: order !== undefined ? Number(order) : 0,
    });

    const saved = await newType.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error creating base type', error });
  }
});

// PUT update base type (Fully editable)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, icon, color, description, isDefault, order } = req.body;

    const baseType = await BaseType.findById(id);
    if (!baseType) {
      res.status(404).json({ message: 'Base type not found' });
      return;
    }

    if (name !== undefined) baseType.name = name.trim();
    if (icon !== undefined) baseType.icon = icon.trim();
    if (color !== undefined) baseType.color = color.trim();
    if (description !== undefined) baseType.description = description.trim();
    if (order !== undefined) baseType.order = Number(order);

    if (isDefault !== undefined && isDefault) {
      await BaseType.updateMany({ _id: { $ne: id } }, { isDefault: false });
      baseType.isDefault = true;
    } else if (isDefault !== undefined && !isDefault) {
      baseType.isDefault = false;
    }

    const updated = await baseType.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating base type', error });
  }
});

// DELETE base type
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Check if any transactions reference this base type
    const transactionCount = await Transaction.countDocuments({ baseTypeId: id });
    if (transactionCount > 0) {
      // Return 409 conflict with count so user can confirm or reassign
      const force = req.query.force === 'true';
      if (!force) {
        res.status(409).json({
          message: `Cannot delete: ${transactionCount} transaction(s) are linked to this base type. Pass ?force=true to delete anyway.`,
          transactionCount,
        });
        return;
      }
    }

    const deleted = await BaseType.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Base type not found' });
      return;
    }

    res.json({ message: 'Base type deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting base type', error });
  }
});

export default router;
