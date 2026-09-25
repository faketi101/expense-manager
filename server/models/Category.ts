import mongoose, { Schema, Document } from 'mongoose';

export interface ISubCategory {
  _id?: mongoose.Types.ObjectId;
  name: string;
  icon?: string;
  color?: string;
}

export interface ICategory extends Document {
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  baseTypeId?: mongoose.Types.ObjectId | null;
  monthlyBudget?: number;
  subcategories: ISubCategory[];
  order: number;
  isHidden: boolean;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema = new Schema<ISubCategory>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'Tag', trim: true },
    color: { type: String, default: '#f59e0b', trim: true },
  },
  { timestamps: true }
);

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['expense', 'income'],
      default: 'expense',
    },
    icon: { type: String, default: 'Tag', trim: true },
    color: { type: String, default: '#f59e0b', trim: true },
    baseTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'BaseType',
      default: null,
    },
    monthlyBudget: { type: Number, default: 0 },
    subcategories: { type: [SubCategorySchema], default: [] },
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
