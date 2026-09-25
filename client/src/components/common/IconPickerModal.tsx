import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { ICON_GROUPS, ALL_ICONS } from '../../lib/icons';
import { DynamicIcon } from './DynamicIcon';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  color?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIcon,
  onSelectIcon,
  color = '#3b82f6',
}) => {
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return ICON_GROUPS;
    const lower = search.toLowerCase();
    const matched = ALL_ICONS.filter((icon) => icon.toLowerCase().includes(lower));
    return [
      {
        category: `Search Results (${matched.length})`,
        icons: matched,
      },
    ];
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#131927] border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#161d2d]">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <DynamicIcon name={selectedIcon} size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm sm:text-base">Choose an Icon</h3>
              <p className="text-xs text-slate-400">Current: {selectedIcon}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800 bg-[#111723]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search icons (e.g. coffee, card, car)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1c2436] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Icons Grid with Categories */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-800/60">
          {filteredGroups.map((group) => (
            <div key={group.category} className="pt-3 first:pt-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                {group.category}
              </h4>
              {group.icons.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No matching icons found</p>
              ) : (
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {group.icons.map((iconName) => {
                    const isSelected = selectedIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          onSelectIcon(iconName);
                          onClose();
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition group ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/15 text-blue-400 shadow-md'
                            : 'border-slate-800/80 bg-[#172033] hover:border-slate-600 text-slate-300 hover:text-white'
                        }`}
                        title={iconName}
                      >
                        <DynamicIcon
                          name={iconName}
                          size={22}
                          className="transition-transform group-hover:scale-110"
                        />
                        <span className="text-[10px] mt-1.5 truncate w-full text-center opacity-75">
                          {iconName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
