import React from 'react';
import { ScopeBreakdownItem } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency } from '../../lib/colors';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface ScopeFundsBreakdownProps {
  scopes: ScopeBreakdownItem[];
  selectedScope: string;
  onSelectScope: (scopeId: string) => void;
  currency?: string;
}

export const ScopeFundsBreakdown: React.FC<ScopeFundsBreakdownProps> = ({
  scopes,
  selectedScope,
  onSelectScope,
  currency = '৳',
}) => {
  const { maskAmount } = usePrivacy();

  if (!scopes || scopes.length === 0) return null;

  const totalAllFunds = scopes.reduce((sum, s) => sum + s.totalFunds, 0);

  return (
    <div className="bg-[#131927] border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Funds by Scope
          </h3>
          <p className="text-[11px] text-slate-500">Personal vs Office cash allocation</p>
        </div>
        <span className="text-xs font-extrabold text-blue-400">
          {maskAmount(formatCurrency(totalAllFunds, currency))} Total
        </span>
      </div>

      {/* Scope Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {scopes.map((scope) => {
          const isSelected = selectedScope === scope.scopeId;
          const percentage =
            totalAllFunds > 0
              ? Math.max(0, Math.round((scope.totalFunds / totalAllFunds) * 100))
              : 0;

          return (
            <button
              key={scope.scopeId}
              type="button"
              onClick={() => onSelectScope(scope.scopeId)}
              className={`p-3.5 rounded-2xl border text-left transition relative overflow-hidden group ${
                isSelected
                  ? 'border-blue-500 bg-[#172033] shadow-md'
                  : 'bg-[#151c2d] hover:bg-[#182133] border-slate-800'
              }`}
            >
              {/* Subtle top color bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: scope.color }}
              />

              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: `${scope.color}30`, color: scope.color }}
                >
                  <DynamicIcon name={scope.icon} size={15} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                  {percentage}%
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-300 truncate">{scope.name}</p>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {maskAmount(formatCurrency(scope.totalFunds, currency))}
                </p>
              </div>

              {/* Scope Cashflow footnote */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                <span className="text-emerald-400">+{maskAmount(formatCurrency(scope.income, currency))}</span>
                <span className="text-rose-400">-{maskAmount(formatCurrency(scope.expense, currency))}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
