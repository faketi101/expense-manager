import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  FileText,
  Check,
  Plus,
  Layers,
  Loader2,
} from 'lucide-react';
import { BaseType, Source, Category, Transaction } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { formatCurrency } from '../../lib/colors';
import { api } from '../../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Transaction>) => Promise<void>;
  transactionToEdit?: Transaction | null;
  baseTypes: BaseType[];
  sources: Source[];
  categories: Category[];
  currentScope: string;
  onCategoryUpdated?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit,
  baseTypes,
  sources,
  categories,
  currentScope,
  onCategoryUpdated,
}) => {
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedToSource, setSelectedToSource] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New subcategory inline input state
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false);

  // Live sources for the selected scope inside modal
  const [modalSources, setModalSources] = useState<Source[]>(sources);

  // Synchronize modal sources with selected scope
  useEffect(() => {
    if (!isOpen) return;
    if (selectedScope) {
      let isMounted = true;
      api.getSources(selectedScope, true)
        .then((res) => {
          if (isMounted) setModalSources(res);
        })
        .catch(() => {
          if (isMounted) setModalSources(sources);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setModalSources(sources);
    }
  }, [isOpen, selectedScope, sources]);

  // Initialize form state
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setSelectedScope(
        typeof transactionToEdit.baseTypeId === 'object'
          ? (transactionToEdit.baseTypeId as BaseType)._id
          : transactionToEdit.baseTypeId
      );
      setSelectedSource(
        typeof transactionToEdit.sourceId === 'object'
          ? (transactionToEdit.sourceId as Source)._id
          : transactionToEdit.sourceId
      );
      if (transactionToEdit.toSourceId) {
        setSelectedToSource(
          typeof transactionToEdit.toSourceId === 'object'
            ? (transactionToEdit.toSourceId as Source)._id
            : transactionToEdit.toSourceId
        );
      }
      if (transactionToEdit.categoryId) {
        setSelectedCategory(
          typeof transactionToEdit.categoryId === 'object'
            ? (transactionToEdit.categoryId as Category)._id
            : transactionToEdit.categoryId
        );
      }
      setSelectedSubcategoryId(transactionToEdit.subcategoryId ? String(transactionToEdit.subcategoryId) : '');
      setSelectedSubcategoryName(transactionToEdit.subcategoryName || '');
      setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
      setNote(transactionToEdit.note || '');
    } else {
      setType('expense');
      setAmount('');
      // Set scope: current active scope if not 'all', else first default baseType
      if (currentScope && currentScope !== 'all') {
        setSelectedScope(currentScope);
      } else if (baseTypes.length > 0) {
        const defaultScope = baseTypes.find((b) => b.isDefault) || baseTypes[0];
        setSelectedScope(defaultScope._id);
      }
      // Default source
      if (sources.length > 0) {
        setSelectedSource(sources[0]._id);
        if (sources.length > 1) {
          setSelectedToSource(sources[1]._id);
        }
      }
      // Default category - manual selection required
      setSelectedCategory('');
      setSelectedSubcategoryId('');
      setSelectedSubcategoryName('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setError(null);
    setIsAddingSubcategory(false);
  }, [isOpen, transactionToEdit, currentScope, baseTypes, sources, categories]);

  // Categories matching selected scope
  const filteredCategories = categories.filter((c) => {
    if (c.type !== type) return false;
    if (!c.baseTypeId) return true; // Global category
    const catScopeId =
      typeof c.baseTypeId === 'object' ? (c.baseTypeId as BaseType)._id : c.baseTypeId;
    return catScopeId === selectedScope;
  });

  // When selectedScope or type changes, ensure selectedCategory belongs to the scope
  useEffect(() => {
    if (type === 'transfer' || !isOpen) return;
    const available = categories.filter((c) => {
      if (c.type !== type) return false;
      if (!c.baseTypeId) return true;
      const catScopeId =
        typeof c.baseTypeId === 'object' ? (c.baseTypeId as BaseType)._id : c.baseTypeId;
      return catScopeId === selectedScope;
    });

    const isCurrentValid = available.some((c) => c._id === selectedCategory);
    if (!isCurrentValid) {
      setSelectedCategory('');
      setSelectedSubcategoryId('');
      setSelectedSubcategoryName('');
    }
  }, [selectedScope, type, categories, isOpen]);

  // Current category object & subcategories
  const currentCategoryObj = categories.find((c) => c._id === selectedCategory);
  const subcategoriesList = currentCategoryObj?.subcategories || [];

  const handleCreateSubcategoryInline = async () => {
    if (!newSubcategoryName.trim() || !selectedCategory) return;
    try {
      setIsSavingSubcategory(true);
      await api.addSubcategory(selectedCategory, {
        name: newSubcategoryName.trim(),
        icon: currentCategoryObj?.icon || 'Tag',
        color: currentCategoryObj?.color || '#3b82f6',
      });
      setSelectedSubcategoryName(newSubcategoryName.trim());
      setNewSubcategoryName('');
      setIsAddingSubcategory(false);
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to add subcategory');
    } finally {
      setIsSavingSubcategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    if (!selectedScope) {
      setError('Please select a scope (e.g. Personal or Office)');
      return;
    }

    if (!selectedSource) {
      setError('Please select a payment source');
      return;
    }

    if (type === 'transfer' && (!selectedToSource || selectedToSource === selectedSource)) {
      setError('Please select a different destination source for transfer');
      return;
    }

    if (type !== 'transfer' && !selectedCategory) {
      setError('Please select a category');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        type,
        amount: numAmount,
        date: new Date(date).toISOString(),
        baseTypeId: selectedScope, // Explicit scope assignment!
        sourceId: selectedSource,
        toSourceId: type === 'transfer' ? selectedToSource : null,
        categoryId: type !== 'transfer' ? selectedCategory : null,
        subcategoryId: type !== 'transfer' && selectedSubcategoryId ? selectedSubcategoryId : null,
        subcategoryName: type !== 'transfer' ? selectedSubcategoryName : '',
        note: note.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddAmount = (add: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + add));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#111724] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800 bg-[#151c2d]">
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:pointer-events-none transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* 1. Type Toggle: Expense / Income / Transfer */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#182032] rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setSelectedCategory('');
                setSelectedSubcategoryId('');
                setSelectedSubcategoryName('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight size={15} />
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setSelectedCategory('');
                setSelectedSubcategoryId('');
                setSelectedSubcategoryName('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight size={15} />
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                type === 'transfer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowRightLeft size={14} />
              Transfer
            </button>
          </div>

          {/* 2. Scope Selector: Personal vs Office (Front & Center!) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers size={13} className="text-blue-400" />
                Select Scope (Required)
              </label>
              <span className="text-[10px] text-slate-400">Personal or Office ledger</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {baseTypes.map((scope) => {
                const isSelected = selectedScope === scope._id;
                return (
                  <button
                    key={scope._id}
                    type="button"
                    onClick={() => {
                      setSelectedScope(scope._id);
                      setSelectedSubcategoryId('');
                      setSelectedSubcategoryName('');
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border transition ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-[#182032] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                    style={{
                      backgroundColor: isSelected ? scope.color : undefined,
                      borderColor: isSelected ? scope.color : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <DynamicIcon name={scope.icon} size={15} />
                      <span className="truncate">{scope.name}</span>
                    </div>
                    {isSelected && <Check size={14} className="shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Amount Display & Input */}
          <div className="bg-[#161e30] border border-slate-800 rounded-2xl p-4 text-center">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
              Amount
            </label>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-bold text-slate-400">৳</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-center text-3xl font-extrabold bg-transparent text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
              {[50, 100, 500, 1000, 5000].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => handleQuickAddAmount(add)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#20293d] hover:bg-[#28344e] text-slate-300 transition"
                >
                  +{add}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Payment Source Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wider">
              {type === 'transfer' ? 'From Source' : 'Payment Source / Account'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {modalSources.map((src) => {
                const isSelected = selectedSource === src._id;
                return (
                  <button
                    key={src._id}
                    type="button"
                    onClick={() => setSelectedSource(src._id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                        : 'bg-[#182032] border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${src.color}25`, color: src.color }}
                      >
                        <DynamicIcon name={src.icon} size={15} />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold truncate leading-tight">{src.name}</p>
                          {src.isHidden && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/15 text-amber-300 shrink-0">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {formatCurrency(src.currentBalance || 0)}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check size={15} className="text-blue-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Transfer: Destination Source */}
          {type === 'transfer' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block uppercase tracking-wider">
                To Destination Source
              </label>
              <div className="grid grid-cols-2 gap-2">
                {modalSources.map((src) => {
                  const isSelected = selectedToSource === src._id;
                  const isSame = selectedSource === src._id;
                  return (
                    <button
                      key={src._id}
                      type="button"
                      disabled={isSame}
                      onClick={() => setSelectedToSource(src._id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                        isSame
                          ? 'opacity-40 cursor-not-allowed bg-[#131926] border-slate-900'
                          : isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                          : 'bg-[#182032] border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${src.color}25`, color: src.color }}
                        >
                          <DynamicIcon name={src.icon} size={15} />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-semibold truncate leading-tight">{src.name}</p>
                            {src.isHidden && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/15 text-amber-300 shrink-0">
                                Hidden
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {formatCurrency(src.currentBalance || 0)}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check size={15} className="text-indigo-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Categories Grid (for Expense / Income) */}
          {type !== 'transfer' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Category (Required)
                </label>
                {!selectedCategory && (
                  <span className="text-[10px] text-amber-400 font-medium">Please select</span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 scrollbar-none">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        setSelectedSubcategoryId('');
                        setSelectedSubcategoryName('');
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/15 text-white shadow-sm'
                          : 'bg-[#182032] border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 transition-transform"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} size={15} />
                      </div>
                      <span className="text-[10px] font-medium leading-tight line-clamp-1 w-full truncate">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Sub-Categories Section (Dynamic) */}
          {type !== 'transfer' && selectedCategory && (
            <div className="p-3 bg-[#161e30] border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Sub-Category (Optional)
                </span>
                {!isAddingSubcategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingSubcategory(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus size={12} />
                    <span>New Sub</span>
                  </button>
                )}
              </div>

              {/* Sub-Category Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubcategoryId('');
                    setSelectedSubcategoryName('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    !selectedSubcategoryName
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-[#1d273d] border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  General / None
                </button>

                {subcategoriesList.map((sub: any) => {
                  const isSubSelected =
                    selectedSubcategoryId === sub._id?.toString() ||
                    selectedSubcategoryName === sub.name;
                  return (
                    <button
                      key={sub._id || sub.name}
                      type="button"
                      onClick={() => {
                        setSelectedSubcategoryId(sub._id ? sub._id.toString() : '');
                        setSelectedSubcategoryName(sub.name);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        isSubSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-[#1d273d] border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>

              {/* Inline Add Sub-Category Input */}
              {isAddingSubcategory && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    placeholder="New subcategory name..."
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    className="flex-1 bg-[#1d273d] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSubcategoryInline}
                    disabled={isSavingSubcategory || !newSubcategoryName.trim()}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 disabled:opacity-50 transition"
                  >
                    {isSavingSubcategory && <Loader2 size={12} className="animate-spin" />}
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSubcategory(false);
                      setNewSubcategoryName('');
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Date & Note Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar size={13} />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <FileText size={13} />
                Note / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch with team, Stationery bill..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            {(() => {
              const activeScopeObj = baseTypes.find((b) => b._id === selectedScope);
              const activeScopeName = activeScopeObj?.name || '';
              return (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-2xl font-bold text-white shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 ${
                    type === 'expense'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : type === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  } disabled:opacity-50 disabled:pointer-events-none`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{transactionToEdit ? 'Updating Transaction...' : 'Saving Transaction...'}</span>
                    </>
                  ) : (
                    <span>
                      {transactionToEdit
                        ? 'Update Transaction'
                        : `Save ${type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'}${
                            activeScopeName ? ` for ${activeScopeName}` : ''
                          }`}
                    </span>
                  )}
                </button>
              );
            })()}
          </div>
        </form>
      </div>
    </div>
  );
};
