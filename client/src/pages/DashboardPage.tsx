import React from 'react';
import { ArrowRight, RefreshCw, PlusCircle } from 'lucide-react';
import { BaseType, Source, Transaction, StatsResponse } from '../types';
import { BalanceOverview } from '../components/dashboard/BalanceOverview';
import { ScopeFundsBreakdown } from '../components/dashboard/ScopeFundsBreakdown';
import { SourcePills } from '../components/dashboard/SourcePills';
import { SpendingDonut } from '../components/dashboard/SpendingDonut';
import { TransactionCard } from '../components/transactions/TransactionCard';
import {
  BalanceOverviewSkeleton,
  ScopeBreakdownSkeleton,
  SourcePillsSkeleton,
  SpendingDonutSkeleton,
  TransactionListSkeleton,
} from '../components/common/Skeletons';
import { api } from '../services/api';

interface DashboardPageProps {
  baseTypes: BaseType[];
  sources: Source[];
  stats: StatsResponse | null;
  recentTransactions: Transaction[];
  selectedScope: string;
  onSelectScope: (scopeId: string) => void;
  onNavigateToTransactions: () => void;
  onOpenQuickAdd: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  baseTypes,
  sources,
  stats,
  recentTransactions,
  selectedScope,
  onSelectScope,
  onNavigateToTransactions,
  onOpenQuickAdd,
  onEditTransaction,
  onDeleteTransaction,
  onRefresh,
  isLoading,
}) => {
  // Find current scope details
  const currentScopeObj =
    selectedScope === 'all'
      ? { name: 'All Scopes', color: '#3b82f6' }
      : baseTypes.find((b) => b._id === selectedScope) || {
          name: 'Custom',
          color: '#3b82f6',
        };

  const handleToggleHideBalance = async (source: Source) => {
    try {
      await api.updateSource(source._id, { isBalanceHidden: !source.isBalanceHidden });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle balance hiding:', err);
    }
  };

  const isInitialLoading = isLoading && !stats;

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">Overview</h2>
          <p className="text-xs text-slate-400">Financial health & cash flow</p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl bg-[#141b2a] hover:bg-[#1b253b] border border-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-400' : ''} />
        </button>
      </div>

      {/* Balance Summary Card (True Net Worth + Inflow + Outflow) */}
      {isInitialLoading ? (
        <BalanceOverviewSkeleton />
      ) : (
        stats && (
          <BalanceOverview
            summary={stats.summary}
            scopeName={currentScopeObj.name}
            scopeColor={currentScopeObj.color}
          />
        )
      )}

      {/* Scope Breakdown Comparison (Personal vs Office funds) */}
      {isInitialLoading ? (
        <ScopeBreakdownSkeleton />
      ) : (
        stats &&
        stats.scopeBreakdown &&
        stats.scopeBreakdown.length > 0 && (
          <ScopeFundsBreakdown
            scopes={stats.scopeBreakdown}
            selectedScope={selectedScope}
            onSelectScope={onSelectScope}
          />
        )
      )}

      {/* Payment Sources / Accounts */}
      {isInitialLoading ? (
        <SourcePillsSkeleton />
      ) : (
        <SourcePills
          sources={sources}
          onToggleHideBalance={handleToggleHideBalance}
        />
      )}

      {/* Spending Breakdown Donut */}
      {isInitialLoading ? (
        <SpendingDonutSkeleton />
      ) : (
        stats && (
          <SpendingDonut
            categories={stats.categoryBreakdown}
            totalExpense={stats.summary.totalExpense}
          />
        )
      )}

      {/* Recent Transactions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Recent Transactions
            </h3>
            {!isInitialLoading && (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {recentTransactions.length}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onNavigateToTransactions}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {isInitialLoading ? (
          <TransactionListSkeleton count={4} />
        ) : recentTransactions.length === 0 ? (
          <div className="bg-[#131927] border border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <p className="text-xs text-slate-400">No transactions recorded yet in this scope</p>
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
            >
              <PlusCircle size={15} />
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((tx) => (
              <TransactionCard
                key={tx._id}
                transaction={tx}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
