import React, { useState } from 'react';
import {
  Database,
  Copy,
  Download,
  Check,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Server,
  RefreshCw,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { generateRestaurantDatabaseSQL, SCHEMA_VERSION } from '../../../lib/sqlGenerator';
import { VerificationResult } from '../../../lib/dataProvider';

export const AdminDatabaseSetup: React.FC = () => {
  const { data, isConnected, supabaseConfig, connectSupabase, disconnectSupabase, syncFromSupabase } =
    useRestaurant();

  const [projectUrl, setProjectUrl] = useState(supabaseConfig.projectUrl || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyReport, setVerifyReport] = useState<VerificationResult | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const generatedSql = generateRestaurantDatabaseSQL(data.profile.name);

  const handleCopySql = () => {
    navigator.clipboard.writeText(generatedSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([generatedSql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `supabase_schema_${data.profile.name.toLowerCase().replace(/\s+/g, '_')}_${SCHEMA_VERSION}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTestAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setVerifyReport(null);

    const result = await connectSupabase(projectUrl, anonKey);
    setIsVerifying(false);
    setVerifyReport(result);
  };

  const handleManualSync = async () => {
    setSyncStatus('Syncing from Supabase...');
    const ok = await syncFromSupabase();
    setSyncStatus(ok ? 'Successfully synced data from Supabase!' : 'Sync encountered an issue.');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">
            Supabase Database Connection Wizard
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Connect an independent Supabase PostgreSQL project for persistent multi-device management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
              isConnected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            {isConnected ? '● Connected to Supabase' : '○ Local Demo Mode'}
          </span>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Credential Safety & Multi-Tenant Separation:</p>
          <p className="text-blue-800 leading-relaxed">
            Each restaurant runs its own isolated Supabase database. Only use your <strong>Publishable Anon Key</strong> in the browser. Never enter a service-role secret key. Row Level Security (RLS) is automatically configured in the generated SQL.
          </p>
        </div>
      </div>

      {/* Step 1 & 2: Generate & Run SQL */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-neutral-900">
              Run Schema SQL in Supabase SQL Editor
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-500">
            Schema: {SCHEMA_VERSION}
          </span>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Open your Supabase project dashboard, navigate to <strong>SQL Editor</strong>, and paste the generated script below. It creates 13 optimized tables, indexes, and hardened Row Level Security (RLS) policies.
        </p>

        {/* SQL Preview Box */}
        <div className="relative">
          <pre className="p-4 bg-neutral-900 text-neutral-200 text-xs font-mono rounded-xl max-h-48 overflow-y-auto leading-relaxed">
            {generatedSql}
          </pre>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={handleDownloadSql}
              className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1"
          >
            <span>Open Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Step 2: Connect & Verify Project Credentials */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
            2
          </span>
          <h3 className="text-sm font-bold text-neutral-900">
            Connect & Verify Supabase Project
          </h3>
        </div>

        <form onSubmit={handleTestAndConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Supabase Project URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://xyzabcdefghijklm.supabase.co"
              className="w-full px-3 py-2 text-xs font-mono border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Supabase Publishable Anon Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs font-mono border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-600"
              required
            />
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Found in: Project Settings → API → Project API Keys → `anon public`.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 rounded-xl transition-colors shadow-xs flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Connection & Schema...</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5" />
                  <span>Verify Schema & Connect</span>
                </>
              )}
            </button>

            {isConnected && (
              <>
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="px-4 py-2.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                >
                  Pull Latest from Supabase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Disconnect from Supabase and switch back to Local Demo Mode?')) {
                      disconnectSupabase();
                      setVerifyReport(null);
                    }
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  Disconnect Project
                </button>
              </>
            )}
          </div>
        </form>

        {syncStatus && (
          <div className="p-3 bg-neutral-100 text-neutral-800 text-xs rounded-lg font-medium">
            {syncStatus}
          </div>
        )}

        {/* Verification Report Display */}
        {verifyReport && (
          <div
            className={`p-4 rounded-xl border space-y-2 text-xs ${
              verifyReport.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {verifyReport.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{verifyReport.message}</span>
            </div>

            {verifyReport.details && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-black/10">
                {Object.entries(verifyReport.details).map(([tbl, ok]) => (
                  <div key={tbl} className="flex items-center gap-1.5">
                    <span className={ok ? 'text-emerald-700' : 'text-red-700'}>
                      {ok ? '✓' : '✗'}
                    </span>
                    <span className="font-mono text-[11px]">{tbl}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
