import React, { useState } from 'react';
import { DownloadCloud, UploadCloud, RotateCcw, Check, AlertCircle, FileCode } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { generateRestaurantDatabaseSQL, SCHEMA_VERSION } from '../../../lib/sqlGenerator';

export const AdminBackupExport: React.FC = () => {
  const { data, exportData, importData, resetDefaults } = useRestaurant();
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const handleExportJson = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = data.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.href = url;
    link.setAttribute('download', `${safeName}_config_export_${SCHEMA_VERSION}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Importing this configuration file will overwrite your current menu and settings. Proceed?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importData(content);
      if (result.success) {
        setImportStatus({ success: true, msg: 'Configuration imported and applied successfully!' });
      } else {
        setImportStatus({ success: false, msg: result.error || 'Failed to parse configuration file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all categories, dishes, branding, and hours back to the initial Indian Restaurant template demo data?')) {
      resetDefaults();
      setImportStatus({ success: true, msg: 'Reset to default master template dataset.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Backup, Export & Portability</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Export client configurations to quickly spin up cloned repositories for new restaurants.
          </p>
        </div>
      </div>

      {importStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2 text-xs font-medium ${
            importStatus.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {importStatus.success ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{importStatus.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <DownloadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Export Restaurant Bundle (JSON)</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Downloads a complete snapshot of your categories, menu dishes, prices, portion variants, addon groups, hours, and branding colors.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Download Configuration JSON</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Import Restaurant Configuration</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Upload a previously exported JSON bundle to immediately populate a new restaurant instance without re-entering data.
            </p>
          </div>
          <label className="w-full py-2.5 px-4 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer">
            <UploadCloud className="w-4 h-4 text-neutral-500" />
            <span>Select JSON File to Restore</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Reset to Factory Defaults Card */}
      <div className="p-6 bg-red-50/50 rounded-2xl border border-red-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-red-700" />
            <span>Reset to Master Template Defaults</span>
          </h3>
          <p className="text-xs text-red-700/80 mt-1">
            Restores the sample "Saffron & Spice Kitchen" Indian restaurant catalog with starter dishes and mock reviews.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-4 py-2 text-xs font-semibold text-red-800 bg-red-100 hover:bg-red-200 border border-red-300 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
