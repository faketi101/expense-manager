import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Palette, Image as ImageIcon, ChevronDown, ChevronUp, Tag, Loader2 } from 'lucide-react';
import { Category, BaseType } from '../../types';
import { DynamicIcon } from '../../components/common/DynamicIcon';
import { IconPickerModal } from '../../components/common/IconPickerModal';
import { ColorPickerModal } from '../../components/common/ColorPickerModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ManageListSkeleton } from '../../components/common/Skeletons';
import { formatCurrency } from '../../lib/colors';
import { api } from '../../services/api';

interface ManageCategoriesProps {
  categories: Category[];
  baseTypes: BaseType[];
  onCreate: (data: Partial<Category>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>;
  onDelete: (id: string, force?: boolean) => Promise<void>;
  onRefresh: () => void;
}

export const ManageCategories: React.FC<ManageCategoriesProps> = ({
  categories,
  baseTypes,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#f59e0b');
  const [baseTypeId, setBaseTypeId] = useState<string>('');
  const [monthlyBudget, setMonthlyBudget] = useState('0');
  const [subcategories, setSubcategories] = useState<Array<{ name: string; icon?: string; color?: string }>>([]);
  const [newSubInput, setNewSubInput] = useState('');

  // Expanded categories map for viewing subcategories
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Modals
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setType(activeTab);
    setIcon(activeTab === 'expense' ? 'Tag' : 'TrendingUp');
    setColor(activeTab === 'expense' ? '#f59e0b' : '#10b981');
    setBaseTypeId('');
    setMonthlyBudget('0');
    setSubcategories([]);
    setNewSubInput('');
    setIsEditing(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingId(category._id);
    setName(category.name);
    setType(category.type);
    setIcon(category.icon);
    setColor(category.color);
    setBaseTypeId(
      typeof category.baseTypeId === 'object' && category.baseTypeId !== null
        ? (category.baseTypeId as BaseType)._id
        : (category.baseTypeId as string) || ''
    );
    setMonthlyBudget(String(category.monthlyBudget || 0));
    setSubcategories(category.subcategories || []);
    setNewSubInput('');
    setIsEditing(true);
  };

  const handleAddSubcategoryInForm = () => {
    if (!newSubInput.trim()) return;
    setSubcategories((prev) => [
      ...prev,
      { name: newSubInput.trim(), icon, color },
    ]);
    setNewSubInput('');
  };

  const handleRemoveSubcategoryInForm = (idx: number) => {
    setSubcategories((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      type,
      icon,
      color,
      baseTypeId: baseTypeId ? baseTypeId : null,
      monthlyBudget: parseFloat(monthlyBudget) || 0,
      subcategories,
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

  const handleDeleteSubcategoryDirect = async (catId: string, subId: string) => {
    try {
      await api.deleteSubcategory(catId, subId);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete subcategory:', err);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <div className="space-y-4">
      {/* Header & New Category Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Categories & Sub-Categories</h3>
          <p className="text-xs text-slate-400">
            Create categories with nested subcategories, icons & colors
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus size={15} />
          <span>New Category</span>
        </button>
      </div>

      {/* Expense vs Income Toggle */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#131927] rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'expense'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Expense Categories ({categories.filter((c) => c.type === 'expense').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Income Categories ({categories.filter((c) => c.type === 'income').length})
        </button>
      </div>

      {/* Categories Grid/List */}
      <div className="space-y-2">
        {filteredCategories.length === 0 ? (
          <ManageListSkeleton count={4} />
        ) : (
          filteredCategories.map((cat) => {
          const scopeObj =
            typeof cat.baseTypeId === 'object' && cat.baseTypeId !== null
              ? (cat.baseTypeId as BaseType)
              : baseTypes.find((b) => b._id === cat.baseTypeId);

          const isExpanded = !!expandedCats[cat._id];
          const subs = cat.subcategories || [];

          return (
            <div
              key={cat._id}
              className="rounded-2xl bg-[#141b2a] border border-slate-800/80 hover:border-slate-700/80 transition overflow-hidden"
            >
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    <DynamicIcon name={cat.icon} size={19} />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{cat.name}</h4>
                      {subs.length > 0 && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                          {subs.length} sub(s)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {scopeObj ? (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.2 rounded"
                          style={{ backgroundColor: `${scopeObj.color}25`, color: scopeObj.color }}
                        >
                          {scopeObj.name}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500">Global</span>
                      )}
                      {cat.monthlyBudget && cat.monthlyBudget > 0 ? (
                        <span className="text-[9px] text-slate-400">
                          • Budget: {formatCurrency(cat.monthlyBudget)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {subs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title={isExpanded ? 'Collapse' : 'View Subcategories'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Edit Category"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded Subcategories Chips */}
              {isExpanded && subs.length > 0 && (
                <div className="px-4 pb-3 pt-1 border-t border-slate-800/80 bg-[#111724]">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                    Subcategories
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {subs.map((s: any) => (
                      <span
                        key={s._id || s.name}
                        className="inline-flex items-center gap-1.5 text-xs bg-[#182032] border border-slate-700/80 px-2.5 py-1 rounded-lg text-slate-200"
                      >
                        <Tag size={11} className="text-amber-400" />
                        <span>{s.name}</span>
                        {s._id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategoryDirect(cat._id, s._id)}
                            className="text-slate-500 hover:text-rose-400 ml-1"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
      </div>

      {/* Edit / Create Form Bottom Sheet Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-[#111724] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 flex flex-col max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Supplies, Client Dinner..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 capitalize"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Scope Association
                  </label>
                  <select
                    value={baseTypeId}
                    onChange={(e) => setBaseTypeId(e.target.value)}
                    className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Scopes (Global)</option>
                    {baseTypes.map((scope) => (
                      <option key={scope._id} value={scope._id}>
                        {scope.name} Only
                      </option>
                    ))}
                  </select>
                </div>
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

              {/* Subcategories Editor */}
              <div className="p-3.5 bg-[#161e30] border border-slate-800 rounded-2xl space-y-2.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Sub-Categories
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New subcategory (e.g. Printer Paper, Coffee)..."
                    value={newSubInput}
                    onChange={(e) => setNewSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategoryInForm();
                      }
                    }}
                    className="flex-1 bg-[#1d273d] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategoryInForm}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                  >
                    Add
                  </button>
                </div>

                {/* Subcategories tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs bg-[#1d273d] border border-slate-700 px-2.5 py-1 rounded-lg text-slate-200"
                    >
                      <span>{sub.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategoryInForm(idx)}
                        className="text-slate-400 hover:text-rose-400 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {subcategories.length === 0 && (
                    <p className="text-[11px] text-slate-500 italic">No subcategories added yet</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Monthly Budget Limit (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Category'}</span>
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
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteTarget?.name}"? Transactions categorized under this will become uncategorized.`}
      />
    </div>
  );
};
