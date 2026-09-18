import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeProjectsCount?: number;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  activeProjectsCount
}) => {
  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'WORK',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        {
          path: '/projects',
          label: 'Active Projects',
          icon: Briefcase,
          badge: activeProjectsCount !== undefined && activeProjectsCount > 0 ? String(activeProjectsCount) : undefined
        }
      ]
    },
    {
      title: 'KNOWLEDGE',
      items: [
        { path: '/document-library', label: 'Document Library', icon: FolderKanban }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside
      className={`bg-[#1B2A6B] text-slate-100 flex flex-col border-r border-[#152152] transition-all duration-200 z-20 select-none ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Module Title Header */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-[#152152] bg-[#152152]/60 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 font-mono">
            PROPOSAL WORKBENCH
          </span>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-[#152152] transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-2 text-[10px] font-bold text-teal-200/70 tracking-wider uppercase font-mono mb-1">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center px-2.5 py-2 rounded text-xs font-semibold transition-colors group relative ${
                    isActive
                      ? 'bg-[#1D8C8C] text-white font-bold shadow-2xs'
                      : 'text-slate-200 hover:bg-[#152152] hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${collapsed ? 'mx-auto' : 'mr-2.5'} ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                  
                  {!collapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span
                      className={`ml-auto px-1.5 py-0.2 text-[9px] font-mono font-bold rounded text-white ${
                        item.badgeColor || 'bg-[#152152]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse Toggle when Collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-[#152152] text-center">
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-[#152152] transition-colors mx-auto"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
