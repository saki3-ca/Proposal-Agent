import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface OdooStatusBarProps {
  steps: { id: string; label: string }[];
  activeStepId: string;
  onSelectStep?: (stepId: string) => void;
}

export const OdooStatusBar: React.FC<OdooStatusBarProps> = ({ steps, activeStepId, onSelectStep }) => {
  const activeIndex = steps.findIndex((s) => s.id === activeStepId);

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between overflow-x-auto select-none shadow-xs">
      <div className="flex items-center space-x-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
          Stage
        </span>
        <div className="flex items-center space-x-1.5">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-0.5 shrink-0" />}
                <button
                  onClick={() => onSelectStep && onSelectStep(step.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-medium text-slate-600">Phase 6 AI Engine Active</span>
      </div>
    </div>
  );
};
