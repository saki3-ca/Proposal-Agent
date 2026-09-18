import React, { useState } from 'react';
import { Project, ProposalStatus } from '../../types';
import { ProposalPreparationService } from '../../services/proposalPreparationService';
import {
  Clock,
  ArrowRight,
  AlertTriangle,
  FileCheck2,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface ActiveProjectsTableProps {
  projects: Project[];
  onNavigate: (path: string) => void;
  onNewProposal: () => void;
  onClearProposals?: () => void;
  onDeleteProposal?: (projectId: string) => void;
  onOpenProgressModal?: (project: Project) => void;
}

export const ActiveProjectsTable: React.FC<ActiveProjectsTableProps> = ({
  projects,
  onNavigate,
  onNewProposal,
  onClearProposals,
  onDeleteProposal,
  onOpenProgressModal
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'due_soon' | 'in_progress' | 'review'>('all');

  // Active proposals only: exclude Approved, Rejected, Submitted, Closed
  const isClosed = (p: Project) =>
    p.status === 'Approved' || p.status === 'Rejected' || p.status === 'Submitted';
  const activeProposals = projects.filter((p) => !isClosed(p));

  // Filter based on active tab
  const filteredProposals = activeProposals.filter((p) => {
    if (activeFilterTab === 'due_soon') {
      return (
        p.daysLeft !== undefined &&
        p.daysLeft !== null &&
        p.daysLeft >= 0 &&
        p.daysLeft <= 3
      );
    }
    if (activeFilterTab === 'in_progress') {
      return (
        p.status === 'In Progress' ||
        p.status === 'Draft' ||
        p.processingState?.status === 'preparing'
      );
    }
    if (activeFilterTab === 'review') {
      return p.status === 'Under Review';
    }
    return true;
  });

  const getStatusBadge = (project: Project) => {
    const isPreparing = project.processingState?.status === 'preparing';
    if (isPreparing) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
          <Loader2 className="w-3 h-3 animate-spin text-amber-600 shrink-0" />
          <span>Preparing</span>
        </span>
      );
    }

    const status = project.status;
    switch (status) {
      case 'Draft':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Draft
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#1B2A6B] border border-blue-200">
            In Progress
          </span>
        );
      case 'Under Review':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            Review
          </span>
        );
      case 'Not Started':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Not Started
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  const renderStageOrProgress = (project: Project) => {
    const isPreparing = project.processingState?.status === 'preparing';
    if (isPreparing) {
      const pct = project.processingState?.progressPercent || 25;
      const remainingSec = project.processingState?.estimatedRemainingSeconds;
      const remainingLabel = ProposalPreparationService.formatEstimatedTime(remainingSec);

      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-bold text-slate-900 text-xs font-mono">
              Preparing • {pct}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {remainingLabel}
          </div>
        </div>
      );
    }

    if (project.processingState?.status === 'completed') {
      return (
        <div className="flex items-center space-x-1 text-xs text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate max-w-[150px]">Proposal Ready</span>
        </div>
      );
    }

    if (project.processingState?.currentStage) {
      return (
        <div className="text-xs text-slate-700 font-medium truncate max-w-[150px]" title={project.processingState.currentStage}>
          {project.processingState.currentStage}
        </div>
      );
    }

    // Default stage display based on status
    if (project.status === 'Draft') return <span className="text-xs text-slate-600">Drafting</span>;
    if (project.status === 'Under Review') return <span className="text-xs text-slate-600">Compliance Review</span>;
    return <span className="text-xs text-slate-600">Ready</span>;
  };

  const handleRowClick = (project: Project) => {
    if (project.processingState?.status === 'preparing' && onOpenProgressModal) {
      onOpenProgressModal(project);
    } else {
      onNavigate(`/projects/${project.id}`);
    }
  };

  return (
    <div className="bg-white rounded border border-[#E2E8F0] shadow-2xs overflow-hidden font-sans">
      {/* Section Header & Filter Tabs */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
        <div>
          <h2 className="text-sm font-bold text-[#1B2A6B] uppercase tracking-wider font-mono">
            YOUR PROPOSALS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active tenders requiring drafting, evidence matching, or review
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5">
          <div className="inline-flex rounded border border-[#CBD5E1] p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setActiveFilterTab('all')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeFilterTab === 'all'
                  ? 'bg-[#1B2A6B] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({activeProposals.length})
            </button>
            <button
              onClick={() => setActiveFilterTab('due_soon')}
              className={`px-3 py-1 rounded font-semibold transition-colors flex items-center space-x-1 ${
                activeFilterTab === 'due_soon'
                  ? 'bg-[#8B1420] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-red-700'
              }`}
            >
              <span>Due Soon</span>
              {activeProposals.filter((p) => p.daysLeft !== undefined && p.daysLeft !== null && p.daysLeft >= 0 && p.daysLeft <= 3).length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-100 text-red-800 text-[10px] rounded font-bold">
                  {activeProposals.filter((p) => p.daysLeft !== undefined && p.daysLeft !== null && p.daysLeft >= 0 && p.daysLeft <= 3).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilterTab('in_progress')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeFilterTab === 'in_progress'
                  ? 'bg-[#1B2A6B] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveFilterTab('review')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeFilterTab === 'review'
                  ? 'bg-[#1B2A6B] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Review
            </button>
          </div>

          {onClearProposals && projects.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all proposals to start fresh?')) {
                  onClearProposals();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
              title="Clear proposal list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Responsive Proposals Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F0] text-slate-600 text-[11px] font-bold uppercase tracking-wider font-mono">
              <th className="py-2.5 px-4 min-w-[220px] max-w-[340px]">Proposal</th>
              <th className="py-2.5 px-3 min-w-[140px] max-w-[200px]">Client</th>
              <th className="py-2.5 px-3 w-28 whitespace-nowrap">Type</th>
              <th className="py-2.5 px-3 w-28 whitespace-nowrap">Deadline</th>
              <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Days Left</th>
              <th className="py-2.5 px-3 min-w-[160px]">Progress / Stage</th>
              <th className="py-2.5 px-3 w-28 whitespace-nowrap">Status</th>
              <th className="py-2.5 px-4 w-24 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProposals.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400 italic">
                  <div className="space-y-2">
                    <p>No active proposals found in this view.</p>
                    <button
                      onClick={onNewProposal}
                      className="inline-flex items-center space-x-1 text-xs text-[#1B2A6B] font-bold underline hover:text-[#152152]"
                    >
                      <span>Create or upload a proposal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProposals.map((p) => {
                const isUrgent =
                  p.daysLeft !== undefined &&
                  p.daysLeft !== null &&
                  p.daysLeft >= 0 &&
                  p.daysLeft <= 3;

                return (
                  <tr
                    key={p.id}
                    onClick={() => handleRowClick(p)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      isUrgent ? 'bg-red-50/20 hover:bg-red-50/40' : ''
                    }`}
                  >
                    {/* Proposal Title */}
                    <td className="py-3 px-4 font-bold text-slate-900 hover:text-[#1B2A6B] max-w-[340px] truncate" title={p.name}>
                      <div className="flex items-center space-x-2">
                        <span className="truncate">{p.assignmentTitle || p.name}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate" title={p.client}>
                      {p.client || '—'}
                    </td>

                    {/* Tender Type */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {p.tenderType || 'Consultancy'}
                    </td>

                    {/* Deadline */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-800 whitespace-nowrap">
                      {p.submissionDeadline || '—'}
                    </td>

                    {/* Days Left */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold">
                      {p.daysLeft !== undefined && p.daysLeft !== null ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            isUrgent
                              ? 'bg-red-100 text-red-700 font-black border border-red-200'
                              : 'text-slate-700'
                          }`}
                        >
                          {isUrgent && <AlertTriangle className="w-3 h-3 inline mr-1 text-red-600" />}
                          {p.daysLeft} {p.daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Stage / Progress */}
                    <td className="py-3 px-3">
                      {renderStageOrProgress(p)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStatusBadge(p)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {onDeleteProposal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete proposal "${p.assignmentTitle || p.name}"?`)) {
                                onDeleteProposal(p.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Proposal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(p);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1B2A6B] hover:bg-[#152152] text-white rounded text-xs font-bold transition-colors shadow-2xs"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
