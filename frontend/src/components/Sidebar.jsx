import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileSearch, History, Settings, LogOut, ShieldCheck, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analyze', path: '/analyze', icon: FileSearch },
    { name: 'History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between select-none">
      <div>
        {/* Logo / Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-wider">
              UX
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">UNTRACEX</span>
              <span className="block text-[10px] text-slate-400 font-medium -mt-1 tracking-wider uppercase">Doc Sanitizer</span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User and Logout */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="mb-3 px-2">
          <div className="text-xs font-medium text-slate-800 truncate">{user?.name || 'User'}</div>
          <div className="text-[11px] text-slate-500 truncate">{user?.email || ''}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
