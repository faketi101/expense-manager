import React, { useState, useEffect } from 'react';
import { Layers, Plus, Wallet, Eye, EyeOff, LogOut } from 'lucide-react';
import { BaseType } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToApiLoading } from '../../services/api';

interface MobileHeaderProps {
  baseTypes: BaseType[];
  selectedScope: string; // 'all' or BaseType _id
  defaultScope?: string;
  scopeBarOrder?: 'default_first' | 'all_first';
  onSelectScope: (scopeId: string) => void;
  onOpenNewScopeModal: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  baseTypes,
  selectedScope,
  defaultScope,
  scopeBarOrder = 'default_first',
  onSelectScope,
  onOpenNewScopeModal,
}) => {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToApiLoading((_count, loading) => {
      setIsSyncing(loading);
    });
    return () => unsub();
  }, []);

  // Determine active default scope id
  const defaultScopeId =
    defaultScope ||
    baseTypes.find((b) => b.isDefault)?._id ||
    baseTypes.find((b) => b.name.toLowerCase() === 'personal')?._id;

  // Sort base types so default scope is first if scopeBarOrder === 'default_first'
  const sortedBaseTypes = [...baseTypes].sort((a, b) => {
    if (scopeBarOrder === 'default_first' && defaultScopeId) {
      if (a._id === defaultScopeId) return -1;
      if (b._id === defaultScopeId) return 1;
    }
    return (a.order || 0) - (b.order || 0);
  });

  const allScopesButton = (
    <button
      key="all-scopes"
      type="button"
      onClick={() => onSelectScope('all')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
        selectedScope === 'all'
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-500'
          : 'bg-[#151c2d] hover:bg-[#1b253b] text-slate-400 border border-slate-800'
      }`}
    >
      <Layers size={14} />
      <span>All Scopes</span>
    </button>
  );

  const baseTypeButtons = sortedBaseTypes.map((scope) => {
    const isSelected = selectedScope === scope._id;
    return (
      <button
        key={scope._id}
        type="button"
        onClick={() => onSelectScope(scope._id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
          isSelected
            ? 'text-white shadow-md'
            : 'bg-[#151c2d] hover:bg-[#1b253b] text-slate-300 border-slate-800'
        }`}
        style={{
          backgroundColor: isSelected ? scope.color : undefined,
          borderColor: isSelected ? scope.color : undefined,
          boxShadow: isSelected ? `0 4px 14px ${scope.color}40` : undefined,
        }}
      >
        <DynamicIcon name={scope.icon} size={14} />
        <span>{scope.name}</span>
      </button>
    );
  });

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 safe-top">
      <div className="max-w-4xl mx-auto px-4 pt-3 pb-2.5">
        {/* App Title, Privacy Toggle & User Profile */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Wallet size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight leading-tight">
                  Expense Manager
                </h1>
                {isSyncing && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span>Syncing</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Personal & Office finances</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Privacy / Hide Balances Eye Toggle */}
            <button
              type="button"
              onClick={togglePrivacy}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                isPrivate
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-[#151c2d] hover:bg-[#1b253b] border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isPrivate ? 'Privacy Mode Active (Balances Hidden)' : 'Hide Balances'}
            >
              {isPrivate ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>

            {/* User Profile & Sign Out Dropdown */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#151c2d] hover:bg-[#1b253b] border border-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline truncate max-w-[80px]">{user.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#131927] border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800 text-xs">
                      <p className="font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Scope Selector (Personal, Office, etc.) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none -mx-4 px-4">
          {scopeBarOrder === 'all_first' ? (
            <>
              {allScopesButton}
              {baseTypeButtons}
            </>
          ) : (
            <>
              {baseTypeButtons}
              {allScopesButton}
            </>
          )}

          {/* Add New Scope Button */}
          <button
            type="button"
            onClick={onOpenNewScopeModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap text-slate-400 hover:text-slate-200 bg-[#151c2d]/60 hover:bg-[#1b253b] border border-dashed border-slate-700 transition shrink-0"
            title="Add new scope"
          >
            <Plus size={13} />
            <span>New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
