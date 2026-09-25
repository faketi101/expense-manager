import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryBreakdown } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency } from '../../lib/colors';

interface SpendingDonutProps {
  categories: CategoryBreakdown[];
  totalExpense: number;
}

export const SpendingDonut: React.FC<SpendingDonutProps> = ({
  categories,
  totalExpense,
}) => {
  if (!categories || categories.length === 0 || totalExpense === 0) {
    return (
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-6 text-center">
        <p className="text-xs text-slate-400">No expenses recorded for this period</p>
      </div>
    );
  }

  // Top 5 categories + others
  const topCategories = categories.slice(0, 5);
  const chartData = categories.map((cat) => ({
    name: cat.name,
    value: cat.amount,
    color: cat.color,
    icon: cat.icon,
    percentage: cat.percentage,
  }));

  return (
    <div className="bg-[#131927] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Expenses Breakdown
        </h3>
        <span className="text-xs font-bold text-rose-400">
          {formatCurrency(totalExpense)}
        </span>
      </div>

      {/* Donut Chart */}
      <div className="h-44 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={52}
              outerRadius={74}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#1a2337] border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg text-xs">
                      <p className="font-semibold text-white">{data.name}</p>
                      <p className="text-slate-300 font-bold">
                        {formatCurrency(data.value)} ({data.percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
          <span className="text-xs font-extrabold text-white">
            {formatCurrency(totalExpense)}
          </span>
        </div>
      </div>

      {/* Top Categories List with Progress Bars */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        {topCategories.map((cat) => (
          <div key={cat.categoryId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                >
                  <DynamicIcon name={cat.icon} size={12} />
                </div>
                <span className="text-slate-300 truncate font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-white">{formatCurrency(cat.amount)}</span>
                <span className="text-[10px] text-slate-400 min-w-9 text-right">
                  {cat.percentage}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.color || '#3b82f6',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
