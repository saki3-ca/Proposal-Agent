import React from 'react';
import { MOCK_EXPERTS } from '../../services/mockData';
import { CheckCircle2, AlertTriangle, Users, Award, ShieldCheck } from 'lucide-react';

export const ExpertMatching: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900">Expert & CV Matching Engine</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Matches team candidates against TOR staffing requirements based on post-qualification years, professional certifications, and sector experience.
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_EXPERTS.map((expert, idx) => (
          <div key={expert.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{expert.name}</h4>
                  <p className="text-[11px] text-slate-500">{expert.designation} — <span className="font-semibold text-indigo-700">{expert.role}</span></p>
                </div>
              </div>

              {/* Match Score & Badge */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-base font-extrabold text-indigo-600 font-mono">{expert.matchScore}% Match</div>
                  <div className="text-[10px] text-slate-400 font-mono">Semantic Fit Score</div>
                </div>
                <button className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-md shadow-xs transition-colors">
                  Approve Selection
                </button>
              </div>
            </div>

            {/* Match Reasons Explanation */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">AI Match Reasoning & Capabilities:</h5>
              {expert.matchReasons?.map((reason, rIdx) => (
                <div key={rIdx} className="flex items-start space-x-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
              {expert.missingSkills && expert.missingSkills.length > 0 && (
                <div className="flex items-start space-x-2 text-amber-800 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{expert.missingSkills[0]}</span>
                </div>
              )}
            </div>

            {/* Verification Status */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono">Education: {expert.education}</span>
              <span className="text-emerald-700 font-semibold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verified CV Attached ({expert.cvDocumentUrl.split('/').pop()})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
