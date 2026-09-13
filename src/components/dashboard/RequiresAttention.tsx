import React from 'react';
import { ShieldAlert, ArrowUpRight, AlertOctagon, Clock, CheckCircle2 } from 'lucide-react';
import { AttentionItem } from '../../types';

interface RequiresAttentionProps {
  items: AttentionItem[];
  onNavigate: (path: string) => void;
}

export const RequiresAttention: React.FC<RequiresAttentionProps> = ({ items, onNavigate }) => {
  return (
    <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
      {/* Table Header Strip */}
      <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-[#714B67]" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Requires Attention — Operational Action Queue ({items.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Sorted by Severity & Deadline</span>
      </div>

      {/* Odoo Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse odoo-table">
          <thead>
            <tr>
              <th className="w-8 text-center">Sev</th>
              <th>Action Item & Description</th>
              <th>Client / Project</th>
              <th className="w-28">Deadline</th>
              <th className="w-24 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onNavigate(item.actionPath)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="text-center font-mono font-bold">
                  {item.severity === 'critical' ? (
                    <span className="text-red-600">●</span>
                  ) : item.severity === 'warning' ? (
                    <span className="text-amber-600">●</span>
                  ) : (
                    <span className="text-blue-600">●</span>
                  )}
                </td>

                <td>
                  <div className="font-bold text-slate-900 text-xs">{item.title}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                </td>

                <td>
                  <span className="font-semibold text-slate-800">{item.client}</span>
                  <div className="text-[10px] text-slate-500 truncate">{item.projectName}</div>
                </td>

                <td className="font-mono text-[11px] text-amber-700 font-semibold">{item.deadline}</td>

                <td className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(item.actionPath);
                    }}
                    className="btn-odoo-primary text-[11px] py-0.5 px-2"
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
