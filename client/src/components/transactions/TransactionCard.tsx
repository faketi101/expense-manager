import React from 'react';
import { format } from 'date-fns';
import { ArrowRightLeft, Edit2, Trash2 } from 'lucide-react';
import { Transaction, BaseType, Source, Category } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency } from '../../lib/colors';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  currency?: string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  currency = '৳',
}) => {
  const { maskAmount } = usePrivacy();

  const scope = transaction.baseTypeId as BaseType | undefined;
  const source = transaction.sourceId as Source | undefined;
  const toSource = transaction.toSourceId as Source | undefined;
  const category = transaction.categoryId as Category | undefined;

  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const txDate = new Date(transaction.date);
  const formattedDate = format(txDate, 'MMM d, yyyy');

  return (
    <div className="bg-[#141b2a] hover:bg-[#182133] border border-slate-800/80 rounded-2xl p-3.5 transition group shadow-sm flex items-center justify-between gap-3">
      {/* Left: Category / Type Icon */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
          style={{
            backgroundColor: isTransfer
              ? '#6366f125'
              : `${category?.color || '#3b82f6'}25`,
            color: isTransfer ? '#818cf8' : category?.color || '#60a5fa',
          }}
        >
          {isTransfer ? (
            <ArrowRightLeft size={20} />
          ) : (
            <DynamicIcon name={category?.icon || 'Tag'} size={20} />
          )}
        </div>

        {/* Center: Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-100 truncate">
              {isTransfer
                ? `Transfer: ${source?.name || 'Account'} → ${toSource?.name || 'Account'}`
                : category?.name || 'Uncategorized'}
            </h4>

            {/* Subcategory Badge */}
            {transaction.subcategoryName && (
              <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.2 rounded-md font-medium truncate">
                {transaction.subcategoryName}
              </span>
            )}
          </div>

          {/* Badges: Scope & Source */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {/* Scope Badge (Personal, Office, etc.) */}
            {scope && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md text-white"
                style={{ backgroundColor: `${scope.color}35`, color: scope.color }}
              >
                <DynamicIcon name={scope.icon} size={11} />
                {scope.name}
              </span>
            )}

            {/* Source Badge */}
            {source && !isTransfer && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-[#1c2538] px-2 py-0.5 rounded-md border border-slate-700/60">
                <DynamicIcon name={source.icon} size={11} color={source.color} />
                {source.name}
              </span>
            )}

            {/* Date */}
            <span className="text-[10px] text-slate-500">{formattedDate}</span>
          </div>

          {/* Note if present */}
          {transaction.note && (
            <p className="text-xs text-slate-400 truncate mt-1 italic font-light">
              "{transaction.note}"
            </p>
          )}
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div
          className={`text-sm sm:text-base font-bold whitespace-nowrap ${
            isExpense
              ? 'text-rose-400'
              : isIncome
              ? 'text-emerald-400'
              : 'text-indigo-400'
          }`}
        >
          {isExpense && '- '}
          {isIncome && '+ '}
          {isTransfer && '⇄ '}
          {maskAmount(formatCurrency(transaction.amount, currency))}
        </div>

        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
