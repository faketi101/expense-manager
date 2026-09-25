import React from 'react';
import { ArrowUpRight, ArrowDownRight, WalletCards, PiggyBank } from 'lucide-react';
import { StatsSummary } from '../../types';
import { formatCurrency } from '../../lib/colors';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface BalanceOverviewProps {
  summary: StatsSummary;
  scopeName?: string;
  scopeColor?: string;
  currency?: string;
}

export const BalanceOverview: React.FC<BalanceOverviewProps> = ({
  summary,
  scopeName = 'All Scopes',
  scopeColor = '#3b82f6',
  currency = '৳',
}) => {
  const { maskAmount } = usePrivacy();

  // Total funds available across accounts
  const netWorth = summary.totalNetWorth !== undefined ? summary.totalNetWorth : (summary as any).netBalance || 0;
  const netSavings = summary.netSavings !== undefined ? summary.netSavings : summary.totalIncome - summary.totalExpense;

  return (
    <div className="space-y-3">
      {/* Net Worth Master Card */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#162033] via-[#121929] to-[#0c1220] border border-slate-800 shadow-xl">
        {/* Glow accent */}
        <div
          className="absolute -right-8 -top-8 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: scopeColor }}
        />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              <WalletCards size={18} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-300">Total Available Funds</span>
              <p className="text-[10px] text-slate-500">Live sum of accounts</p>
            </div>
          </div>

          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
            style={{
              backgroundColor: `${scopeColor}20`,
              borderColor: `${scopeColor}40`,
              color: scopeColor,
            }}
          >
            {scopeName}
          </span>
        </div>

        <div className="mt-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {maskAmount(formatCurrency(netWorth, currency))}
          </h2>
        </div>

        {/* Income vs Expense vs Net Savings inside card */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight size={15} />
            </div>
            <div className="truncate">
              <p className="text-[9px] text-slate-400 uppercase font-medium">Inflow</p>
              <p className="text-xs font-bold text-emerald-400 truncate">
                {maskAmount(formatCurrency(summary.totalIncome, currency))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownRight size={15} />
            </div>
            <div className="truncate">
              <p className="text-[9px] text-slate-400 uppercase font-medium">Outflow</p>
              <p className="text-xs font-bold text-rose-400 truncate">
                {maskAmount(formatCurrency(summary.totalExpense, currency))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <PiggyBank size={15} />
            </div>
            <div className="truncate">
              <p className="text-[9px] text-slate-400 uppercase font-medium">Cashflow</p>
              <p
                className={`text-xs font-bold truncate ${
                  netSavings >= 0 ? 'text-blue-400' : 'text-rose-400'
                }`}
              >
                {netSavings > 0 ? '+' : ''}
                {maskAmount(formatCurrency(netSavings, currency))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
