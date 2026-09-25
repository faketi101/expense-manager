import mongoose, { Schema, Document } from 'mongoose';

export interface IScopeAllocation {
  baseTypeId: mongoose.Types.ObjectId;
  amount: number;
}

export interface ISource extends Document {
  name: string;
  type: string;
  icon: string;
  color: string;
  initialBalance: number;
  scopeAllocations: IScopeAllocation[];
  accountNumber?: string;
  order: number;
  isActive: boolean;
  isHidden: boolean;
  isBalanceHidden: boolean;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScopeAllocationSchema = new Schema<IScopeAllocation>(
  {
    baseTypeId: { type: Schema.Types.ObjectId, ref: 'BaseType', required: true },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const SourceSchema = new Schema<ISource>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['bank', 'mobile_banking', 'cash', 'savings', 'card', 'other'],
      default: 'bank',
    },
    icon: { type: String, default: 'Wallet', trim: true },
    color: { type: String, default: '#10b981', trim: true },
    initialBalance: { type: Number, default: 0 },
    scopeAllocations: { type: [ScopeAllocationSchema], default: [] },
    accountNumber: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false },
    isBalanceHidden: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

export const Source = mongoose.model<ISource>('Source', SourceSchema);
