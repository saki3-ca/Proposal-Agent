import React from 'react';
import { PrescribedForm } from '../../types';
import { FileText, CheckCircle2, AlertCircle, Eye, Download, Edit3, ShieldCheck } from 'lucide-react';

interface PrescribedFormsProps {
  forms: PrescribedForm[];
}

export const PrescribedForms: React.FC<PrescribedFormsProps> = ({ forms }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900">Prescribed Client Forms & Declarations</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Populates mandatory client forms, annexures, and declarations using verified Knowledge Base credentials. Original client templates are never overwritten.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forms.map((form) => (
          <div key={form.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                  {form.formNumber} • Page {form.sourcePage}
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1">{form.formName}</h4>
              </div>

              {form.status === 'verified' ? (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded border border-emerald-200 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Populated & Verified
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded border border-amber-200 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  {form.signatureStatus}
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Fields Populated:</span>
                <span className="font-bold text-slate-900">{form.populatedFieldsCount} / {form.totalFieldsCount} Fields</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Signature Requirement:</span>
                <span className="font-bold text-slate-900">{form.signatureRequired ? 'Authorized Partner Signature' : 'None'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button className="text-indigo-600 font-semibold flex items-center space-x-1 hover:underline">
                <Eye className="w-3.5 h-3.5" />
                <span>View Original</span>
              </button>
              <button className="text-indigo-600 font-semibold flex items-center space-x-1 hover:underline">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Review Data</span>
              </button>
              <button className="px-3 py-1 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded flex items-center space-x-1 transition-colors">
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
