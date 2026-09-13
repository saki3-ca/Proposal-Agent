import React from 'react';
import { MOCK_COMPANY_EXPERIENCE } from '../../services/mockData';
import { CheckCircle2, Award, ExternalLink } from 'lucide-react';

export const ExperienceMatching: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900">Company Experience Matching</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Compares previous firm assignments against tender requirements to recommend the strongest verified project credentials.
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_COMPANY_EXPERIENCE.map((exp, idx) => (
          <div key={exp.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  #{idx + 1}
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                    {exp.sector}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{exp.assignmentTitle}</h4>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-base font-extrabold text-emerald-600 font-mono">{exp.matchScore}% Match</div>
                  <div className="text-[10px] text-slate-400 font-mono">{exp.contractValue}</div>
                </div>
                <button className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-md shadow-xs transition-colors">
                  Select Credential
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              <strong>Client:</strong> {exp.client} | <strong>Scope Alignment:</strong> {exp.scope}
            </p>

            {/* AI Reasoning List */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1 text-xs">
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Selection Rationale & Evidence:</h5>
              {exp.matchReasons?.map((reason, rIdx) => (
                <div key={rIdx} className="flex items-start space-x-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Completed: {exp.endDate}</span>
              <button className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1">
                <span>View Evidence ({exp.evidenceDocument} - Page {exp.evidencePage})</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
