import React, { useState } from 'react';
import { MOCK_EXPERTS, MOCK_COMPANY_EXPERIENCE } from '../../services/mockData';
import { ControlBar } from '../layout/ControlBar';
import { Users, Award, Database, ShieldCheck, Palette } from 'lucide-react';
import { HouseStyleViewer } from './HouseStyleViewer';

export const KnowledgeBaseView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cvs' | 'experience' | 'company' | 'legal' | 'houseStyle'>('cvs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const tabs = [
    { id: 'cvs', label: 'CV Database', icon: Users, count: MOCK_EXPERTS.length },
    { id: 'experience', label: 'Company Experience', icon: Award, count: MOCK_COMPANY_EXPERIENCE.length },
    { id: 'company', label: 'Company Profile', icon: Database, count: 4 },
    { id: 'legal', label: 'Legal & Tax Credentials', icon: ShieldCheck, count: 8 },
    { id: 'houseStyle', label: 'ACNABIN House Style', icon: Palette, count: 1 }
  ];

  return (
    <div className="space-y-3">
      {/* Odoo Control Bar */}
      <ControlBar
        title="Knowledge Base Repository / Record List View"
        onSearch={setSearchQuery}
        filterOptions={['ALL', 'CV Database', 'Company Experience', 'Legal Documents', 'ACNABIN House Style']}
      />

      {/* Odoo Sub-tabs */}
      <div className="border-b border-slate-200 flex items-center space-x-1 overflow-x-auto bg-white p-1 rounded border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 rounded transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#714B67] text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${isActive ? 'bg-[#51304A] text-white' : 'bg-slate-100 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 5: ACNABIN House Style View */}
      {activeTab === 'houseStyle' && <HouseStyleViewer />}

      {/* Tab 1: CV Database Odoo List View */}
      {activeTab === 'cvs' && (
        <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse odoo-table">
              <thead>
                <tr>
                  <th className="w-8 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === MOCK_EXPERTS.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(MOCK_EXPERTS.map((ex) => ex.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded border-slate-300 text-purple-800"
                    />
                  </th>
                  <th>Candidate Name</th>
                  <th>Designation & Role</th>
                  <th className="w-20 font-mono text-right">Years Exp</th>
                  <th>Education</th>
                  <th>Certifications</th>
                  <th className="w-24 text-right">CV Record</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_EXPERTS.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(exp.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, exp.id]);
                          else setSelectedIds(selectedIds.filter((i) => i !== exp.id));
                        }}
                        className="rounded border-slate-300 text-purple-800"
                      />
                    </td>
                    <td className="font-bold text-slate-900">{exp.name}</td>
                    <td>
                      <span className="font-semibold text-purple-900">{exp.role}</span>
                      <div className="text-[10px] text-slate-500">{exp.designation}</div>
                    </td>
                    <td className="font-mono text-right font-bold text-slate-900">{exp.yearsExperience} yrs</td>
                    <td className="text-[11px] text-slate-600">{exp.education}</td>
                    <td>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        {exp.certifications.map((c, i) => (
                          <span key={i} className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-right">
                      <button className="text-xs text-purple-900 font-bold hover:underline">View CV</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Company Experience Odoo List View */}
      {activeTab === 'experience' && (
        <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse odoo-table">
              <thead>
                <tr>
                  <th className="w-24">Sector</th>
                  <th>Assignment Title & Scope</th>
                  <th>Client</th>
                  <th className="w-32 font-mono text-right">Value</th>
                  <th className="w-32 font-mono">Completion Date</th>
                  <th className="w-36 font-mono">Evidence Doc</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COMPANY_EXPERIENCE.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="font-mono text-[10px] font-bold text-slate-700">
                      <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded">
                        {exp.sector.substring(0, 7)}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">{exp.assignmentTitle}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{exp.scope}</div>
                    </td>
                    <td className="font-semibold text-slate-800">{exp.client}</td>
                    <td className="font-mono text-right font-bold text-slate-900">{exp.contractValue}</td>
                    <td className="font-mono text-[11px] text-slate-600">{exp.endDate}</td>
                    <td className="font-mono text-[11px] text-emerald-800 font-semibold">✓ {exp.evidenceDocument}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

