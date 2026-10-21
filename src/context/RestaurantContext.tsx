import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  RestaurantDatabaseBundle,
  RestaurantProfile,
  OpeningHours,
  WebsiteSections,
  OrderSettings,
  MenuCategory,
  MenuItem,
  ItemVariant,
  AddonGroup,
  GalleryItem,
  Testimonial,
  SpecialOffer,
  FAQItem,
  StockStatus,
  SupabaseConfig,
} from '../types';
import { dataProvider, VerificationResult } from '../lib/dataProvider';

interface RestaurantContextType {
  data: RestaurantDatabaseBundle;
  isConnected: boolean;
  supabaseConfig: SupabaseConfig;
  updateProfile: (profile: Partial<RestaurantProfile>) => void;
  updateSections: (sections: Partial<WebsiteSections>) => void;
  updateOrderSettings: (settings: Partial<OrderSettings>) => void;
  updateOpeningHours: (hours: Partial<OpeningHours>) => void;
  saveCategory: (category: MenuCategory) => void;
  deleteCategory: (categoryId: string) => void;
  saveItem: (item: MenuItem) => void;
  deleteItem: (itemId: string) => void;
  setItemStockStatus: (itemId: string, status: StockStatus) => void;
  saveVariant: (variant: ItemVariant) => void;
  deleteVariant: (variantId: string) => void;
  saveAddonGroup: (group: AddonGroup) => void;
  deleteAddonGroup: (groupId: string) => void;
  saveGalleryItem: (item: GalleryItem) => void;
  deleteGalleryItem: (id: string) => void;
  saveTestimonial: (t: Testimonial) => void;
  deleteTestimonial: (id: string) => void;
  saveOffer: (offer: SpecialOffer) => void;
  deleteOffer: (id: string) => void;
  saveFAQ: (faq: FAQItem) => void;
  deleteFAQ: (id: string) => void;
  connectSupabase: (url: string, key: string) => Promise<VerificationResult>;
  disconnectSupabase: () => void;
  syncFromSupabase: () => Promise<boolean>;
  exportData: () => string;
  importData: (json: string) => { success: boolean; error?: string };
  resetDefaults: () => void;
  submitPartyInquiry: (inquiry: any) => Promise<boolean>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<RestaurantDatabaseBundle>(() => dataProvider.getData());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => dataProvider.getSupabaseConfig());

  // Keep state refreshed whenever dataProvider updates
  const refreshState = () => {
    setData({ ...dataProvider.getData() });
    setSupabaseConfig(dataProvider.getSupabaseConfig());
  };

  useEffect(() => {
    // If Supabase is connected, do an initial background sync
    if (dataProvider.isConnectedToSupabase()) {
      dataProvider.syncFromSupabase().then(() => {
        refreshState();
      });
    }
  }, []);

  const updateProfile = (profile: Partial<RestaurantProfile>) => {
    dataProvider.updateProfile(profile);
    refreshState();
  };

  const updateSections = (sections: Partial<WebsiteSections>) => {
    dataProvider.updateSections(sections);
    refreshState();
  };

  const updateOrderSettings = (settings: Partial<OrderSettings>) => {
    dataProvider.updateOrderSettings(settings);
    refreshState();
  };

  const updateOpeningHours = (hours: Partial<OpeningHours>) => {
    dataProvider.updateOpeningHours(hours);
    refreshState();
  };

  const saveCategory = (category: MenuCategory) => {
    dataProvider.saveCategory(category);
    refreshState();
  };

  const deleteCategory = (categoryId: string) => {
    dataProvider.deleteCategory(categoryId);
    refreshState();
  };

  const saveItem = (item: MenuItem) => {
    dataProvider.saveItem(item);
    refreshState();
  };

  const deleteItem = (itemId: string) => {
    dataProvider.deleteItem(itemId);
    refreshState();
  };

  const setItemStockStatus = (itemId: string, status: StockStatus) => {
    dataProvider.setItemStockStatus(itemId, status);
    refreshState();
  };

  const saveVariant = (variant: ItemVariant) => {
    dataProvider.saveVariant(variant);
    refreshState();
  };

  const deleteVariant = (variantId: string) => {
    dataProvider.deleteVariant(variantId);
    refreshState();
  };

  const saveAddonGroup = (group: AddonGroup) => {
    dataProvider.saveAddonGroup(group);
    refreshState();
  };

  const deleteAddonGroup = (groupId: string) => {
    dataProvider.deleteAddonGroup(groupId);
    refreshState();
  };

  const saveGalleryItem = (item: GalleryItem) => {
    dataProvider.saveGalleryItem(item);
    refreshState();
  };

  const deleteGalleryItem = (id: string) => {
    dataProvider.deleteGalleryItem(id);
    refreshState();
  };

  const saveTestimonial = (t: Testimonial) => {
    dataProvider.saveTestimonial(t);
    refreshState();
  };

  const deleteTestimonial = (id: string) => {
    dataProvider.deleteTestimonial(id);
    refreshState();
  };

  const saveOffer = (offer: SpecialOffer) => {
    dataProvider.saveOffer(offer);
    refreshState();
  };

  const deleteOffer = (id: string) => {
    dataProvider.deleteOffer(id);
    refreshState();
  };

  const saveFAQ = (faq: FAQItem) => {
    dataProvider.saveFAQ(faq);
    refreshState();
  };

  const deleteFAQ = (id: string) => {
    dataProvider.deleteFAQ(id);
    refreshState();
  };

  const connectSupabase = async (url: string, key: string): Promise<VerificationResult> => {
    const res = await dataProvider.testAndConnectSupabase(url, key);
    refreshState();
    return res;
  };

  const disconnectSupabase = () => {
    dataProvider.disconnectSupabase();
    refreshState();
  };

  const syncFromSupabase = async () => {
    const res = await dataProvider.syncFromSupabase();
    refreshState();
    return res;
  };

  const exportData = () => {
    return dataProvider.exportDatabaseBundle();
  };

  const importData = (json: string) => {
    const res = dataProvider.importDatabaseBundle(json);
    if (res.success) {
      refreshState();
    }
    return res;
  };

  const resetDefaults = () => {
    dataProvider.resetToDemoDefaults();
    refreshState();
  };

  const submitPartyInquiry = async (inquiry: any) => {
    return await dataProvider.submitPartyInquiry(inquiry);
  };

  return (
    <RestaurantContext.Provider
      value={{
        data,
        isConnected: dataProvider.isConnectedToSupabase(),
        supabaseConfig,
        updateProfile,
        updateSections,
        updateOrderSettings,
        updateOpeningHours,
        saveCategory,
        deleteCategory,
        saveItem,
        deleteItem,
        setItemStockStatus,
        saveVariant,
        deleteVariant,
        saveAddonGroup,
        deleteAddonGroup,
        saveGalleryItem,
        deleteGalleryItem,
        saveTestimonial,
        deleteTestimonial,
        saveOffer,
        deleteOffer,
        saveFAQ,
        deleteFAQ,
        connectSupabase,
        disconnectSupabase,
        syncFromSupabase,
        exportData,
        importData,
        resetDefaults,
        submitPartyInquiry,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
