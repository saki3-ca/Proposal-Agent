import React from 'react';
import { Project } from '../../types';
import { ProposalPreparationService, PREPARATION_STAGES } from '../../services/proposalPreparationService';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
  FileCheck,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calculator,
  PackageCheck
} from 'lucide-react';

interface ProposalProgressModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onOpenWorkspace: (project: Project) => void;
  onRetry?: (project: Project) => void;
}

export const ProposalProgressModal: React.FC<ProposalProgressModalProps> = ({
  isOpen,
  project,
  onClose,
  onOpenWorkspace,
  onRetry
}) => {
  if (!isOpen || !project) return null;

  const state = project.processingState;
  const isPreparing = state?.status === 'preparing';
  const isCompleted = state?.status === 'completed';
  const isFailed = state?.status === 'failed';
  const progressPercent = state?.progressPercent || (isCompleted ? 100 : 25);

  const formatTimeStr = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-[#1B2A6B] text-white p-4 px-6 flex items-center justify-between shrink-0 border-b border-[#152152]">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                {isCompleted ? '✓ PROPOSAL READY' : isFailed ? '⚠ PREPARATION ATTENTION' : 'PREPARING YOUR PROPOSAL'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate max-w-lg">
              {project.assignmentTitle || project.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#152152] rounded text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50/50">
          {/* Metadata Subheader */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Client</span>
              <span className="font-semibold text-slate-900">{project.client || 'Procurement Client'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Deadline</span>
              <span className="font-semibold text-slate-900">{project.submissionDeadline || 'To Be Specified'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Started</span>
              <span className="font-mono text-slate-700">{formatTimeStr(state?.startedAt)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Last Updated</span>
              <span className="font-mono text-slate-700">{formatTimeStr(state?.lastUpdatedAt)}</span>
            </div>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="space-y-2 bg-white p-4 rounded border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {isCompleted
                  ? 'All 8 Preparation Stages Complete'
                  : isFailed
                  ? `Paused at: ${state?.errorStage || 'Processing Stage'}`
                  : state?.currentStage || 'Preparing proposal content...'}
              </span>
              <span className="font-mono font-bold text-[#1B2A6B] text-sm">{progressPercent}%</span>
            </div>

            {/* Solid Bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isFailed
                    ? 'bg-red-600'
                    : isCompleted
                    ? 'bg-emerald-600'
                    : 'bg-[#1D8C8C]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Estimated Remaining Time Banner */}
            {!isCompleted && !isFailed && (
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1D8C8C]" />
                  <span>
                    Estimated time remaining:{' '}
                    <strong className="text-slate-900 font-semibold">
                      {ProposalPreparationService.formatEstimatedTime(state?.estimatedRemainingSeconds)}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Auto-saved</span>
              </div>
            )}
          </div>

          {/* Checklist of Real Stages */}
          <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Workflow Stages ({isCompleted ? '8/8 Completed' : `${state?.currentStageIndex || 1}/8`})
            </h4>

            <div className="space-y-2 text-xs">
              {PREPARATION_STAGES.map((stage, idx) => {
                const isStageCompleted =
                  isCompleted ||
                  (state?.completedStages || []).includes(stage.label) ||
                  (state?.currentStageIndex || 0) > idx + 1;
                const isCurrent = isPreparing && (state?.currentStageIndex || 1) === idx + 1;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center justify-between p-2 rounded transition-colors ${
                      isCurrent
                        ? 'bg-teal-50/70 border border-teal-200 text-teal-950 font-semibold'
                        : isStageCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {isStageCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-4 h-4 text-[#1D8C8C] animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span>{stage.label}</span>
                    </div>

                    <span className="font-mono text-[10px]">
                      {isStageCompleted ? '✓ Done' : isCurrent ? 'Processing...' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Failure Alert Box */}
          {isFailed && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-900 space-y-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-bold">Proposal preparation needs attention</span>
              </div>
              <p className="text-[11px] text-red-800">
                {state?.errorMessage || 'An error occurred during stage execution. Completed work has been preserved.'}
              </p>
              {onRetry && (
                <button
                  onClick={() => onRetry(project)}
                  className="mt-2 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold transition-colors inline-flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resume & Retry Stage</span>
                </button>
              )}
            </div>
          )}

          {/* Completion Summary Box */}
          {isCompleted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm text-emerald-900">Proposal Prepared Successfully</span>
                </div>
                {state?.totalDurationSeconds && (
                  <span className="text-[11px] text-emerald-800 font-mono">
                    Completed in {Math.round(state.totalDurationSeconds / 60) || 1} min
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 bg-white rounded border border-emerald-200 text-center">
                  <FileCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-700">Technical Draft</div>
                  <div className="text-[10px] text-emerald-700 font-bold">✓ Ready</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200 text-center">
                  <Calculator className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-700">Financial Matrix</div>
                  <div className="text-[10px] text-emerald-700 font-bold">✓ Aligned</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-700">Compliance</div>
                  <div className="text-[10px] text-emerald-700 font-bold">✓ Verified</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200 text-center">
                  <PackageCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-700">Submission PKG</div>
                  <div className="text-[10px] text-emerald-700 font-bold">✓ Assembled</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-50 transition-colors"
          >
            {isCompleted ? 'Close' : 'Continue in Background'}
          </button>

          <button
            onClick={() => {
              onOpenWorkspace(project);
              onClose();
            }}
            className="px-5 py-2 bg-[#1B2A6B] hover:bg-[#152152] text-white text-xs font-bold rounded transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <span>{isCompleted ? 'Open Proposal Workspace' : 'View Proposal Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
