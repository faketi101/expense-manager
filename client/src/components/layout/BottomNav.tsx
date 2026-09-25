import React from 'react';
import { LayoutDashboard, ReceiptText, Plus, PieChart, Sliders } from 'lucide-react';

export type NavTab = 'dashboard' | 'transactions' | 'analytics' | 'manage';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenQuickAdd,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f1422]/95 backdrop-blur-lg border-t border-slate-800/80 safe-bottom">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Dashboard Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'dashboard'
              ? 'text-blue-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'scale-110' : ''} />
          <span className="text-[10px] mt-1 tracking-tight">Overview</span>
        </button>

        {/* Transactions Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'transactions'
              ? 'text-blue-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ReceiptText size={20} className={activeTab === 'transactions' ? 'scale-110' : ''} />
          <span className="text-[10px] mt-1 tracking-tight">History</span>
        </button>

        {/* FAB Quick Add Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-2 border-[#0b0f19] transition-transform"
            aria-label="Add transaction"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* Analytics Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('analytics')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'analytics'
              ? 'text-blue-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart size={20} className={activeTab === 'analytics' ? 'scale-110' : ''} />
          <span className="text-[10px] mt-1 tracking-tight">Analytics</span>
        </button>

        {/* Manage Settings Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('manage')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'manage'
              ? 'text-blue-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders size={20} className={activeTab === 'manage' ? 'scale-110' : ''} />
          <span className="text-[10px] mt-1 tracking-tight">Manage</span>
        </button>
      </div>
    </nav>
  );
};
