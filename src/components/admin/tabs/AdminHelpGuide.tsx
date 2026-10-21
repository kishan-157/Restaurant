import React from 'react';
import { HelpCircle, GitFork, Rocket, MessageCircle, Database, CheckSquare } from 'lucide-react';

export const AdminHelpGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold font-heading text-neutral-900">
          Master Template Setup & Deployment Guide
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Step-by-step developer playbook for cloning and onboarding new restaurant clients in under 15 minutes.
        </p>
      </div>

      {/* Workflow Phase 1 */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
          <GitFork className="w-5 h-5 text-amber-700" />
          <h3>Step 1: Reusing Code for a New Restaurant Client</h3>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          This project is an independent Master Template. For each new client:
        </p>
        <ol className="list-decimal list-inside text-xs text-neutral-700 space-y-1.5 pl-2 leading-relaxed font-mono">
          <li>Create a new repository on GitHub (e.g. <code>client-curry-palace-web</code>).</li>
          <li>Push this template code to the new repository.</li>
          <li>Never share Supabase credentials or database URLs across different restaurant clients.</li>
        </ol>
      </div>

      {/* Workflow Phase 2 */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
          <Database className="w-5 h-5 text-amber-700" />
          <h3>Step 2: Supabase Project Setup (5 Minutes)</h3>
        </div>
        <ol className="list-decimal list-inside text-xs text-neutral-700 space-y-1.5 pl-2 leading-relaxed">
          <li>Create a free organization & project on <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-800 underline">supabase.com</a>.</li>
          <li>In this Admin Panel, navigate to <strong>Tab 13: Database Setup</strong>.</li>
          <li>Click <strong>Copy SQL</strong> and paste into the Supabase <strong>SQL Editor</strong>, then press Run.</li>
          <li>Copy your Supabase Project URL and <code>anon public</code> key into Tab 13 and click <strong>Verify Schema & Connect</strong>.</li>
          <li>Row Level Security (RLS) is automatically enabled to protect the client's database.</li>
        </ol>
      </div>

      {/* Workflow Phase 3 */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
          <MessageCircle className="w-5 h-5 text-emerald-700" />
          <h3>Step 3: WhatsApp Click-to-Chat Phone Configuration</h3>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          In <strong>Tab 9: Restaurant Info</strong>, specify the owner's WhatsApp number in international format without pluses, spaces, or leading zeros:
        </p>
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono space-y-1">
          <div><span className="text-emerald-700 font-bold">✓ Correct:</span> 919820012345 (India), 14155552671 (US), 447911123456 (UK)</div>
          <div><span className="text-red-600 font-bold">✗ Incorrect:</span> +91 98200-12345 or 09820012345</div>
        </div>
      </div>

      {/* Workflow Phase 4 */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
          <Rocket className="w-5 h-5 text-blue-700" />
          <h3>Step 4: Deploying to Vercel or Netlify</h3>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Import the client's GitHub repo directly into Vercel. Framework preset is automatically recognized as <strong>Vite</strong>. Build command: <code>npm run build</code>, Output directory: <code>dist</code>.
        </p>
      </div>

      {/* Ready Checklist */}
      <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-amber-700" />
          <span>Launch Day Quick Checklist</span>
        </h3>
        <ul className="text-xs text-amber-950 space-y-1 pl-4 list-disc">
          <li>Verify dish prices match the client's latest physical printed menu.</li>
          <li>Test 1 test order to ensure it opens WhatsApp correctly on mobile.</li>
          <li>Check delivery radius instructions and free delivery threshold.</li>
          <li>Provide owner access to this Admin Panel via the secret header link.</li>
        </ul>
      </div>
    </div>
  );
};
