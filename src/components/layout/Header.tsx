import React, { useState } from 'react';
import { Search, Bell, ChevronRight, LogOut, Upload, Zap } from 'lucide-react';
import { ATTENTION_ITEMS } from '../../services/mockData';
import { User } from '../../types';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  activeProjectName?: string;
  currentUser: User | null;
  onLogout: () => void;
  onQuickAnalyzeTor?: () => void;
  onGlobalUpload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  activeProjectName,
  currentUser,
  onLogout,
  onQuickAnalyzeTor,
  onGlobalUpload
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const getBreadcrumbs = () => {
    if (currentPath === '/') return [{ label: 'Dashboard', path: '/' }];
    if (currentPath.startsWith('/projects')) {
      const crumbs = [{ label: 'Active Projects', path: '/projects' }];
      if (activeProjectName) crumbs.push({ label: activeProjectName, path: currentPath });
      return crumbs;
    }
    if (currentPath.startsWith('/document-library')) return [{ label: 'Document Library', path: '/document-library' }];
    if (currentPath.startsWith('/settings')) return [{ label: 'Settings', path: '/settings' }];
    return [{ label: 'Home', path: '/' }];
  };

  const breadcrumbs = getBreadcrumbs();
  const unreadCount = ATTENTION_ITEMS.length;

  return (
    <header className="h-12 bg-[#1B2A6B] text-white px-4 flex items-center justify-between sticky top-0 z-30 select-none border-b border-[#152152]">
      {/* Left: App Logo & Breadcrumbs */}
      <div className="flex items-center space-x-3 text-xs">
        <div
          onClick={() => onNavigate('/')}
          className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-6 h-6 rounded bg-[#1D8C8C] flex items-center justify-center font-bold text-white text-xs shadow-2xs">
            PA
          </div>
          <span className="font-bold tracking-tight text-white text-xs hidden sm:inline">Proposal Agent Workbench</span>
        </div>

        <span className="text-slate-500">|</span>

        {/* Module Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-200">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
              <span
                onClick={() => onNavigate(crumb.path)}
                className={`cursor-pointer hover:text-white transition-colors ${
                  idx === breadcrumbs.length - 1 ? 'font-bold text-white' : ''
                }`}
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Controls: Quick Actions & User Profile */}
      <div className="flex items-center space-x-2 text-xs">
        {onQuickAnalyzeTor && (
          <button
            onClick={onQuickAnalyzeTor}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs flex items-center space-x-1 transition-colors shadow-2xs"
            title="Quickly upload & analyze a TOR without creating a full project"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">⚡ Quick Analyze TOR</span>
          </button>
        )}

        {onGlobalUpload && (
          <button
            onClick={onGlobalUpload}
            className="px-2.5 py-1 bg-[#1D8C8C] hover:bg-[#156d6d] text-white font-bold rounded text-xs flex items-center space-x-1 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Documents</span>
          </button>
        )}

        {/* Action Notifications */}
        <div className="relative pl-1">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1 text-slate-300 hover:text-white hover:bg-[#152152] rounded transition-colors relative"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#8B1420] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User Account & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-[#152152]">
          <div className="w-6 h-6 rounded bg-[#1D8C8C] text-white flex items-center justify-center font-bold text-[10px]">
            {currentUser?.avatarInitials || 'SA'}
          </div>
          <div className="hidden lg:block">
            <div className="text-slate-100 text-xs font-semibold leading-none">{currentUser?.name || 'SAKIB'}</div>
            <div className="text-[9px] text-slate-300 font-mono mt-0.5">{currentUser?.role || 'Proposal Manager'}</div>
          </div>
          <button
            onClick={onLogout}
            className="p-1 text-slate-300 hover:text-red-400 hover:bg-[#152152] rounded transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
