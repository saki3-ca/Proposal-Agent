import React from 'react';
import { Project } from '../../types';

interface DashboardKpisProps {
  projects: Project[];
  onNavigate: (path: string) => void;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({ projects }) => {
  const isClosed = (p: Project) => p.status === 'Approved' || p.status === 'Rejected';
  
  const total = projects.length;
  const active = projects.filter((p) => !isClosed(p));
  const submitted = projects.filter((p) => p.status === 'Submitted').length;
  const inProgress = projects.filter((p) => p.status === 'In Progress').length;

  const dueSoon = projects.filter((p) => {
    const days = p.daysLeft;
    return (
      p.status !== 'Submitted' &&
      p.status !== 'Approved' &&
      p.status !== 'Rejected' &&
      p.status !== 'On Hold' &&
      days !== undefined &&
      days !== null &&
      days >= 0 &&
      days <= 3
    );
  }).length;

  const pills = [
    { label: 'ACTIVE PROPOSAL', value: String(active.length).padStart(2, '0'), color: 'border-[#8B1420] text-[#8B1420]' },
    { label: 'TOTAL PROPOSAL', value: String(total).padStart(2, '0'), color: 'border-slate-400 text-slate-800' },
    { label: 'SUBMITTED PROPOSAL', value: String(submitted).padStart(2, '0'), color: 'border-blue-700 text-blue-800' },
    { label: 'IN-PROGRESS', value: String(inProgress).padStart(2, '0'), color: 'border-amber-600 text-amber-800' },
    { label: 'DUE SOON (0-3 DAYS)', value: String(dueSoon).padStart(2, '0'), color: 'border-red-600 text-red-600 font-bold' }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {pills.map((pill, idx) => (
        <div
          key={idx}
          className={`bg-white border-2 ${pill.color} rounded-lg p-3 text-center shadow-2xs flex flex-col items-center justify-center`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono">
            {pill.label}
          </div>
          <div className="text-2xl font-black font-mono mt-1">
            {pill.value}
          </div>
        </div>
      ))}
    </div>
  );
};
