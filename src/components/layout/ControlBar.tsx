import React, { useState } from 'react';
import { Search, Filter, Layers, Star, Plus, Download, ChevronDown, List, FileText, Grid } from 'lucide-react';

interface ControlBarProps {
  title: string;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  filterOptions?: string[];
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
  viewMode?: 'list' | 'form' | 'grid';
  onViewModeChange?: (mode: 'list' | 'form' | 'grid') => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  title,
  onCreate,
  onSearch,
  filterOptions = [],
  activeFilter = 'ALL',
  onSelectFilter,
  viewMode = 'list',
  onViewModeChange
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
      {/* Left Action & Title Controls */}
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <h2 className="text-sm font-bold text-slate-900 mr-2 truncate">{title}</h2>

        {onCreate && (
          <button
            onClick={onCreate}
            className="btn-odoo-primary flex items-center space-x-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Proposal</span>
          </button>
        )}

        <button className="btn-odoo-secondary flex items-center space-x-1 shrink-0">
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="btn-odoo-secondary flex items-center space-x-1 shrink-0"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showFilterDropdown && filterOptions.length > 0 && (
            <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-30">
              {filterOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    if (onSelectFilter) onSelectFilter(opt);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    activeFilter === opt ? 'bg-purple-50 text-purple-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowGroupByDropdown(!showGroupByDropdown)}
          className="btn-odoo-secondary flex items-center space-x-1 shrink-0 hidden md:flex"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Group By</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        <button className="btn-odoo-secondary flex items-center space-x-1 shrink-0 hidden lg:flex">
          <Star className="w-3.5 h-3.5 text-slate-500" />
          <span>Favorites</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Right Search Input & View Switchers */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search records..."
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-700"
          />
        </div>

        {/* Odoo View Mode Switchers */}
        <div className="flex items-center border border-slate-200 rounded bg-slate-50 p-0.5 shrink-0">
          <button
            onClick={() => onViewModeChange && onViewModeChange('list')}
            className={`p-1 rounded ${viewMode === 'list' ? 'bg-white text-purple-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange && onViewModeChange('form')}
            className={`p-1 rounded ${viewMode === 'form' ? 'bg-white text-purple-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            title="Form View"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
