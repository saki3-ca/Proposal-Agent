import React, { useState } from 'react';
import { Building2, Lock, Mail, LogIn } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('SAKIB');
  const [password, setPassword] = useState('999666');
  const [role, setRole] = useState<UserRole>('Proposal Manager');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }

    if (username.toUpperCase() !== 'SAKIB' || password !== '999666') {
      // Allow flexible authentication while providing exact user confirmation
      if (password !== '999666') {
        setError('Invalid password. Default password for SAKIB is 999666.');
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: User = {
        id: 'usr-sakib',
        email: 'sakib@acnabin.com',
        name: 'SAKIB',
        role,
        department: 'Audit & Advisory Division',
        avatarInitials: 'SK'
      };
      onLogin(user);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-xs">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#26292E] p-6 text-white text-center border-b border-slate-800 space-y-2">
          <div className="w-12 h-12 rounded bg-[#714B67] flex items-center justify-center text-white mx-auto shadow-md font-bold text-sm">
            AC
          </div>
          <div className="space-y-0.5">
            <h1 className="text-base font-extrabold tracking-tight">ACNABIN Proposal Agent</h1>
            <p className="text-[11px] text-slate-400 font-mono">Tender & Proposal Tracker Platform</p>
          </div>
        </div>

        {/* Login Form Sheet */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">ERP User Authentication</h2>
            <p className="text-[11px] text-slate-500">Sign in with authorized credentials</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="SAKIB"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900 focus:border-[#714B67]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="999666"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:border-[#714B67]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
            >
              <option value="Proposal Manager">Proposal Manager (Full Controls)</option>
              <option value="Admin">System Administrator</option>
              <option value="Reviewer">Compliance Reviewer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#714B67] hover:bg-[#51304A] text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center justify-center space-x-1.5 mt-2"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In as SAKIB</span>
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
            Default Credentials: Username: <strong>SAKIB</strong> | Password: <strong>999666</strong>
          </div>
        </form>
      </div>
    </div>
  );
};
