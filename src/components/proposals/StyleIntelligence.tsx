import React, { useState } from 'react';
import { PROPOSAL_STYLES } from '../../services/mockData';
import { ProposalStyle } from '../../types';
import { Sparkles, CheckCircle2, Layout, BookOpen, Sliders } from 'lucide-react';

interface StyleIntelligenceProps {
  onSelectStyle: (style: ProposalStyle) => void;
}

export const StyleIntelligence: React.FC<StyleIntelligenceProps> = ({ onSelectStyle }) => {
  const [selectedId, setSelectedId] = useState<string>('style-1');

  const handleSelect = (style: ProposalStyle) => {
    setSelectedId(style.id);
    onSelectStyle(style);
  };

  return (
    <div className="space-y-6">
      {/* Analysis Card Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2 text-indigo-900 font-bold">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold">Previous Proposal Style Intelligence Engine</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Analyzed 24 previous successful proposal documents from the Knowledge Base. Extracted typical heading hierarchy, tone, structural patterns, and table formatting. No manual style guide setup required.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 font-mono pt-1">
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">✓ 24 Proposals Analyzed</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">✓ Formal Audit Tone Detected</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">✓ Clause-by-Clause Compliance Tables</span>
        </div>
      </div>

      {/* Style Option Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PROPOSAL_STYLES.map((style) => {
          const isSelected = selectedId === style.id;
          return (
            <div
              key={style.id}
              onClick={() => handleSelect(style)}
              className={`bg-white rounded-xl border-2 p-5 shadow-2xs cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-indigo-600 ring-4 ring-indigo-50/60 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700">
                    {style.name}
                  </span>
                  {isSelected && (
                    <span className="text-emerald-600 font-bold text-xs flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      ACTIVE
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900">{style.title}</h4>
                <p className="text-xs text-slate-600 leading-normal">{style.description}</p>
              </div>

              <div className="space-y-2 text-[11px] text-slate-600 border-t border-slate-100 pt-3">
                <p><strong>Writing Tone:</strong> {style.tone}</p>
                <p><strong>Typical Length:</strong> {style.typicalLength}</p>
                <p><strong>Visual Layout:</strong> {style.visualStyle}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(style);
                }}
                className={`w-full py-2 text-xs font-bold rounded-md transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isSelected ? 'Selected Active Style' : 'Use This Proposal Style'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
