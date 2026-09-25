import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      style={style}
      className={`bg-slate-800/70 rounded-xl animate-shimmer relative overflow-hidden ${className}`}
    />
  );
};

// Net Worth / Balance Summary Card Skeleton
export const BalanceOverviewSkeleton: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#162033] via-[#121929] to-[#0c1220] border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <div className="mt-2 py-1">
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-xl shrink-0" />
            <div className="space-y-1 w-full">
              <Skeleton className="h-2 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Scope Funds Breakdown Skeleton
export const ScopeBreakdownSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl bg-[#131927] border border-slate-800/80 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Payment Account Pills Skeleton
export const SourcePillsSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 rounded-2xl bg-[#141b2a] border border-slate-800/80 min-w-[140px] space-y-2 shrink-0"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="w-3.5 h-3.5 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Spending Donut Chart Skeleton
export const SpendingDonutSkeleton: React.FC = () => {
  return (
    <div className="bg-[#131927] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        {/* Donut Circle placeholder */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full border-8 border-slate-800/70 animate-shimmer" />
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
            <Skeleton className="h-2 w-8" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>

        {/* Categories items list */}
        <div className="w-full space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-2.5 h-2.5 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Single Transaction Card Skeleton
export const TransactionCardSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 rounded-2xl bg-[#141b2a] border border-slate-800/80 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 truncate">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-1.5 truncate">
          <Skeleton className="h-3.5 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-14 rounded-md" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  );
};

// Transaction List Skeleton
export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Analytics Page Skeleton
export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Bar Chart Skeleton */}
      <div className="bg-[#131927] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="h-56 w-full flex items-end justify-between gap-3 px-2 pt-6">
          {[40, 70, 55, 85, 60, 75].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-1 h-full">
                <Skeleton
                  className="w-1/2 rounded-t-md"
                  style={{ height: `${height}%` } as React.CSSProperties}
                />
                <Skeleton
                  className="w-1/2 rounded-t-md"
                  style={{ height: `${Math.max(20, height - 20)}%` } as React.CSSProperties}
                />
              </div>
              <Skeleton className="h-2 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Donut Skeleton */}
      <SpendingDonutSkeleton />

      {/* Category Ranks Skeleton */}
      <div className="bg-[#131927] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
        <Skeleton className="h-3 w-36" />
        <div className="space-y-3 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-7 h-7 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Manage Items List Skeleton (for Scopes, Accounts, Categories)
export const ManageListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 rounded-2xl bg-[#141b2a] border border-slate-800/80 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
