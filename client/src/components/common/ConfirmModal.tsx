import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const busy = isLoading || isSubmitting;

  const handleConfirmClick = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch {
      // Allow parent error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#131927] border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isDanger ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              <AlertTriangle size={22} />
            </div>
            <h3 className="font-semibold text-slate-100 text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={busy}
            className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition shadow-sm flex items-center gap-2 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
            } disabled:opacity-50 disabled:pointer-events-none`}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
