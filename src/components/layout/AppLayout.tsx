import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../../types';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  activeProjectName?: string;
  activeProjectsCount?: number;
  currentUser: User | null;
  onLogout: () => void;
  onQuickAnalyzeTor?: () => void;
  onGlobalUpload?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  activeProjectName,
  activeProjectsCount,
  currentUser,
  onLogout,
  onQuickAnalyzeTor,
  onGlobalUpload,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#212529] font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeProjectsCount={activeProjectsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          currentPath={currentPath}
          onNavigate={onNavigate}
          activeProjectName={activeProjectName}
          currentUser={currentUser}
          onLogout={onLogout}
          onQuickAnalyzeTor={onQuickAnalyzeTor}
          onGlobalUpload={onGlobalUpload}
        />
        <main className="flex-1 p-4 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
