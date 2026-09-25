import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Palette, Image as ImageIcon, EyeOff, Eye, GripVertical, ChevronUp, ChevronDown, Divide, Check, Link2, AlertCircle, Loader2 } from 'lucide-react';
import { Source, BaseType } from '../../types';
import { DynamicIcon } from '../../components/common/DynamicIcon';
import { IconPickerModal } from '../../components/common/IconPickerModal';
import { ColorPickerModal } from '../../components/common/ColorPickerModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ManageListSkeleton } from '../../components/common/Skeletons';
import { formatCurrency } from '../../lib/colors';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { api } from '../../services/api';

interface ManageSourcesProps {
  sources: Source[];
  baseTypes: BaseType[];
  onCreate: (data: Partial<Source>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Source>) => Promise<void>;
  onDelete: (id: string, force?: boolean) => Promise<void>;
  onRefresh?: () => void;
}

export const ManageSources: React.FC<ManageSourcesProps> = ({
  sources,
  baseTypes,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}) => {
  const { maskAmount } = usePrivacy();
  const [sourceList, setSourceList] = useState<Source[]>(sources);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'hidden'>('all');

  useEffect(() => {
    setSourceList(sources);
  }, [sources]);

  const hiddenCount = useMemo(() => sourceList.filter((s) => s.isHidden).length, [sourceList]);
  const activeCount = sourceList.length - hiddenCount;

  const filteredSources = useMemo(() => {
    if (filterMode === 'active') return sourceList.filter((s) => !s.isHidden);
    if (filterMode === 'hidden') return sourceList.filter((s) => s.isHidden);
    return sourceList;
  }, [sourceList, filterMode]);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<Source['type']>('bank');
  const [icon, setIcon] = useState('Landmark');
  const [color, setColor] = useState('#0ea5e9');
  const [accountNumber, setAccountNumber] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Per-Scope Initial Balance Allocations map: { [scopeId]: amountString }
  const [scopeAllocationsMap, setScopeAllocationsMap] = useState<Record<string, string>>({});
  // Master account balance
  const [targetBalance, setTargetBalance] = useState<number>(0);
  // Auto-balance toggle (links Personal & Office so sum always matches account balance)
  const [autoBalance, setAutoBalance] = useState<boolean>(true);

  // Compute total allocated in real time in form
  const totalAllocated = Object.values(scopeAllocationsMap).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const isAllocationMismatched = targetBalance > 0 && Math.abs(totalAllocated - targetBalance) > 0.01;
  const isZeroWithFunds = targetBalance > 0 && totalAllocated === 0;
  const isInvalidAllocation = isAllocationMismatched || isZeroWithFunds;

  // Modals
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Source | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setType('bank');
    setIcon('Landmark');
    setColor('#0ea5e9');
    setAccountNumber('');
    setIsHidden(false);
    setIsBalanceHidden(false);
    setTargetBalance(0);

    // Default 0 for each scope
    const initMap: Record<string, string> = {};
    baseTypes.forEach((b) => {
      initMap[b._id] = '0';
    });
    setScopeAllocationsMap(initMap);
    setIsEditing(true);
  };

  const handleOpenEdit = (source: Source) => {
    setEditingId(source._id);
    setName(source.name);
    setType(source.type);
    setIcon(source.icon);
    setColor(source.color);
    setAccountNumber(source.accountNumber || '');
    setIsHidden(!!source.isHidden);
    setIsBalanceHidden(!!source.isBalanceHidden);

    // Prioritize initialBalance or currentBalance
    const currentBal = source.initialBalance ?? source.currentBalance ?? 0;
    setTargetBalance(currentBal);

    const defaultScope = baseTypes.find((b) => b.isDefault) || baseTypes[0];

    // Fill allocations
    const map: Record<string, string> = {};
    let existingAllocSum = 0;

    baseTypes.forEach((b) => {
      const existing = source.scopeAllocations?.find(
        (a: any) => (a.baseTypeId?._id || a.baseTypeId)?.toString() === b._id.toString()
      );
      const amt = existing ? Number(existing.amount) || 0 : 0;
      existingAllocSum += amt;
      map[b._id] = existing ? String(existing.amount) : '0';
    });

    // BUG FIX: If allocations were empty or sum to 0, but account has funds (> 0),
    // automatically assign full balance to the default scope (Personal) so it is never 0!
    if (existingAllocSum === 0 && currentBal > 0 && defaultScope) {
      map[defaultScope._id] = String(currentBal);
    }

    setScopeAllocationsMap(map);
    setIsEditing(true);
  };

  // Changing the master account balance automatically scales / splits across scopes
  const handleTotalBalanceChange = (newTotalVal: number) => {
    const validTotal = Math.max(0, isNaN(newTotalVal) ? 0 : newTotalVal);
    setTargetBalance(validTotal);

    if (baseTypes.length === 0) return;

    if (validTotal === 0) {
      const zeroMap: Record<string, string> = {};
      baseTypes.forEach((b) => {
        zeroMap[b._id] = '0';
      });
      setScopeAllocationsMap(zeroMap);
      return;
    }

    const defaultScope = baseTypes.find((b) => b.isDefault) || baseTypes[0];

    // If current allocations have a positive sum, scale proportionally
    if (totalAllocated > 0) {
      const ratio = validTotal / totalAllocated;
      const newMap: Record<string, string> = {};
      let runningSum = 0;
      baseTypes.forEach((b, idx) => {
        if (idx === baseTypes.length - 1) {
          const finalVal = Math.max(0, Math.round((validTotal - runningSum) * 100) / 100);
          newMap[b._id] = String(finalVal);
        } else {
          const currentVal = parseFloat(scopeAllocationsMap[b._id]) || 0;
          const scaled = Math.round(currentVal * ratio * 100) / 100;
          newMap[b._id] = String(scaled);
          runningSum += scaled;
        }
      });
      setScopeAllocationsMap(newMap);
    } else {
      // Put entire balance into default scope (Personal)
      const newMap: Record<string, string> = {};
      baseTypes.forEach((b) => {
        newMap[b._id] = b._id === defaultScope._id ? String(validTotal) : '0';
      });
      setScopeAllocationsMap(newMap);
    }
  };

  // Editing a scope: if autoBalance is ON and there are 2 scopes, editing one automatically balances the other!
  const handleScopeAllocationChange = (scopeId: string, newAmountStr: string) => {
    const newAmount = Math.max(0, parseFloat(newAmountStr) || 0);

    if (autoBalance && baseTypes.length === 2 && targetBalance > 0) {
      const otherScope = baseTypes.find((b) => b._id !== scopeId);
      if (otherScope) {
        // If user typed more than targetBalance, expand targetBalance
        let effectiveTarget = targetBalance;
        if (newAmount > targetBalance) {
          effectiveTarget = newAmount;
          setTargetBalance(newAmount);
        }
        const remainder = Math.max(0, Math.round((effectiveTarget - newAmount) * 100) / 100);
        setScopeAllocationsMap({
          [scopeId]: newAmountStr,
          [otherScope._id]: String(remainder),
        });
        return;
      }
    }

    setScopeAllocationsMap((prev) => ({
      ...prev,
      [scopeId]: newAmountStr,
    }));
  };

  const handleAssignAllToScope = (scopeId: string) => {
    const amountToAssign = targetBalance > 0 ? targetBalance : totalAllocated;
    const newMap: Record<string, string> = {};
    baseTypes.forEach((b) => {
      newMap[b._id] = b._id === scopeId ? String(amountToAssign) : '0';
    });
    setScopeAllocationsMap(newMap);
  };

  const handleSplitEvenly = () => {
    const amountToSplit = targetBalance > 0 ? targetBalance : totalAllocated;
    if (baseTypes.length === 0 || amountToSplit <= 0) return;
    const count = baseTypes.length;
    const splitAmount = Math.floor((amountToSplit / count) * 100) / 100;
    const remainder = Math.round((amountToSplit - splitAmount * (count - 1)) * 100) / 100;

    const newMap: Record<string, string> = {};
    baseTypes.forEach((b, idx) => {
      newMap[b._id] = String(idx === 0 ? remainder : splitAmount);
    });
    setScopeAllocationsMap(newMap);
  };

  const handleAutoBalance = () => {
    if (baseTypes.length === 0 || targetBalance <= 0) return;
    const defaultScope = baseTypes.find((b) => b.isDefault) || baseTypes[0];
    const otherAllocationsSum = Object.entries(scopeAllocationsMap).reduce((sum, [id, val]) => {
      return id === defaultScope._id ? sum : sum + (parseFloat(val) || 0);
    }, 0);

    const remainder = Math.max(0, Math.round((targetBalance - otherAllocationsSum) * 100) / 100);
    setScopeAllocationsMap((prev) => ({
      ...prev,
      [defaultScope._id]: String(remainder),
    }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const draggedItem = filteredSources[draggedIndex];
    const targetItem = filteredSources[dropIndex];
    if (!draggedItem || !targetItem) return;

    const fromIndex = sourceList.findIndex((s) => s._id === draggedItem._id);
    const toIndex = sourceList.findIndex((s) => s._id === targetItem._id);
    if (fromIndex === -1 || toIndex === -1) return;

    const updated = [...sourceList];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    setSourceList(updated);
    setDraggedIndex(null);

    try {
      await api.reorderSources(updated.map((s) => s._id));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to reorder sources:', err);
    }
  };

  const handleMoveItem = async (indexInFiltered: number, direction: 'up' | 'down') => {
    const item = filteredSources[indexInFiltered];
    if (!item) return;
    const realIndex = sourceList.findIndex((s) => s._id === item._id);
    if (realIndex === -1) return;

    const targetRealIndex = direction === 'up' ? realIndex - 1 : realIndex + 1;
    if (targetRealIndex < 0 || targetRealIndex >= sourceList.length) return;

    const updated = [...sourceList];
    const [moved] = updated.splice(realIndex, 1);
    updated.splice(targetRealIndex, 0, moved);

    setSourceList(updated);
    try {
      await api.reorderSources(updated.map((s) => s._id));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to reorder sources:', err);
    }
  };

  const handleToggleHideBalance = async (source: Source) => {
    try {
      await onUpdate(source._id, { isBalanceHidden: !source.isBalanceHidden });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to toggle balance hiding:', err);
    }
  };

  const handleToggleHideAccount = async (source: Source) => {
    try {
      await onUpdate(source._id, { isHidden: !source.isHidden });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to toggle account visibility:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isInvalidAllocation) {
      return;
    }

    // Build scopeAllocations array
    let allocations = Object.entries(scopeAllocationsMap).map(([scopeId, amtStr]) => ({
      baseTypeId: scopeId,
      amount: parseFloat(amtStr) || 0,
    }));

    let totalInitial = allocations.reduce((sum, a) => sum + a.amount, 0);

    // Safeguard: If account had a balance (> 0) and user left allocations at 0 unintentionally:
    if (editingId && targetBalance > 0 && totalInitial === 0 && baseTypes.length > 0) {
      const defaultScope = baseTypes.find((b) => b.isDefault) || baseTypes[0];
      allocations = baseTypes.map((b) => ({
        baseTypeId: b._id,
        amount: b._id === defaultScope._id ? targetBalance : 0,
      }));
      totalInitial = targetBalance;
    }

    const payload = {
      name: name.trim(),
      type,
      icon,
      color,
      initialBalance: totalInitial,
      scopeAllocations: allocations,
      accountNumber: accountNumber.trim(),
      isHidden,
      isBalanceHidden,
    };

    try {
      setIsSubmitting(true);
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await onDelete(deleteTarget._id, true);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Payment Sources & Accounts</h3>
          <p className="text-xs text-slate-400">
            Bank, Mobile Banking, Cash, Savings with Scope Balance allocations
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus size={15} />
          <span>New Source</span>
        </button>
      </div>

      {/* Filter Tabs & Status Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#182032] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({sourceList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filterMode === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#182032] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('hidden')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterMode === 'hidden'
                ? 'bg-amber-600 text-white shadow-sm'
                : hiddenCount > 0
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-[#182032] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <EyeOff size={12} />
            <span>Hidden ({hiddenCount})</span>
          </button>
        </div>

        {hiddenCount > 0 && filterMode !== 'hidden' && (
          <p className="text-[11px] text-amber-400/80 hidden sm:block">
            {hiddenCount} account{hiddenCount > 1 ? 's' : ''} hidden from overview
          </p>
        )}
      </div>

      {/* List of Sources */}
      <div className="space-y-2">
        {sourceList.length === 0 ? (
          <ManageListSkeleton count={3} />
        ) : filteredSources.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#141b2a] border border-slate-800/80">
            <p className="text-xs text-slate-400">
              {filterMode === 'hidden'
                ? 'No hidden accounts found.'
                : filterMode === 'active'
                ? 'No active accounts found.'
                : 'No payment sources or accounts created yet.'}
            </p>
          </div>
        ) : (
          filteredSources.map((source, index) => (
          <div
            key={source._id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`p-3 sm:p-3.5 rounded-2xl border transition flex items-center justify-between gap-2 sm:gap-3 ${
              draggedIndex === index
                ? 'opacity-40 border-blue-500 bg-blue-500/10'
                : source.isBalanceHidden || source.isHidden
                ? 'bg-[#111724]/80 border-slate-800/80 hover:border-slate-700'
                : 'bg-[#141b2a] border-slate-800/80 hover:border-slate-700/80'
            }`}
          >
            {/* Left: Reorder Controls + Icon + Details */}
            <div className="flex items-center gap-2 sm:gap-3 truncate flex-1 min-w-0">
              {/* Drag Handle & Move Up/Down Controls */}
              <div className="flex items-center gap-0.5 shrink-0">
                <div
                  className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300 p-0.5 touch-none"
                  title="Drag to reposition account"
                >
                  <GripVertical size={16} />
                </div>
                <div className="flex flex-col -space-y-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveItem(index, 'up')}
                    className="p-0.5 rounded text-slate-500 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition"
                    title="Move account up"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={index === filteredSources.length - 1}
                    onClick={() => handleMoveItem(index, 'down')}
                    className="p-0.5 rounded text-slate-500 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition"
                    title="Move account down"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>

              {/* Account Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: `${source.color}25`, color: source.color }}
              >
                <DynamicIcon name={source.icon} size={20} />
              </div>

              {/* Account Details */}
              <div className="truncate flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white truncate">{source.name}</h4>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {source.type.replace('_', ' ')}
                  </span>
                  {source.isBalanceHidden && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded font-medium">
                      <EyeOff size={10} /> Balance Excluded
                    </span>
                  )}
                  {source.isHidden && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                      <EyeOff size={10} /> Hidden from Overview
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <p
                    className={`text-xs font-extrabold ${
                      source.isBalanceHidden ? 'text-amber-400/80 line-through' : 'text-slate-200'
                    }`}
                  >
                    {maskAmount(formatCurrency(source.currentBalance || 0))}
                  </p>
                  {source.accountNumber && (
                    <span className="text-[10px] text-slate-400 truncate">• {source.accountNumber}</span>
                  )}
                </div>

                {/* Scope allocations breakdown pills */}
                {source.scopeAllocations && source.scopeAllocations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {source.scopeAllocations.map((alloc: any, aIdx: number) => {
                      const btName = alloc.baseTypeId?.name || alloc.baseTypeId;
                      const btColor = alloc.baseTypeId?.color || '#3b82f6';
                      const allocAmt = alloc.amount || 0;
                      return (
                        <span
                          key={aIdx}
                          className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-[#182032] border border-slate-700/60 text-slate-300"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: btColor }}
                          />
                          <span className="text-slate-400 font-medium">{btName}:</span>
                          <span className="font-bold text-slate-200">
                            {maskAmount(formatCurrency(allocAmt))}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Toggle Balance Hide, Unhide/Edit, Delete */}
            <div className="flex items-center gap-1 shrink-0">
              {source.isHidden && (
                <button
                  type="button"
                  onClick={() => handleToggleHideAccount(source)}
                  className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-300 cursor-pointer"
                  title="Account is hidden from overview. Click to unhide."
                >
                  <Eye size={13} />
                  <span>Unhide</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleToggleHideBalance(source)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                  source.isBalanceHidden
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-[#182032] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title={
                  source.isBalanceHidden
                    ? 'Balance is excluded from Net Worth. Tap to include.'
                    : 'Tap to hide balance from Net Worth'
                }
              >
                {source.isBalanceHidden ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>

              <button
                type="button"
                onClick={() => handleOpenEdit(source)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Edit Source"
              >
                <Edit2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => setDeleteTarget(source)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Delete Source"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))
      )}
      </div>

      {/* Edit / Create Form Bottom Sheet Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-[#111724] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 flex flex-col max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingId ? 'Edit Payment Source' : 'Add New Payment Source'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. City Bank, bKash, Cash in Wallet..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Account Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 capitalize"
                >
                  <option value="bank">Bank Account</option>
                  <option value="mobile_banking">Mobile Banking (bKash, Nagad, etc.)</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="savings">Savings / Reserve</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="other">Other Account</option>
                </select>
              </div>

              {/* Icon & Color Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Icon</label>
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#182032] border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-200 transition"
                  >
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={icon} size={16} color={color} />
                      <span className="truncate">{icon}</span>
                    </div>
                    <ImageIcon size={14} className="text-slate-400" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Color</label>
                  <button
                    type="button"
                    onClick={() => setIsColorPickerOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#182032] border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-200 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate uppercase">{color}</span>
                    </div>
                    <Palette size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Scope Balance Allocations (Personal vs Office!) */}
              <div className="p-3.5 bg-[#161e30] border border-slate-800 rounded-2xl space-y-3">
                {/* Account Total Balance Input (Master Balance) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                      Total Account Balance
                    </label>
                    <span className="text-[11px] text-slate-400">Total balance to split across scopes</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-sm">৳</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={targetBalance === 0 ? '' : targetBalance}
                      onChange={(e) => handleTotalBalanceChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#111724] border border-blue-500/50 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-extrabold focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30"
                    />
                  </div>
                </div>

                {/* Auto-Balance Toggle & Allocated Total */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setAutoBalance(!autoBalance)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      autoBalance
                        ? 'bg-blue-600/25 border-blue-500/40 text-blue-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                    title={autoBalance ? 'Linked auto-balance is ON. Changing one scope automatically balances the other.' : 'Auto-balance is OFF.'}
                  >
                    <Link2 size={12} className={autoBalance ? 'text-blue-400' : 'text-slate-500'} />
                    <span>Auto-Balance Linked: {autoBalance ? 'ON' : 'OFF'}</span>
                  </button>

                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-400">
                      Allocated: {formatCurrency(totalAllocated)}
                    </span>
                  </div>
                </div>

                {/* Quick Split Toolbar */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Quick Split:</span>
                  <button
                    type="button"
                    onClick={handleSplitEvenly}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Divide size={11} />
                    Split Evenly
                  </button>
                  {baseTypes.map((bt) => (
                    <button
                      key={bt._id}
                      type="button"
                      onClick={() => handleAssignAllToScope(bt._id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: bt.color }}
                      />
                      All to {bt.name}
                    </button>
                  ))}
                </div>

                {/* Scope input rows */}
                <div className="space-y-2">
                  {baseTypes.map((scope) => {
                    const scopeVal = parseFloat(scopeAllocationsMap[scope._id]) || 0;
                    const pct = totalAllocated > 0 ? Math.round((scopeVal / totalAllocated) * 100) : 0;

                    return (
                      <div
                        key={scope._id}
                        className="flex items-center justify-between gap-3 p-2.5 bg-[#1d273d] rounded-xl border border-slate-700/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <DynamicIcon name={scope.icon} size={15} color={scope.color} />
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {scope.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold bg-[#161e30] px-1.5 py-0.5 rounded border border-slate-700/40">
                            {pct}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleAssignAllToScope(scope._id)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium transition cursor-pointer"
                            title={`Assign all balance to ${scope.name}`}
                          >
                            100%
                          </button>
                          <span className="text-xs text-slate-400 font-bold">৳</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={scopeAllocationsMap[scope._id] || '0'}
                            onChange={(e) => handleScopeAllocationChange(scope._id, e.target.value)}
                            className="w-24 bg-[#161e30] border border-slate-600 rounded-lg px-2 py-1 text-xs text-right text-white font-bold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status reminder if targetBalance > 0 */}
                {isAllocationMismatched && (
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-300 font-medium">
                      ৳ {Math.abs(targetBalance - totalAllocated).toFixed(2)} {targetBalance > totalAllocated ? 'unallocated' : 'exceeds total'}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-semibold transition cursor-pointer"
                    >
                      Auto-Balance
                    </button>
                  </div>
                )}
                {!isAllocationMismatched && targetBalance > 0 && (
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                    <Check size={13} />
                    <span>100% of ৳ {formatCurrency(targetBalance)} split across scopes</span>
                  </div>
                )}
              </div>

              {/* Account Number Note */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Account Identifier / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Account number, card last 4 digits..."
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Hide Balance from Net Worth Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hideBalanceCheck"
                  checked={isBalanceHidden}
                  onChange={(e) => setIsBalanceHidden(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-[#182032] border-slate-700"
                />
                <label htmlFor="hideBalanceCheck" className="text-xs text-slate-300">
                  Hide balance from Net Worth (Exclude from total balance calculations)
                </label>
              </div>

              {/* Hide from Overview Toggle */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="hideSourceCheck"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-[#182032] border-slate-700"
                />
                <label htmlFor="hideSourceCheck" className="text-xs text-slate-300">
                  Hide entire account from overview (Private / Inactive Account)
                </label>
              </div>

              {/* Validation message if invalid or mismatched */}
              {isInvalidAllocation && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>
                      {isZeroWithFunds
                        ? `Allocations cannot be ৳ 0.00 when balance is ৳ ${formatCurrency(targetBalance)}.`
                        : `Allocations (৳ ${formatCurrency(totalAllocated)}) must match total balance (৳ ${formatCurrency(targetBalance)}).`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-bold transition cursor-pointer shrink-0"
                  >
                    Auto-Balance
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInvalidAllocation || isSubmitting}
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 ${
                    isInvalidAllocation || isSubmitting
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700'
                      : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
                  }`}
                  title={isInvalidAllocation ? 'Please allocate all funds across scopes before saving' : undefined}
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Source'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pickers */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        selectedIcon={icon}
        onSelectIcon={setIcon}
        color={color}
      />

      <ColorPickerModal
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        selectedColor={color}
        onSelectColor={setColor}
      />

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Source"
        message={`Are you sure you want to delete source "${deleteTarget?.name}"? Linked transactions will be permanently affected.`}
      />
    </div>
  );
};
