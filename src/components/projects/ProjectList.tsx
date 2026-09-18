import React, { useState } from 'react';
import { Project, ProposalStatus, TenderType } from '../../types';
import { Plus, Search, Filter, Briefcase, ChevronRight, Edit3, Clock, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onNewProposal: () => void;
  onClearProposals?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onNewProposal, onClearProposals }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const isClosed = (p: Project) => p.status === 'Approved' || p.status === 'Rejected';

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.refNumber && p.refNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.assignedTo && p.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.manager && p.manager.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || p.tenderType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const activeProjects = filteredProjects.filter((p) => !isClosed(p));
  const nearDeadlineProjects = activeProjects
    .filter((p) => p.status !== 'Submitted' && p.status !== 'Approved' && p.status !== 'Rejected' && p.status !== 'On Hold')
    .filter((p) => p.daysLeft !== undefined && p.daysLeft !== null && p.daysLeft >= 0 && p.daysLeft <= 3)
    .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0));

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">Draft</span>;
      case 'In Progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1D8C8C]/15 text-[#1D8C8C] border border-[#1D8C8C]/30">In Progress</span>;
      case 'Submitted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">Submitted</span>;
      case 'Under Review':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B2A6B]/15 text-[#1B2A6B] border border-[#1B2A6B]/30">Under Review</span>;
      case 'On Hold':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B1420]/15 text-[#8B1420] border border-[#8B1420]/30">On Hold</span>;
      case 'Approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B1420] text-white">Rejected</span>;
      case 'Not Started':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Not Started</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-white">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Odoo Style Header Control Bar */}
      <div className="bg-white p-4 rounded border border-[#EDE7DE] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1D8C8C]" />
              <h1 className="text-base font-bold text-[#1B2A6B] uppercase tracking-wide">
                ACNABIN Active Proposal Directory
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage live tenders, submission deadlines, requirement matrices, and technical proposal drafts.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {projects.length > 0 && onClearProposals && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all proposals and start fresh?')) {
                    onClearProposals();
                  }
                }}
                className="px-3 py-2 text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-300 hover:border-red-300 rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                title="Clear all saved proposals to start fresh"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear / Start Fresh</span>
              </button>
            )}
            <button
              onClick={onNewProposal}
              className="px-4 py-2 bg-[#1D8C8C] hover:bg-[#156d6d] text-white text-xs font-bold rounded shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Proposal Project</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by proposal name, client, reference number, or manager..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1D8C8C] focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-300 px-2 py-1.5 rounded w-full sm:w-auto">
              <Filter className="w-3 h-3 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800 focus:border-[#1D8C8C]"
            >
              <option value="ALL">All Tender Types</option>
              <option value="Statutory Audit">Statutory Audit</option>
              <option value="Internal Audit">Internal Audit</option>
              <option value="Consulting">Consulting</option>
              <option value="Assurance">Assurance</option>
              <option value="Tax Advisory">Tax Advisory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Near Deadline Task Banner (0-3 Days) */}
      {nearDeadlineProjects.length > 0 && (
        <div className="space-y-0">
          <div className="bg-[#8B1420] text-white font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-t font-mono flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>NEAR DEADLINE TASK (0–3 DAYS REMAINING) ({nearDeadlineProjects.length})</span>
            </span>
            <span className="text-[10px] text-amber-200">Urgent Submission Action Required</span>
          </div>

          <div className="bg-white rounded-b border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse odoo-table table-auto">
                <thead>
                  <tr className="bg-[#1B2A6B] text-white text-[11px]">
                    <th className="w-10 text-center text-white font-mono whitespace-nowrap">SL</th>
                    <th className="min-w-[220px] max-w-[350px] text-white">Proposal Name</th>
                    <th className="min-w-[150px] max-w-[220px] text-white">Client</th>
                    <th className="w-28 text-white whitespace-nowrap">Type</th>
                    <th className="w-24 text-white whitespace-nowrap">Deadline</th>
                    <th className="w-20 text-center text-white whitespace-nowrap">Days Left</th>
                    <th className="w-28 text-white whitespace-nowrap">Assigned To</th>
                    <th className="w-28 text-white whitespace-nowrap">Status</th>
                    <th className="w-12 text-center text-white whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {nearDeadlineProjects.map((p, i) => (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProject(p.id)}
                      className="hover:bg-amber-50 cursor-pointer transition-colors bg-red-50/30"
                    >
                      <td className="text-center font-bold font-mono text-[#8B1420]">{i + 1}</td>
                      <td className="font-bold text-slate-900 max-w-[320px] truncate" title={p.name}>
                        {p.name}
                      </td>
                      <td className="text-slate-800 max-w-[200px] truncate" title={p.client}>
                        {p.client}
                      </td>
                      <td className="font-mono text-[11px] whitespace-nowrap">{p.tenderType}</td>
                      <td className="font-mono text-[11px] font-bold text-[#8B1420] whitespace-nowrap">
                        {p.submissionDeadline}
                      </td>
                      <td className="text-center font-mono font-black text-[#8B1420] whitespace-nowrap">
                        {p.daysLeft} d
                      </td>
                      <td className="font-mono text-[11px] font-semibold whitespace-nowrap">{p.assignedTo || p.manager}</td>
                      <td className="whitespace-nowrap">{getStatusBadge(p.status)}</td>
                      <td className="text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(p.id);
                          }}
                          className="p-1 text-[#1D8C8C] hover:text-[#1B2A6B] font-bold"
                          title="Open Workspace"
                        >
                          ✎
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Active Proposals Table Banner */}
      <div className="bg-[#1D8C8C] text-white font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-t text-center font-mono flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <Briefcase className="w-4 h-4 text-white" />
          <span>ACTIVE PROPOSAL PROJECTS DIRECTORY ({activeProjects.length})</span>
        </span>
        <span className="text-[10px] text-teal-100">Click Row to Open Project Workspace</span>
      </div>

      <div className="bg-white rounded-b border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse odoo-table table-auto">
            <thead>
              <tr className="bg-[#1B2A6B] text-white text-[11px]">
                <th className="w-10 text-center text-white font-mono whitespace-nowrap">SL</th>
                <th className="min-w-[220px] max-w-[340px] text-white">Proposal Name</th>
                <th className="min-w-[140px] max-w-[200px] text-white">Client</th>
                <th className="w-28 text-white whitespace-nowrap">Type</th>
                <th className="w-28 text-white whitespace-nowrap">Ref Number</th>
                <th className="w-24 text-white whitespace-nowrap">Deadline</th>
                <th className="w-16 text-center text-white whitespace-nowrap">Days</th>
                <th className="w-24 text-white whitespace-nowrap">Manager</th>
                <th className="w-28 text-white whitespace-nowrap font-mono text-center">Progress</th>
                <th className="w-28 text-white whitespace-nowrap">Status</th>
                <th className="w-12 text-center text-white whitespace-nowrap">Open</th>
              </tr>
            </thead>
            <tbody>
              {activeProjects.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-500 italic">
                    No active proposals matching search filter criteria. Click "New Proposal Project" to add.
                  </td>
                </tr>
              ) : (
                activeProjects.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className="hover:bg-teal-50/40 cursor-pointer transition-colors border-b border-slate-100"
                  >
                    <td className="text-center font-bold font-mono text-slate-700">{i + 1}</td>
                    <td className="font-semibold text-slate-900 hover:text-[#1D8C8C] max-w-[340px] truncate" title={p.name}>
                      {p.name}
                    </td>
                    <td className="text-slate-800 max-w-[200px] truncate" title={p.client}>
                      {p.client}
                    </td>
                    <td className="font-mono text-[11px] whitespace-nowrap text-slate-700">{p.tenderType}</td>
                    <td className="font-mono text-[11px] text-slate-600 whitespace-nowrap">{p.refNumber || '—'}</td>
                    <td className="font-mono text-[11px] font-bold text-amber-800 whitespace-nowrap">
                      {p.submissionDeadline}
                    </td>
                    <td className="text-center font-mono font-bold whitespace-nowrap">
                      {p.daysLeft !== undefined && p.daysLeft !== null ? (
                        <span
                          className={
                            p.status !== 'Submitted' &&
                            p.status !== 'Approved' &&
                            p.status !== 'Rejected' &&
                            p.status !== 'On Hold' &&
                            p.daysLeft >= 0 &&
                            p.daysLeft <= 3
                              ? 'text-[#8B1420] font-black'
                              : 'text-slate-800'
                          }
                        >
                          {p.daysLeft} d
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="font-mono text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                      {p.manager || p.assignedTo}
                    </td>
                    <td className="text-center font-mono text-[11px]">
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full ${p.completionPercentage === 100 ? 'bg-emerald-600' : 'bg-[#1D8C8C]'}`}
                            style={{ width: `${p.completionPercentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-[10px]">{p.completionPercentage}%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{getStatusBadge(p.status)}</td>
                    <td className="text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(p.id);
                        }}
                        className="p-1 text-[#1D8C8C] hover:text-[#1B2A6B] font-bold flex items-center justify-center mx-auto"
                        title="Open Workspace"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
