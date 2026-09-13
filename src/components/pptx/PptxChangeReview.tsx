import React, { useState } from 'react';
import { PptxSlideChange } from '../../types';
import { Presentation, ShieldCheck, CheckCircle2, RefreshCw, AlertTriangle, Eye, Lock } from 'lucide-react';

interface PptxChangeReviewProps {
  slides: PptxSlideChange[];
  onApproveSlide: (slideId: string) => void;
}

export const PptxChangeReview: React.FC<PptxChangeReviewProps> = ({ slides, onApproveSlide }) => {
  const [selectedSlideId, setSelectedSlideId] = useState<string>(slides[0]?.id || 'pptx-1');
  const activeSlide = slides.find((s) => s.id === selectedSlideId) || slides[0];

  return (
    <div className="space-y-6">
      {/* Preservation Rule Banner */}
      <div className="bg-indigo-900 text-white p-5 rounded-xl border border-indigo-800 shadow-md flex items-start space-x-3 text-xs">
        <Lock className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white text-sm">PPTX Minimal-Change Preservation Rule</h4>
          <p className="mt-0.5 text-indigo-200 leading-relaxed">
            If the existing presentation template is already acceptable, <strong>DO NOT REDESIGN IT</strong>. Theme, slide master, layout, fonts, colors, charts, tables, and branding elements are strictly preserved. Only project-specific TOR text and data are modified.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Slide Selector Tree */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-2 mb-2">
            Slide Deck Change Plan ({slides.length})
          </h4>
          <div className="space-y-1">
            {slides.map((s) => {
              const isSelected = s.id === selectedSlideId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSlideId(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">Slide {s.slideNumber}: {s.proposedTitle}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {s.changeType === 'no_change' ? 'Preserved' : 'Updated'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Slide Change Detail Inspector */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Slide {activeSlide.slideNumber}: {activeSlide.proposedTitle}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">Original: {activeSlide.originalTitle}</p>
              </div>

              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded border border-emerald-200 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Change Plan Approved
              </span>
            </div>

            {/* Preservation Metrics Checklist */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Preserved Master Elements Status:
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px] font-mono font-bold">
                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-emerald-700 text-center">✓ Theme</span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-emerald-700 text-center">✓ Layout</span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-emerald-700 text-center">✓ Fonts</span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-emerald-700 text-center">✓ Colors</span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-emerald-700 text-center">✓ Images</span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-emerald-700 text-center">✓ Spacing</span>
              </div>
            </div>

            {/* Change Log List */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Modified Content Log:
              </h4>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 font-sans text-slate-800">
                {activeSlide.changesList.map((change, cIdx) => (
                  <div key={cIdx} className="flex items-start space-x-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-md shadow-xs transition-colors">
                Approve Slide Revision
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
