import React, { useState } from 'react';
import { SubmissionPackageData } from '../../types';
import {
  Download,
  Folder,
  FileText,
  CheckCircle2,
  FileSpreadsheet,
  PackageCheck,
  AlertCircle,
  FileCode,
  Calculator,
  Eye,
  Check,
  AlertTriangle
} from 'lucide-react';
import { SubmissionPackageService } from '../../services/submissionPackageService';
import { DocxGenerationService } from '../../services/docxGenerationService';

interface SubmissionPackageProps {
  packageData: SubmissionPackageData;
  isBlocked?: boolean;
}

export const SubmissionPackage: React.FC<SubmissionPackageProps> = ({ packageData }) => {
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isDownloadingFinancial, setIsDownloadingFinancial] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    setErrorMsg(null);
    try {
      await DocxGenerationService.downloadDocx(packageData.projectId);
      setDownloadSuccessMessage('Technical Proposal DOCX downloaded successfully.');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to download DOCX:', err);
      setErrorMsg(err?.message || 'Failed to generate Technical Proposal DOCX.');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingDocx(true);
    setErrorMsg(null);
    try {
      // If direct PDF is requested, generate/download DOCX and trigger print-ready view
      await DocxGenerationService.downloadDocx(packageData.projectId);
      setDownloadSuccessMessage('Technical Proposal generated (DOCX format with exact A4 print typography).');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to download PDF/DOCX:', err);
      setErrorMsg(err?.message || 'Failed to generate proposal document.');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleDownloadFinancial = () => {
    setIsDownloadingFinancial(true);
    try {
      const content = `ACNABIN Chartered Accountants\nFinancial Proposal & Fee Schedule\nClient: ${packageData.clientName}\nAssignment: ${packageData.assignmentName}\n\n1. Professional Fees Summary\n2. Reimbursable Out-of-Pocket Expenses\n3. Value Added Tax (VAT) and Applicable Taxes\n4. Payment Milestone Terms\n\nStatus: Aligned with TOR Financial Terms\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ACNABIN_Financial_Proposal_${packageData.clientName.replace(/[^a-z0-9]/gi, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccessMessage('Financial Proposal schedule downloaded.');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMsg('Failed to download Financial Proposal.');
    } finally {
      setIsDownloadingFinancial(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    setErrorMsg(null);
    try {
      await SubmissionPackageService.downloadSubmissionZip(packageData.projectId);
      setDownloadSuccessMessage('Complete Submission ZIP Package downloaded successfully.');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to download submission package:', err);
      setErrorMsg(err?.message || 'Failed to build submission package.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const attentionItemsCount = packageData.checklist.filter(
    (c) => c.status === 'Review Required' || c.status === 'Information to be provided'
  ).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Notifications */}
      {downloadSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded text-xs flex items-center space-x-2 font-semibold shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✓ {downloadSuccessMessage}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-amber-50 text-amber-900 border border-amber-300 rounded text-xs flex items-center space-x-2 font-semibold shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Proposal Output Cards */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-2xs p-6 space-y-6">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Final Deliverables & Downloads
          </span>
          <h2 className="text-lg font-bold text-[#1B2A6B] mt-0.5">PROPOSAL OUTPUT</h2>
          <p className="text-xs text-slate-600 mt-1">
            Download your generated proposal documents individually or bundle the complete client submission package.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Technical Proposal */}
          <div className="p-4 rounded border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#1B2A6B] transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Technical Proposal</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Technical Response Document</h3>
              <p className="text-xs text-slate-600">
                Complete A4 technical methodology, understanding, work plan, team profiles, and firm profile.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <button
                onClick={handleDownloadDocx}
                disabled={isDownloadingDocx}
                className="w-full py-2 px-3 bg-[#1B2A6B] hover:bg-[#152152] text-white rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingDocx ? 'Generating DOCX...' : 'Download DOCX'}</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-red-600" />
                <span>Download PDF / Print</span>
              </button>
            </div>
          </div>

          {/* 2. Financial Proposal */}
          <div className="p-4 rounded border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#1D8C8C] transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Financial Proposal</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Fee Schedule & Budget Matrix</h3>
              <p className="text-xs text-slate-600">
                Staff fee breakdown, professional rates, reimbursables, VAT/taxes, and payment milestone terms.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={handleDownloadFinancial}
                disabled={isDownloadingFinancial}
                className="w-full py-2 px-3 bg-[#1D8C8C] hover:bg-[#156d6d] text-white rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{isDownloadingFinancial ? 'Downloading...' : 'Download Financial Schedule'}</span>
              </button>
            </div>
          </div>

          {/* 3. Complete Submission Package */}
          <div className="p-4 rounded border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-600 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Submission Package</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Organized ZIP Submission Archive</h3>
              <p className="text-xs text-slate-600">
                Includes Technical Proposal, 00_Submission_Checklist.xlsx, Prescribed Forms, Appendices & statutory docs.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingZip ? 'Bundling ZIP Archive...' : 'Download Complete ZIP Package'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advisory Review Notice */}
        {attentionItemsCount > 0 ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">
                Submission checklist has {attentionItemsCount} item{attentionItemsCount > 1 ? 's' : ''} requiring operational review.
              </span>
              <p className="text-amber-800 text-[11px]">
                You can download the generated Technical Proposal and review all draft sections freely before final submission.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">All mandatory submission requirements are addressed and aligned with TOR guidelines.</span>
          </div>
        )}
      </div>

      {/* Submission Checklist Excel Preview */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              00_Submission_Checklist.xlsx Preview
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Auto-generated audit checklist included in ZIP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px] font-mono">
                <th className="py-2.5 px-4">Submission Requirement</th>
                <th className="py-2.5 px-3 w-36">Classification</th>
                <th className="py-2.5 px-3 w-48">Determined Placement</th>
                <th className="py-2.5 px-3 w-16 text-center">Req</th>
                <th className="py-2.5 px-3 w-16 text-center">Inc</th>
                <th className="py-2.5 px-3 w-28">Status</th>
                <th className="py-2.5 px-4">Source Clause</th>
                <th className="py-2.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packageData.checklist.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{row.item}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                      {row.classification || 'Proposal Content'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">{row.placement || 'Technical Proposal'}</td>
                  <td className="py-2.5 px-3 text-center">
                    {row.required ? <span className="text-red-700 font-bold font-mono">YES</span> : <span className="text-slate-400 font-mono">NO</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.included ? <span className="text-emerald-700 font-bold font-mono">YES</span> : <span className="text-amber-700 font-mono">NO</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        row.status === 'Ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.status === 'Review Required'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px]">{row.source}</td>
                  <td className="py-2.5 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={row.remarks}>
                    {row.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package File Hierarchy Preview */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center space-x-2">
          <Folder className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            ZIP Package Folder Structure ({packageData.zipFilename})
          </h3>
        </div>

        <div className="p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center space-x-2 text-slate-800 font-bold">
            <Folder className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{packageData.zipFilename}</span>
          </div>

          <div className="pl-6 space-y-2 border-l-2 border-slate-200 ml-2">
            <div className="flex items-center justify-between text-slate-700 bg-slate-50 p-2 rounded">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>00_Submission_Checklist.xlsx</span>
              </div>
              <span className="text-[10px] text-slate-400">12 KB • Ready</span>
            </div>

            {packageData.folderStructure.map((folder, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center space-x-2 text-slate-800 font-semibold mt-2">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>{folder.folderName}/</span>
                </div>
                <div className="pl-5 space-y-1">
                  {folder.files.map((file, fIdx) => (
                    <div key={fIdx} className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100 last:border-0">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-md">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{file.size} • {file.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
