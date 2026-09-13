import React, { useState } from 'react';
import { Drawer } from '../layout/Drawer';
import { Requirement } from '../../types';
import { CheckCircle2, AlertTriangle, FileText, ExternalLink, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';

interface RequirementDetailDrawerProps {
  requirement: Requirement | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (reqId: string, comment: string) => void;
}

export const RequirementDetailDrawer: React.FC<RequirementDetailDrawerProps> = ({
  requirement,
  isOpen,
  onClose,
  onVerify
}) => {
  const [commentText, setCommentText] = useState(requirement?.reviewerComment || '');

  if (!requirement) return null;

  const handleSaveVerification = () => {
    onVerify(requirement.id, commentText);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Requirement Inspection (${requirement.category})`}
      subtitle={`Source: ${requirement.sourceFile} — Page ${requirement.sourcePage}`}
    >
      <div className="space-y-6 text-xs text-slate-800">
        {/* Status Header Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold">Category:</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-900 font-bold font-mono">
              {requirement.category}
            </span>
            {requirement.mandatory && (
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
                Mandatory Criteria
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {requirement.status === 'READY' && (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                READY
              </span>
            )}
            {requirement.status === 'REVIEW_REQUIRED' && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                REVIEW REQUIRED
              </span>
            )}
          </div>
        </div>

        {/* Full Requirement Description */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
            Exact Tender Requirement Text
          </h4>
          <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-lg font-medium text-slate-900 leading-relaxed">
            "{requirement.requirementText}"
          </div>
        </div>

        {/* AI Interpretation & Confidence */}
        <div className="p-4 bg-indigo-50/50 border border-indigo-200/80 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-indigo-900 font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Interpretation & Criteria Decomposition</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              AI Confidence: {(requirement.aiConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-slate-700 leading-normal">{requirement.aiInterpretation}</p>
        </div>

        {/* Source Traceability & Evidence Found */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Evidence Traceability & Supporting KB Documents
          </h4>
          
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-900">{requirement.sourceFile}</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-slate-600">Page {requirement.sourcePage} ({requirement.sourceSection})</span>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 hover:underline">
              <span>View Source Document</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-semibold">Matched Knowledge Base Evidence ({requirement.evidenceFound.length}):</label>
            {requirement.evidenceFound.length > 0 ? (
              requirement.evidenceFound.map((ev, idx) => (
                <div key={idx} className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded flex items-center justify-between">
                  <span className="font-medium text-emerald-900">✓ {ev}</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">VERIFIED EVIDENCE</span>
                </div>
              ))
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
                ✕ No verified evidence document currently attached in Knowledge Base. User input required.
              </div>
            )}
          </div>
        </div>

        {/* Reviewer Comment & Human Verification Controls */}
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span>Human Reviewer Feedback & Verification Sign-off</span>
          </h4>

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder="Add reviewer notes or instructions for compliance verification..."
            className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500">
              {requirement.isVerified ? (
                <span className="text-emerald-700 font-semibold flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                  Verified by {requirement.verifiedBy}
                </span>
              ) : (
                <span>Awaiting partner sign-off</span>
              )}
            </div>

            <button
              onClick={handleSaveVerification}
              className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-md shadow-xs transition-colors"
            >
              Save & Mark Requirement Verified
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
