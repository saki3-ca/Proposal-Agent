import React, { useState } from 'react';
import { X, ShieldAlert, FileText } from 'lucide-react';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOverride: (reason: string) => void;
  unresolvedCount: number;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  isOpen,
  onClose,
  onConfirmOverride,
  unresolvedCount
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 z-10 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-red-600 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>Management Compliance Override</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded text-xs leading-relaxed">
          <strong>Warning:</strong> {unresolvedCount} mandatory requirement(s) are currently unresolved. Overriding this block allows final submission package generation, but requires explicit management justification which will be logged permanently in the immutable audit trail.
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">
            Override Justification & Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Specify reason (e.g., 'Tax Clearance Certificate 2024-25 expected from NBR tomorrow; submission approved by Partner')..."
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (reason.trim()) onConfirmOverride(reason);
            }}
            disabled={!reason.trim()}
            className={`px-4 py-2 font-bold text-xs rounded text-white shadow-xs ${
              reason.trim() ? 'bg-red-600 hover:bg-red-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            Confirm Override & Log Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
