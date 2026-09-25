import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Download } from 'lucide-react';
import { StatsResponse, BaseType } from '../types';
import { SpendingDonut } from '../components/dashboard/SpendingDonut';
import { formatCurrency } from '../lib/colors';
import { DynamicIcon } from '../components/common/DynamicIcon';
import { AnalyticsSkeleton } from '../components/common/Skeletons';

interface AnalyticsPageProps {
  stats: StatsResponse | null;
  baseTypes: BaseType[];
  selectedScope: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  stats,
  baseTypes,
  selectedScope,
  isLoading,
}) => {
  const currentScopeObj =
    selectedScope === 'all'
      ? { name: 'All Scopes', color: '#3b82f6' }
      : baseTypes.find((b) => b._id === selectedScope) || {
          name: 'Custom',
          color: '#3b82f6',
        };

  const handleExportCSV = () => {
    if (!stats || stats.categoryBreakdown.length === 0) return;
    const headers = 'Category,Amount,Percentage,Transactions\n';
    const rows = stats.categoryBreakdown
      .map((c) => `"${c.name}",${c.amount},${c.percentage}%,${c.count}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${currentScopeObj.name.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">Analytics & Trends</h2>
          <p className="text-xs text-slate-400">
            Insights for <span className="font-semibold text-slate-200">{currentScopeObj.name}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={!stats || stats.categoryBreakdown.length === 0}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#131927] hover:bg-[#182133] border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          title="Export CSV"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {isLoading && !stats ? (
        <AnalyticsSkeleton />
      ) : !stats ? (
        <div className="py-12 text-center text-xs text-slate-400">No stats available</div>
      ) : (
        <>
          {/* Monthly Comparison Bar Chart */}
          <div className="bg-[#131927] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Income vs Expense (Last 6 Months)
                </h3>
              </div>
            </div>

            <div className="h-56 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1a2337] border border-slate-700 px-3 py-2 rounded-xl shadow-xl text-xs space-y-1">
                            <p className="font-bold text-white">{label}</p>
                            {payload.map((item: any) => (
                              <p
                                key={item.dataKey}
                                className="font-semibold"
                                style={{ color: item.color }}
                              >
                                {item.name}: {formatCurrency(item.value)}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    formatter={(value) => <span className="text-slate-300 text-xs capitalize">{value}</span>}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Donut */}
          <SpendingDonut
            categories={stats.categoryBreakdown}
            totalExpense={stats.summary.totalExpense}
          />

          {/* Complete Category Distribution Ranking */}
          <div className="bg-[#131927] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Category Spending Ranks
            </h3>

            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No expenses in this scope</p>
            ) : (
              <div className="space-y-2.5 divide-y divide-slate-800/60">
                {stats.categoryBreakdown.map((cat, idx) => (
                  <div key={cat.categoryId} className="pt-2.5 first:pt-0 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-xs font-bold text-slate-500 w-4">#{idx + 1}</span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} size={15} />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate">{cat.name}</p>
                        <p className="text-[10px] text-slate-400">{cat.count} transaction(s)</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white">{formatCurrency(cat.amount)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{cat.percentage}% of total</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
