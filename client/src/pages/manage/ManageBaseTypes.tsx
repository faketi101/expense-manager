import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Palette,
  Image as ImageIcon,
  Loader2,
  Star,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BaseType } from '../../types';
import { DynamicIcon } from '../../components/common/DynamicIcon';
import { IconPickerModal } from '../../components/common/IconPickerModal';
import { ColorPickerModal } from '../../components/common/ColorPickerModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ManageListSkeleton } from '../../components/common/Skeletons';

interface ManageBaseTypesProps {
  baseTypes: BaseType[];
  defaultScope?: string;
  scopeBarOrder?: 'default_first' | 'all_first';
  onSetDefaultScope?: (scopeId: string) => Promise<void>;
  onSetScopeBarOrder?: (order: 'default_first' | 'all_first') => Promise<void>;
  onCreate: (data: Partial<BaseType>) => Promise<void>;
  onUpdate: (id: string, data: Partial<BaseType>) => Promise<void>;
  onDelete: (id: string, force?: boolean) => Promise<void>;
}

export const ManageBaseTypes: React.FC<ManageBaseTypesProps> = ({
  baseTypes,
  defaultScope,
  scopeBarOrder = 'default_first',
  onSetDefaultScope,
  onSetScopeBarOrder,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Modals for Icon & Color pickers
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Confirm delete modal
  const [deleteTarget, setDeleteTarget] = useState<BaseType | null>(null);

  // Active default scope: either defaultScope prop, or BaseType marked isDefault, or 'personal'
  const activeDefaultId =
    defaultScope ||
    baseTypes.find((b) => b.isDefault)?._id ||
    baseTypes.find((b) => b.name.toLowerCase() === 'personal')?._id ||
    'all';

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setIcon('Folder');
    setColor('#3b82f6');
    setDescription('');
    setIsDefault(false);
    setIsEditing(true);
  };

  const handleOpenEdit = (scope: BaseType) => {
    setEditingId(scope._id);
    setName(scope.name);
    setIcon(scope.icon);
    setColor(scope.color);
    setDescription(scope.description || '');
    setIsDefault(scope.isDefault);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingId) {
        await onUpdate(editingId, {
          name: name.trim(),
          icon,
          color,
          description: description.trim(),
          isDefault,
        });
      } else {
        await onCreate({
          name: name.trim(),
          icon,
          color,
          description: description.trim(),
          isDefault,
        });
      }
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSetDefault = async (scopeId: string) => {
    if (!onSetDefaultScope || isSettingDefault) return;
    try {
      setIsSettingDefault(true);
      await onSetDefaultScope(scopeId);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await onDelete(deleteTarget._id, true);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Default View & What Shows First Control Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141b2a] border border-blue-500/20 shadow-lg shadow-blue-500/5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles size={15} />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Default Scope & Initial View
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select which scope opens first by default when launching the application.
            </p>
          </div>
        </div>

        {/* Scope Options Selector Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {/* Base Types (Personal, Office, etc.) */}
          {baseTypes.map((scope) => {
            const isCurrentDefault = activeDefaultId === scope._id;
            return (
              <button
                key={scope._id}
                type="button"
                disabled={isSettingDefault}
                onClick={() => handleQuickSetDefault(scope._id)}
                className={`p-3 rounded-xl border flex flex-col items-start gap-2 text-left transition-all ${
                  isCurrentDefault
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-[#182032] hover:bg-[#1e283e] border-slate-700/70 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${scope.color}25`, color: scope.color }}
                  >
                    <DynamicIcon name={scope.icon} size={15} />
                  </div>
                  {isCurrentDefault && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                      <Star size={10} className="fill-blue-400" />
                      Default
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block truncate">{scope.name}</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {isCurrentDefault ? 'Opens on app launch' : 'Set as default'}
                  </span>
                </div>
              </button>
            );
          })}

          {/* All Scopes Option */}
          <button
            type="button"
            disabled={isSettingDefault}
            onClick={() => handleQuickSetDefault('all')}
            className={`p-3 rounded-xl border flex flex-col items-start gap-2 text-left transition-all ${
              activeDefaultId === 'all'
                ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                : 'bg-[#182032] hover:bg-[#1e283e] border-slate-700/70 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Layers size={15} />
              </div>
              {activeDefaultId === 'all' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                  <Star size={10} className="fill-blue-400" />
                  Default
                </span>
              )}
            </div>
            <div>
              <span className="text-xs font-bold block truncate">All Scopes</span>
              <span className="text-[10px] text-slate-400 block truncate">
                {activeDefaultId === 'all' ? 'Opens on app launch' : 'Combined overview'}
              </span>
            </div>
          </button>
        </div>

        {/* 2. Top Bar Arrangement Toggle */}
        {onSetScopeBarOrder && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Scope Bar Arrangement</span>
              <span className="text-[11px] text-slate-400 block">
                Choose which scope appears first on the left in the top navigation bar.
              </span>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#101522] rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => onSetScopeBarOrder('default_first')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  scopeBarOrder === 'default_first'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Default Scope First
              </button>
              <button
                type="button"
                onClick={() => onSetScopeBarOrder('all_first')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  scopeBarOrder === 'all_first'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Scopes First
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. List of Base Types & Customization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Manage All Scopes</h3>
            <p className="text-xs text-slate-400">
              Customize names, icons, colors, or create new financial scopes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus size={15} />
            <span>New Scope</span>
          </button>
        </div>

        {/* List of Base Types */}
        <div className="space-y-2">
          {baseTypes.length === 0 ? (
            <ManageListSkeleton count={3} />
          ) : (
            baseTypes.map((scope) => {
              const isCurrentDefault = activeDefaultId === scope._id;
              return (
                <div
                  key={scope._id}
                  className={`p-3.5 rounded-2xl bg-[#141b2a] border transition flex items-center justify-between gap-3 ${
                    isCurrentDefault
                      ? 'border-blue-500/40 shadow-sm'
                      : 'border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${scope.color}25`, color: scope.color }}
                    >
                      <DynamicIcon name={scope.icon} size={20} />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{scope.name}</h4>
                        {isCurrentDefault && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 size={10} />
                            Default on Launch
                          </span>
                        )}
                      </div>
                      {scope.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {scope.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Make Default Star Button */}
                    <button
                      type="button"
                      disabled={isSettingDefault}
                      onClick={() => handleQuickSetDefault(scope._id)}
                      className={`p-2 rounded-xl transition ${
                        isCurrentDefault
                          ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                          : 'text-slate-500 hover:text-amber-300 hover:bg-slate-800'
                      }`}
                      title={isCurrentDefault ? 'Active default scope' : 'Make this default scope'}
                    >
                      <Star size={15} className={isCurrentDefault ? 'fill-amber-400' : ''} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(scope)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit Scope"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(scope)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete Scope"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit / Create Form Bottom Sheet Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-[#111724] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 flex flex-col space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingId ? 'Edit Scope / Base Type' : 'Create New Scope'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Scope Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal, Office, Freelance..."
                  value={name}
                  disabled={isSubmitting}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Icon & Color Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Icon</label>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsIconPickerOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#182032] border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-200 transition disabled:opacity-50"
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
                    disabled={isSubmitting}
                    onClick={() => setIsColorPickerOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-[#182032] border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-200 transition disabled:opacity-50"
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

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Short note about this scope..."
                  value={description}
                  disabled={isSubmitting}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#182032] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultScopeCheck"
                  checked={isDefault}
                  disabled={isSubmitting}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-[#182032] border-slate-700 disabled:opacity-50"
                />
                <label htmlFor="defaultScopeCheck" className="text-xs text-slate-300">
                  Set as default scope for new transactions and startup
                </label>
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
                  <span>
                    {isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Scope'}
                  </span>
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
        title="Delete Scope"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Linked transactions will be permanently affected.`}
      />
    </div>
  );
};
