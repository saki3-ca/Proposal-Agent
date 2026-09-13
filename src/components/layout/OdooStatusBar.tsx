import React from 'react';
import { Check } from 'lucide-react';

interface OdooStatusBarProps {
  steps: { id: string; label: string }[];
  activeStepId: string;
  onSelectStep?: (stepId: string) => void;
}

export const OdooStatusBar: React.FC<OdooStatusBarProps> = ({ steps, activeStepId, onSelectStep }) => {
  const activeIndex = steps.findIndex((s) => s.id === activeStepId);

  return (
    <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center justify-between overflow-x-auto text-xs select-none">
      <div className="flex items-center space-x-1 font-semibold text-slate-600">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-2">Pipeline Stage:</span>
        <div className="flex items-center space-x-1">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <span className="text-slate-300 mx-0.5">›</span>}
                <button
                  onClick={() => onSelectStep && onSelectStep(step.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center space-x-1 whitespace-nowrap ${
                    isCurrent
                      ? 'bg-[#714B67] text-white font-bold shadow-2xs'
                      : isCompleted
                      ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isCompleted && <Check className="w-3 h-3 text-emerald-700" />}
                  <span>{step.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] font-mono text-slate-500 font-semibold shrink-0 ml-4 hidden sm:block">
        Odoo Status Workflow
      </div>
    </div>
  );
};
