import mongoose, { Schema, Document } from 'mongoose';

export interface IBaseType extends Document {
  name: string;
  icon: string;
  color: string;
  description?: string;
  order: number;
  isDefault: boolean;
  isHidden: boolean;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BaseTypeSchema = new Schema<IBaseType>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'Folder', trim: true },
    color: { type: String, default: '#3b82f6', trim: true },
    description: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

export const BaseType = mongoose.model<IBaseType>('BaseType', BaseTypeSchema);
