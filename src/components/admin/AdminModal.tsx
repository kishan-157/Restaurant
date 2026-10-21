import React, { useState } from 'react';
import { X, Eye, ExternalLink } from 'lucide-react';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminDashboard } from './tabs/AdminDashboard';
import { AdminBranding } from './tabs/AdminBranding';
import { AdminSections } from './tabs/AdminSections';
import { AdminCategories } from './tabs/AdminCategories';
import { AdminMenuItems } from './tabs/AdminMenuItems';
import { AdminVariantsAddons } from './tabs/AdminVariantsAddons';
import { AdminStock } from './tabs/AdminStock';
import { AdminOrderSettings } from './tabs/AdminOrderSettings';
import { AdminRestaurantInfo } from './tabs/AdminRestaurantInfo';
import { AdminGallery } from './tabs/AdminGallery';
import { AdminSocials } from './tabs/AdminSocials';
import { AdminSEO } from './tabs/AdminSEO';
import { AdminDatabaseSetup } from './tabs/AdminDatabaseSetup';
import { AdminBackupExport } from './tabs/AdminBackupExport';
import { AdminHelpGuide } from './tabs/AdminHelpGuide';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  if (!isOpen) return null;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'branding':
        return <AdminBranding />;
      case 'sections':
        return <AdminSections />;
      case 'categories':
        return <AdminCategories />;
      case 'items':
        return <AdminMenuItems />;
      case 'variants':
        return <AdminVariantsAddons />;
      case 'stock':
        return <AdminStock />;
      case 'order-settings':
        return <AdminOrderSettings />;
      case 'restaurant-info':
        return <AdminRestaurantInfo />;
      case 'gallery':
        return <AdminGallery />;
      case 'socials':
        return <AdminSocials />;
      case 'seo':
        return <AdminSEO />;
      case 'database-setup':
        return <AdminDatabaseSetup />;
      case 'preview':
        return (
          <div className="space-y-4 text-center py-12">
            <h3 className="text-xl font-bold font-heading text-neutral-900">
              Live Website Preview Mode
            </h3>
            <p className="text-sm text-neutral-600 max-w-md mx-auto">
              Your edits are currently active in this browser. Click below to view and interact with the public restaurant website.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-md inline-flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Switch to Full Website View</span>
              </button>
            </div>
          </div>
        );
      case 'backup':
        return <AdminBackupExport />;
      case 'help':
        return <AdminHelpGuide />;
      default:
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-xs flex">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onClose={onClose}
      />

      {/* Main Content Area */}
      <main className="flex-1 bg-neutral-100 overflow-y-auto flex flex-col">
        {/* Top bar inside admin */}
        <div className="h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Admin Portal</span>
            <span>/</span>
            <span className="font-semibold text-neutral-900 capitalize">
              {activeTab.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live Site</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="p-6 sm:p-8 flex-1 max-w-6xl w-full mx-auto">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
};
