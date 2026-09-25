import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { PRESET_COLORS } from '../../lib/colors';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  selectedColor,
  onSelectColor,
}) => {
  const [customHex, setCustomHex] = useState(selectedColor);

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    let hex = customHex.trim();
    if (!hex.startsWith('#')) hex = `#${hex}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      onSelectColor(hex);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#131927] border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full shadow-inner border border-white/20"
              style={{ backgroundColor: selectedColor }}
            />
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">Select Color</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preset Palette Grid */}
        <div>
          <label className="text-xs font-medium text-slate-400 mb-2 block uppercase tracking-wider">
            Palette Presets
          </label>
          <div className="grid grid-cols-6 gap-2.5">
            {PRESET_COLORS.map((col) => {
              const isSelected = selectedColor.toLowerCase() === col.value.toLowerCase();
              return (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => {
                    onSelectColor(col.value);
                    onClose();
                  }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md relative"
                  style={{ backgroundColor: col.value }}
                  title={col.name}
                >
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-xs">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hex Input */}
        <div className="pt-2 border-t border-slate-800">
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">
            Custom Hex Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customHex.startsWith('#') ? customHex : `#${customHex}`}
              onChange={(e) => setCustomHex(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
            />
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#3b82f6"
              maxLength={7}
              className="flex-1 bg-[#1a2234] border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 uppercase focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleApplyCustom}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition shadow"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
