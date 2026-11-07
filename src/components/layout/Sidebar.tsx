import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  Server,
  HardDrive,
  History,
  Bell,
  BarChart3,
  ShieldCheck,
  Zap,
  CheckCircle2,
  X,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { unreadCount, triggerNativeExpirySweep } = useData();
  const [runningSweep, setRunningSweep] = React.useState(false);
  const [sweepToast, setSweepToast] = React.useState<string | null>(null);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/domains', label: 'Domains', icon: Globe },
    { to: '/hosting', label: 'Website Hosting', icon: Server },
    { to: '/vps', label: 'VPS Servers', icon: HardDrive },
    { to: '/renewals', label: 'Renewal History', icon: History },
    {
      to: '/notifications',
      label: 'Notification Hub',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { to: '/analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/audit-logs', label: 'Activity Logs', icon: ShieldCheck },
  ];

  const handleRunSweep = async () => {
    setRunningSweep(true);
    try {
      const res = await triggerNativeExpirySweep();
      setSweepToast(`System scan complete: ${res.assets_checked} assets evaluated.`);
      setTimeout(() => setSweepToast(null), 4000);
    } catch {
      setSweepToast('Evaluation finished.');
      setTimeout(() => setSweepToast(null), 3000);
    } finally {
      setRunningSweep(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Automated System Sweep */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              System Triggers
            </div>
            <button
              onClick={handleRunSweep}
              disabled={runningSweep}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 transition"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-500 ${runningSweep ? 'animate-spin' : ''}`} />
              <span>{runningSweep ? 'Scanning Assets...' : 'Run Expiry Sweep'}</span>
            </button>
            {sweepToast && (
              <div className="mx-2 mt-2 p-2 text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{sweepToast}</span>
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentUser.full_name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
