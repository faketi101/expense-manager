import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  date: Date;
  baseTypeId: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId;
  toSourceId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  subcategoryName?: string;
  note?: string;
  tags: string[];
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: ['expense', 'income', 'transfer'],
      required: true,
      default: 'expense',
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    baseTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'BaseType',
      required: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Source',
      required: true,
    },
    toSourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Source',
      default: null,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    subcategoryName: {
      type: String,
      default: '',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for high performance querying on mobile
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ baseTypeId: 1, date: -1 });
TransactionSchema.index({ sourceId: 1 });
TransactionSchema.index({ categoryId: 1 });
TransactionSchema.index({ userId: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
