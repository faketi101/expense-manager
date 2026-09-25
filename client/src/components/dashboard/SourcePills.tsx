import React from 'react';
import { Source } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency } from '../../lib/colors';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { EyeOff, Eye } from 'lucide-react';

interface SourcePillsProps {
  sources: Source[];
  onSelectSource?: (sourceId: string) => void;
  onToggleHideBalance?: (source: Source) => void;
  selectedSourceId?: string;
  currency?: string;
}

export const SourcePills: React.FC<SourcePillsProps> = ({
  sources,
  onSelectSource,
  onToggleHideBalance,
  selectedSourceId,
  currency = '৳',
}) => {
  const { maskAmount } = usePrivacy();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Accounts & Sources
        </h3>
        <span className="text-[11px] text-slate-500">Live Balances</span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
        {sources.map((src) => {
          const isSelected = selectedSourceId === src._id;
          return (
            <div
              key={src._id}
              onClick={() => onSelectSource && onSelectSource(src._id)}
              className={`p-3 rounded-2xl border transition-all shrink-0 min-w-[140px] sm:min-w-[160px] cursor-pointer group ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 shadow-md'
                  : src.isBalanceHidden
                  ? 'bg-[#101522] border-slate-800/80 hover:border-slate-700'
                  : 'bg-[#131927] hover:bg-[#182133] border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: `${src.color}25`, color: src.color }}
                >
                  <DynamicIcon name={src.icon} size={15} />
                </div>
                <div className="flex items-center gap-1.5">
                  {src.accountNumber && (
                    <span className="text-[9px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {src.accountNumber}
                    </span>
                  )}
                  {onToggleHideBalance && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHideBalance(src);
                      }}
                      className={`p-1 rounded-lg transition ${
                        src.isBalanceHidden
                          ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title={
                        src.isBalanceHidden
                          ? 'Balance is hidden from Net Worth. Tap to include.'
                          : 'Tap to hide balance from Net Worth'
                      }
                    >
                      {src.isBalanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-200 truncate">{src.name}</p>
                {src.isBalanceHidden ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs font-bold text-amber-400/80 line-through">
                      {maskAmount(formatCurrency(src.currentBalance || 0, currency))}
                    </p>
                    <span className="text-[9px] text-amber-400/90 bg-amber-500/10 px-1 py-0.2 rounded font-medium">
                      Hidden
                    </span>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-white mt-0.5">
                    {maskAmount(formatCurrency(src.currentBalance || 0, currency))}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
