import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { BaseType, Source, Category } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';

export interface FilterState {
  type: string;
  baseTypeId: string;
  sourceId: string;
  categoryId: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

interface TransactionFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onUpdateFilters: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  baseTypes: BaseType[];
  sources: Source[];
  categories: Category[];
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onResetFilters,
  baseTypes,
  sources,
  categories,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#111724] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#151c2d]">
          <h3 className="text-base font-bold text-slate-100">Filter Transactions</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetFilters}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800"
            >
              <RotateCcw size={12} />
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Date Range Chips */}
          <div>
            <label className="text-slate-400 font-semibold mb-2 block uppercase tracking-wider">
              Date Period
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
              ].map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => onUpdateFilters({ dateRange: period.id as any })}
                  className={`py-2 px-1 rounded-xl text-center font-medium transition ${
                    filters.dateRange === period.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#182032] text-slate-300 hover:bg-[#202b44]'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-slate-400 font-semibold mb-2 block uppercase tracking-wider">
              Transaction Type
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'expense', label: 'Expenses' },
                { id: 'income', label: 'Income' },
                { id: 'transfer', label: 'Transfers' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdateFilters({ type: t.id })}
                  className={`py-2 px-1 rounded-xl text-center font-medium transition ${
                    filters.type === t.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#182032] text-slate-300 hover:bg-[#202b44]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Filter */}
          <div>
            <label className="text-slate-400 font-semibold mb-2 block uppercase tracking-wider">
              Scope / Base Type
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => onUpdateFilters({ baseTypeId: 'all' })}
                className={`py-1.5 px-3 rounded-xl shrink-0 font-medium transition ${
                  filters.baseTypeId === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#182032] text-slate-300 hover:bg-[#202b44]'
                }`}
              >
                All
              </button>
              {baseTypes.map((scope) => (
                <button
                  key={scope._id}
                  type="button"
                  onClick={() => onUpdateFilters({ baseTypeId: scope._id })}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl shrink-0 font-medium transition ${
                    filters.baseTypeId === scope._id
                      ? 'text-white'
                      : 'bg-[#182032] text-slate-300 hover:bg-[#202b44]'
                  }`}
                  style={{
                    backgroundColor: filters.baseTypeId === scope._id ? scope.color : undefined,
                  }}
                >
                  <DynamicIcon name={scope.icon} size={13} />
                  <span>{scope.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Source Filter */}
          <div>
            <label className="text-slate-400 font-semibold mb-2 block uppercase tracking-wider">
              Payment Source
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateFilters({ sourceId: 'all' })}
                className={`p-2 rounded-xl text-left font-medium transition ${
                  filters.sourceId === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#182032] text-slate-300 hover:bg-[#202b44]'
                }`}
              >
                All Sources
              </button>
              {sources.map((src) => (
                <button
                  key={src._id}
                  type="button"
                  onClick={() => onUpdateFilters({ sourceId: src._id })}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left font-medium transition truncate ${
                    filters.sourceId === src._id
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#182032] text-slate-300 hover:bg-[#202b44]'
                  }`}
                >
                  <DynamicIcon name={src.icon} size={14} color={src.color} />
                  <span className="truncate">{src.name}</span>
                  {src.isHidden && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-300 ml-auto shrink-0">
                      Hidden
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-slate-400 font-semibold mb-2 block uppercase tracking-wider">
              Category
            </label>
            <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-1.5 p-1 bg-[#141b2a] rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onUpdateFilters({ categoryId: 'all' })}
                className={`p-2 rounded-lg text-left font-medium transition ${
                  filters.categoryId === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-[#1f283d]'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => onUpdateFilters({ categoryId: cat._id })}
                  className={`flex items-center gap-1.5 p-2 rounded-lg text-left font-medium transition truncate ${
                    filters.categoryId === cat._id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-[#1f283d]'
                  }`}
                >
                  <DynamicIcon name={cat.icon} size={13} color={cat.color} />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Done Action */}
        <div className="p-4 border-t border-slate-800 bg-[#151c2d]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-semibold text-white rounded-xl shadow-md transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
