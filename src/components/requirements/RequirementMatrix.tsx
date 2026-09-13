import React, { useState } from 'react';
import { Requirement, RequirementCategory, RequirementStatus } from '../../types';
import { RequirementDetailDrawer } from './RequirementDetailDrawer';
import { ControlBar } from '../layout/ControlBar';
import { ChevronRight } from 'lucide-react';

interface RequirementMatrixProps {
  requirements: Requirement[];
  onUpdateRequirement: (reqId: string, comment: string) => void;
}

export const RequirementMatrix: React.FC<RequirementMatrixProps> = ({
  requirements,
  onUpdateRequirement
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch =
      req.requirementText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.aiInterpretation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.sourceFile.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || req.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const matchesMandatory = !mandatoryOnly || req.mandatory;

    return matchesSearch && matchesCategory && matchesStatus && matchesMandatory;
  });

  const getStatusDot = (status: RequirementStatus) => {
    if (status === 'READY') {
      return <span className="text-emerald-700 font-bold"><span className="mr-1 text-emerald-600">●</span> READY</span>;
    }
    if (status === 'REVIEW_REQUIRED') {
      return <span className="text-amber-700 font-bold"><span className="mr-1 text-amber-600">●</span> REVIEW REQUIRED</span>;
    }
    return <span className="text-red-700 font-bold"><span className="mr-1 text-red-600">●</span> MISSING</span>;
  };

  return (
    <div className="space-y-3">
      {/* Odoo Control Bar */}
      <ControlBar
        title="Requirement Matrix / Compliance List View"
        onSearch={setSearchQuery}
        filterOptions={['ALL', 'Eligibility', 'Technical', 'Financial', 'Administrative']}
        activeFilter={categoryFilter}
        onSelectFilter={setCategoryFilter}
      />

      {/* Filter Options Strip */}
      <div className="bg-white px-3 py-1.5 rounded border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <label className="inline-flex items-center cursor-pointer font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={mandatoryOnly}
              onChange={(e) => setMandatoryOnly(e.target.checked)}
              className="rounded border-slate-300 text-purple-800 mr-1.5"
            />
            Mandatory Criteria Only
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="READY">Ready</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="MISSING">Missing</option>
          </select>
        </div>

        <span className="font-mono text-[11px] text-slate-500">
          Showing {filteredRequirements.length} of {requirements.length} Requirements
        </span>
      </div>

      {/* Odoo List View Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse odoo-table">
            <thead>
              <tr>
                <th className="w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredRequirements.length && filteredRequirements.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredRequirements.map((r) => r.id));
                      else setSelectedIds([]);
                    }}
                    className="rounded border-slate-300 text-purple-800"
                  />
                </th>
                <th className="w-24">Category</th>
                <th>Tender Requirement & AI Interpretation</th>
                <th className="w-32 font-mono">Source</th>
                <th className="w-32">Status</th>
                <th className="w-40">Matched Evidence</th>
                <th className="w-16 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.map((req) => {
                const isSelected = selectedIds.includes(req.id);
                return (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedRequirement(req)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-purple-50/50' : ''}`}
                  >
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, req.id]);
                          else setSelectedIds(selectedIds.filter((i) => i !== req.id));
                        }}
                        className="rounded border-slate-300 text-purple-800"
                      />
                    </td>

                    <td className="font-mono font-semibold text-slate-700">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px]">
                        {req.category.substring(0, 4).toUpperCase()}
                      </span>
                    </td>

                    <td>
                      <div className="font-bold text-slate-900 text-xs">
                        {req.mandatory && <span className="text-red-600 mr-1 font-mono text-[10px]">[MANDATORY]</span>}
                        {req.requirementText}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        <span className="font-semibold text-purple-900">AI Note:</span> {req.aiInterpretation}
                      </div>
                    </td>

                    <td className="font-mono text-[11px] text-slate-600">
                      <div className="truncate font-semibold">{req.sourceFile}</div>
                      <div className="text-[10px] text-slate-400">Page {req.sourcePage}</div>
                    </td>

                    <td>{getStatusDot(req.status)}</td>

                    <td>
                      {req.evidenceFound.length > 0 ? (
                        <div className="text-[11px] text-emerald-800 font-medium truncate max-w-40">
                          ✓ {req.evidenceFound[0]}
                        </div>
                      ) : (
                        <span className="text-[11px] text-red-600 font-medium">✕ Missing Evidence</span>
                      )}
                    </td>

                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequirement(req);
                        }}
                        className="text-xs text-purple-900 font-bold hover:underline inline-flex items-center"
                      >
                        <span>Edit</span>
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Inspector */}
      <RequirementDetailDrawer
        requirement={selectedRequirement}
        isOpen={!!selectedRequirement}
        onClose={() => setSelectedRequirement(null)}
        onVerify={onUpdateRequirement}
      />
    </div>
  );
};
