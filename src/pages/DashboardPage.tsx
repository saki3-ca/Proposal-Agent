import React from 'react';
import { ActiveProjectsTable } from '../components/dashboard/ActiveProjectsTable';
import { Project, AttentionItem } from '../types';
import { Zap, ArrowRight, Briefcase, Clock, FileCheck2, Plus } from 'lucide-react';

interface DashboardPageProps {
  projects: Project[];
  attentionItems: AttentionItem[];
  onNavigate: (path: string) => void;
  onNewProposal: () => void;
  onQuickAnalyzeTor: () => void;
  onRefreshProposals: () => void;
  onClearProposals?: () => void;
  onDeleteProposal?: (projectId: string) => void;
  onOpenProgressModal?: (project: Project) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  onNavigate,
  onNewProposal,
  onQuickAnalyzeTor,
  onClearProposals,
  onDeleteProposal,
  onOpenProgressModal
}) => {
  // Filter active proposals
  const isClosed = (p: Project) =>
    p.status === 'Approved' || p.status === 'Rejected' || p.status === 'Submitted';
  const activeProposals = projects.filter((p) => !isClosed(p));

  const dueSoon = activeProposals.filter(
    (p) =>
      p.daysLeft !== undefined &&
      p.daysLeft !== null &&
      p.daysLeft >= 0 &&
      p.daysLeft <= 3
  );

  const inProgress = activeProposals.filter(
    (p) =>
      p.status === 'In Progress' ||
      p.status === 'Draft' ||
      p.status === 'Under Review' ||
      p.processingState?.status === 'preparing'
  );

  return (
    <div className="space-y-5 font-sans">
      {/* Page Title Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1B2A6B]">Dashboard</h1>
        <p className="text-xs text-slate-600 mt-0.5">Manage your tenders and proposals</p>
      </div>

      {/* Hero Banner: START A NEW PROPOSAL */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-2xs p-6 md:p-8 text-center space-y-4">
        <div className="max-w-xl mx-auto space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
            Start a new proposal
          </span>
          <p className="text-xs text-slate-600">
            Upload the TOR. The agent will read it, extract all requirements, and prepare the proposal for you.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <button
            onClick={onQuickAnalyzeTor}
            className="w-full sm:w-auto px-6 py-3 bg-[#1B2A6B] hover:bg-[#152152] text-white rounded font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 border border-[#152152]"
          >
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>⚡ UPLOAD TOR</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 pt-1">
          <span>or </span>
          <button
            onClick={onNewProposal}
            className="text-[#1B2A6B] font-bold hover:underline inline-flex items-center space-x-1"
          >
            <span>Create a proposal manually</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Useful Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Active Proposals */}
        <div
          onClick={() => onNavigate('/projects')}
          className="p-4 bg-white border border-[#E2E8F0] rounded hover:border-[#1B2A6B] cursor-pointer transition-all shadow-2xs flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase font-mono">Active Proposals</div>
            <div className="text-2xl font-bold text-[#1B2A6B] font-mono">{activeProposals.length}</div>
            <div className="text-[11px] text-slate-500">Live tenders in pipeline</div>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#1B2A6B] rounded">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Due Soon */}
        <div
          onClick={() => onNavigate('/projects')}
          className="p-4 bg-white border border-[#E2E8F0] rounded hover:border-[#8B1420] cursor-pointer transition-all shadow-2xs flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase font-mono">Due Soon (≤ 3 Days)</div>
            <div className="text-2xl font-bold text-[#8B1420] font-mono">{dueSoon.length}</div>
            <div className="text-[11px] text-slate-500">Approaching tender deadlines</div>
          </div>
          <div className="p-2.5 bg-red-50 text-[#8B1420] rounded">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress / Review */}
        <div
          onClick={() => onNavigate('/projects')}
          className="p-4 bg-white border border-[#E2E8F0] rounded hover:border-[#1D8C8C] cursor-pointer transition-all shadow-2xs flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase font-mono">In Progress / Review</div>
            <div className="text-2xl font-bold text-[#1D8C8C] font-mono">{inProgress.length}</div>
            <div className="text-[11px] text-slate-500">Under preparation & drafting</div>
          </div>
          <div className="p-2.5 bg-teal-50 text-[#1D8C8C] rounded">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Active Proposals Table */}
      <ActiveProjectsTable
        projects={projects}
        onNavigate={onNavigate}
        onNewProposal={onNewProposal}
        onClearProposals={onClearProposals}
        onDeleteProposal={onDeleteProposal}
        onOpenProgressModal={onOpenProgressModal}
      />
    </div>
  );
};
