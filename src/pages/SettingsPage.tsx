import React, { useState } from 'react';
import { Settings, Sparkles, Database, ShieldCheck, Key, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [primaryAi, setPrimaryAi] = useState('gemini-1.5-pro');
  const [secondaryAi, setSecondaryAi] = useState('deepseek-r1');
  const [cacheHash, setCacheHash] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>System Settings & Modular Integration Architecture</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure server-side AI providers, document processing parameters, and Supabase security policies.
        </p>
      </div>

      {/* AI Orchestrator Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-indigo-900 font-bold border-b pb-3">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold">Modular AI Provider Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary AI Provider (Ingestion, Vision, Requirement Extraction)
            </label>
            <select
              value={primaryAi}
              onChange={(e) => setPrimaryAi(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
            >
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast Extraction)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Handles PDF vision OCR assistance, long-document extraction, and technical drafting.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Secondary AI Provider (Independent Critique & Dual-Model Audit)
            </label>
            <select
              value={secondaryAi}
              onChange={(e) => setSecondaryAi(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
            >
              <option value="deepseek-r1">DeepSeek R1 (Reasoning Engine)</option>
              <option value="deepseek-v3">DeepSeek V3 (Compliance Review)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Runs second-opinion analysis for high-risk mandatory requirements.</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1 font-mono text-slate-700">
          <p><strong>Security Note:</strong> All API keys are securely stored server-side in environment secrets (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`). Secrets are never exposed to client-side code.</p>
        </div>
      </div>

      {/* Document Caching & Processing Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold border-b pb-3">
          <RefreshCw className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold">Document Processing & Hash Caching</h3>
        </div>

        <label className="flex items-center space-x-3 cursor-pointer text-xs font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={cacheHash}
            onChange={(e) => setCacheHash(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Enable SHA-256 Document Content Hashing & Extraction Caching</span>
        </label>
        <p className="text-xs text-slate-500">
          Prevents duplicate OCR and AI analysis requests when identical TOR files or certificates are uploaded.
        </p>
      </div>
    </div>
  );
};
