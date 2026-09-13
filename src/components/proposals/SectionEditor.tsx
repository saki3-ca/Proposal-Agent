import React, { useState } from 'react';
import { ProposalSection } from '../../types';
import { Sparkles, FileText, CheckCircle2, RefreshCw, Layers, ShieldCheck, ChevronRight } from 'lucide-react';
import { AiService } from '../../services/aiService';

interface SectionEditorProps {
  sections: ProposalSection[];
  onSaveSection: (updatedSection: ProposalSection) => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({ sections, onSaveSection }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || 'sec-1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActionSummary, setLastActionSummary] = useState<string>('');

  const currentSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  const handleAiAction = async (action: 'improve' | 'shorten' | 'expand' | 'check_compliance' | 'regenerate') => {
    if (!currentSection) return;
    setIsProcessing(true);
    try {
      const res = await AiService.processSectionAction(action, currentSection.content);
      const updated: ProposalSection = {
        ...currentSection,
        content: res.content,
        confidence: res.confidence,
        lastModified: new Date().toLocaleString()
      };
      onSaveSection(updated);
      setLastActionSummary(res.changesSummary);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left: Section Tree Menu */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-2 mb-2">
          Proposal Sections
        </h4>
        <div className="space-y-1">
          {sections.map((sec) => {
            const isSelected = sec.id === selectedSectionId;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {sec.status === 'approved' ? '✓' : 'Draft'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Active Section Editor */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{currentSection.title}</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Last modified: {currentSection.lastModified} • AI Confidence: {(currentSection.confidence * 100).toFixed(0)}%
              </p>
            </div>

            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] rounded border border-indigo-200 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              AI Drafted (Evidence Grounded)
            </span>
          </div>

          {/* AI Contextual Actions Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-700">Contextual AI Assistant Actions:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleAiAction('improve')}
                disabled={isProcessing}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded shadow-2xs transition-colors"
              >
                ✨ Improve Tone
              </button>
              <button
                onClick={() => handleAiAction('shorten')}
                disabled={isProcessing}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded shadow-2xs transition-colors"
              >
                ✂ Shorten
              </button>
              <button
                onClick={() => handleAiAction('expand')}
                disabled={isProcessing}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded shadow-2xs transition-colors"
              >
                ➕ Expand Methodology
              </button>
              <button
                onClick={() => handleAiAction('check_compliance')}
                disabled={isProcessing}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded shadow-2xs transition-colors"
              >
                🛡 Check TOR Compliance
              </button>
              <button
                onClick={() => handleAiAction('regenerate')}
                disabled={isProcessing}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded shadow-2xs transition-colors"
              >
                🔄 Regenerate Draft
              </button>
            </div>
          </div>

          {lastActionSummary && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs">
              ✓ <strong>AI Update:</strong> {lastActionSummary}
            </div>
          )}

          {/* Section Content Textarea */}
          <div>
            <textarea
              value={currentSection.content}
              onChange={(e) =>
                onSaveSection({ ...currentSection, content: e.target.value, lastModified: new Date().toLocaleString() })
              }
              rows={12}
              className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-sans text-slate-900 leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Evidence Sources Citation Bar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Grounded Sources & Traceability Links ({currentSection.sourcesUsed.length}):
            </h4>
            <div className="space-y-1">
              {currentSection.sourcesUsed.map((src, i) => (
                <div key={i} className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-slate-900">✓ {src.name}</span>
                  <span className="font-mono text-slate-500">{src.type} • Page {src.page}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button className="px-5 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-md shadow-xs transition-colors">
              Approve & Lock Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
