import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, ArrowDown, ArrowUp, ArrowRightLeft } from 'lucide-react';
import { Transaction, BaseType, Source, Category } from '../types';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { TransactionFilters, FilterState } from '../components/transactions/TransactionFilters';
import { TransactionListSkeleton } from '../components/common/Skeletons';
import { formatCurrency } from '../lib/colors';

interface TransactionsPageProps {
  transactions: Transaction[];
  baseTypes: BaseType[];
  sources: Source[];
  categories: Category[];
  filters: FilterState;
  onUpdateFilters: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onOpenQuickAdd: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  isLoading: boolean;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  baseTypes,
  sources,
  categories,
  filters,
  onUpdateFilters,
  onResetFilters,
  onOpenQuickAdd,
  onEditTransaction,
  onDeleteTransaction,
  isLoading,
}) => {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.baseTypeId !== 'all') count++;
    if (filters.sourceId !== 'all') count++;
    if (filters.categoryId !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  }, [filters]);

  // Client-side search filtering on note & category name
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter((tx) => {
      const noteMatch = tx.note?.toLowerCase().includes(query);
      const catName =
        typeof tx.categoryId === 'object' ? tx.categoryId?.name.toLowerCase() : '';
      const srcName =
        typeof tx.sourceId === 'object' ? tx.sourceId?.name.toLowerCase() : '';
      return noteMatch || catName?.includes(query) || srcName?.includes(query);
    });
  }, [transactions, searchQuery]);

  // Aggregate sums of filtered list
  const { totalExpense, totalIncome } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    filteredList.forEach((tx) => {
      if (tx.type === 'expense') exp += tx.amount;
      if (tx.type === 'income') inc += tx.amount;
    });
    return { totalExpense: exp, totalIncome: inc };
  }, [filteredList]);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Top Header & Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">Transactions</h2>
          <p className="text-xs text-slate-400">Search and filter complete history</p>
        </div>

        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Search Input & Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search notes, categories, accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131927] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className={`p-2.5 rounded-2xl border transition flex items-center gap-1.5 relative ${
            activeFilterCount > 0
              ? 'bg-blue-600/20 border-blue-500 text-blue-400'
              : 'bg-[#131927] hover:bg-[#182133] border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Filter transactions"
        >
          <Filter size={18} />
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Type Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All', icon: null },
          { id: 'expense', label: 'Expenses', icon: ArrowDown, color: 'text-rose-400' },
          { id: 'income', label: 'Income', icon: ArrowUp, color: 'text-emerald-400' },
          { id: 'transfer', label: 'Transfers', icon: ArrowRightLeft, color: 'text-indigo-400' },
        ].map((tab) => {
          const isSelected = filters.type === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onUpdateFilters({ type: tab.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                isSelected
                  ? 'bg-slate-700/80 text-white border border-slate-600 shadow-xs'
                  : 'bg-[#141b2a] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {IconComp && <IconComp size={12} className={tab.color} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Summary Banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#131927]/60 rounded-xl border border-slate-800/80 text-xs">
        <span className="text-slate-400">
          Showing <strong className="text-slate-200">{filteredList.length}</strong> items
        </span>
        <div className="flex items-center gap-3 font-semibold">
          {totalExpense > 0 && (
            <span className="text-rose-400">-{formatCurrency(totalExpense)}</span>
          )}
          {totalIncome > 0 && (
            <span className="text-emerald-400">+{formatCurrency(totalIncome)}</span>
          )}
        </div>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <TransactionListSkeleton count={6} />
      ) : filteredList.length === 0 ? (
        <div className="bg-[#131927] border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <p className="text-xs text-slate-400">No transactions match your current filters</p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredList.map((tx) => (
            <TransactionCard
              key={tx._id}
              transaction={tx}
              onEdit={onEditTransaction}
              onDelete={onDeleteTransaction}
            />
          ))}
        </div>
      )}

      {/* Filters Sheet Drawer */}
      <TransactionFilters
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onUpdateFilters={onUpdateFilters}
        onResetFilters={onResetFilters}
        baseTypes={baseTypes}
        sources={sources}
        categories={categories}
      />
    </div>
  );
};
