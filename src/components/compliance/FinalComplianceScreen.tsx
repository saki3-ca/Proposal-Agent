import React, { useState } from 'react';
import { FinalComplianceSummary } from '../../types';
import { ShieldCheck, AlertOctagon, CheckCircle2, AlertTriangle, XCircle, Lock, ArrowUpRight } from 'lucide-react';
import { OverrideModal } from './OverrideModal';

interface FinalComplianceScreenProps {
  summary: FinalComplianceSummary;
  onNavigate: (path: string) => void;
  onOverrideConfirm: (reason: string) => void;
}

export const FinalComplianceScreen: React.FC<FinalComplianceScreenProps> = ({
  summary,
  onNavigate,
  onOverrideConfirm
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const getReadinessBadge = () => {
    if (summary.mandatoryUnresolvedCount === 0) {
      return (
        <span className="px-4 py-1.5 bg-emerald-600 text-white font-extrabold text-sm rounded-full shadow-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          READY FOR SUBMISSION
        </span>
      );
    }
    if (summary.overrides.length > 0) {
      return (
        <span className="px-4 py-1.5 bg-amber-600 text-white font-extrabold text-sm rounded-full shadow-xs flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1.5" />
          OVERRIDDEN BY MANAGEMENT
        </span>
      );
    }
    return (
      <span className="px-4 py-1.5 bg-red-600 text-white font-extrabold text-sm rounded-full shadow-xs flex items-center">
        <AlertOctagon className="w-4 h-4 mr-1.5" />
        SUBMISSION BLOCKED
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Large Score Hero Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs text-center space-y-4">
        <div className="flex justify-center">{getReadinessBadge()}</div>

        <div className="space-y-1">
          <div className="text-5xl font-black text-slate-900 font-mono tracking-tight">
            {summary.overallScorePercentage}%
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Overall Compliance & Readiness Score
          </p>
        </div>

        {/* Counter Breakdown Pill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-2">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="text-xl font-bold text-emerald-800 font-mono">{summary.satisfiedCount}</div>
            <div className="text-[11px] font-semibold text-emerald-700">Satisfied Requirements</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xl font-bold text-amber-800 font-mono">{summary.reviewRequiredCount}</div>
            <div className="text-[11px] font-semibold text-amber-700">Needs Review</div>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xl font-bold text-red-800 font-mono">{summary.missingCount}</div>
            <div className="text-[11px] font-semibold text-red-700">Missing Mandatory</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Category Compliance Breakdowns
        </h3>

        <div className="space-y-3">
          {[
            { label: 'Eligibility Requirements', score: summary.categoryScores.eligibility },
            { label: 'Technical Proposal Requirements', score: summary.categoryScores.technical },
            { label: 'Financial Guidelines & Schedule', score: summary.categoryScores.financial },
            { label: 'Administrative & Declarations', score: summary.categoryScores.administrative },
            { label: 'Prescribed Client Forms', score: summary.categoryScores.prescribedForms }
          ].map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{cat.label}</span>
                <span className="font-mono font-bold text-slate-900">{cat.score}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full ${
                    cat.score === 100 ? 'bg-emerald-500' : cat.score >= 90 ? 'bg-indigo-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Blocking Warning & Override Gate */}
      {summary.mandatoryUnresolvedCount > 0 && summary.overrides.length === 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <Lock className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-red-900">
                Submission Blocked: {summary.mandatoryUnresolvedCount} Mandatory Requirement Unresolved
              </h4>
              <p className="text-xs text-red-800 mt-0.5">
                Requirement "Valid Tax Clearance Certificate 2024-25" is missing verified KB evidence. Package generation is disabled.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigate(summary.projectId ? `/projects/${summary.projectId}/requirements` : 'requirements')}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded shadow-2xs"
            >
              Resolve Requirement
            </button>
            <button
              onClick={() => setShowOverrideModal(true)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-xs"
            >
              Management Override
            </button>
          </div>
        </div>
      )}

      {summary.overrides.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1 font-mono">
          <p className="font-bold">✓ Audit Trail Override Logged:</p>
          <p>Reason: {summary.overrides[0].reason}</p>
          <p className="text-[10px] text-amber-700">Overridden by {summary.overrides[0].overriddenBy} at {summary.overrides[0].timestamp}</p>
        </div>
      )}

      {/* Override Modal */}
      <OverrideModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        onConfirmOverride={(reason) => {
          onOverrideConfirm(reason);
          setShowOverrideModal(false);
        }}
        unresolvedCount={summary.mandatoryUnresolvedCount}
      />
    </div>
  );
};
