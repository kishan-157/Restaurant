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
  SectionContents,
  Order,
  OrderStatus,
  ChefProfile,
  TimelineEvent,
  BlogPostItem,
  TableReservation,
  ReservationStatus,
  ContactMessage,
  SocialLinks,
  SEOSettings,
  ChatbotSettings,
  AudioSettings,
} from '../types';
import { dataProvider, VerificationResult } from '../lib/dataProvider';

interface RestaurantContextType {
  data: RestaurantDatabaseBundle;
  isConnected: boolean;
  supabaseConfig: SupabaseConfig;
  orders: Order[];
  reservations: TableReservation[];
  contactMessages: ContactMessage[];
  addOrder: (order: Parameters<typeof dataProvider.addOrder>[0]) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  clearOrders: () => void;
  addReservation: (res: Omit<TableReservation, 'id' | 'createdAt' | 'status'>) => TableReservation;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  deleteReservation: (id: string) => void;
  addContactMessage: (msg: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>) => ContactMessage;
  deleteContactMessage: (id: string) => void;
  updateProfile: (profile: Partial<RestaurantProfile>) => void;
  updateSections: (sections: Partial<WebsiteSections>) => void;
  updateSectionContents: (contents: Partial<SectionContents>) => void;
  updateOrderSettings: (settings: Partial<OrderSettings>) => void;
  updateOpeningHours: (hours: Partial<OpeningHours>) => void;
  updateSocials: (socials: Partial<SocialLinks>) => void;
  updateSEO: (seo: Partial<SEOSettings>) => void;
  updateChatbotSettings: (settings: Partial<ChatbotSettings>) => void;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
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
  saveChef: (chef: ChefProfile) => void;
  deleteChef: (id: string) => void;
  saveTimelineEvent: (event: TimelineEvent) => void;
  deleteTimelineEvent: (id: string) => void;
  saveBlogPost: (post: BlogPostItem) => void;
  deleteBlogPost: (id: string) => void;
  connectSupabase: (url: string, key: string) => Promise<VerificationResult>;
  disconnectSupabase: () => void;
  syncFromSupabase: () => Promise<boolean>;
  pushAllToSupabase: () => Promise<boolean>;
  exportData: () => string;
  importData: (json: string) => { success: boolean; error?: string };
  resetDefaults: () => void;
  submitPartyInquiry: (inquiry: any) => Promise<boolean>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<RestaurantDatabaseBundle>(() => dataProvider.getData());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => dataProvider.getSupabaseConfig());

  const refreshState = () => {
    setData({ ...dataProvider.getData() });
    setSupabaseConfig(dataProvider.getSupabaseConfig());
  };

  useEffect(() => {
    // Subscribe to real-time changes from Supabase or cross-tab localStorage updates
    const unsubscribe = dataProvider.subscribe(() => {
      refreshState();
    });

    if (dataProvider.isConnectedToSupabase()) {
      dataProvider.syncFromSupabase().then(() => {
        refreshState();
      });
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const updateProfile = (profile: Partial<RestaurantProfile>) => {
    dataProvider.updateProfile(profile);
    refreshState();
  };

  const updateSections = (sections: Partial<WebsiteSections>) => {
    dataProvider.updateSections(sections);
    refreshState();
  };

  const updateSectionContents = (contents: Partial<SectionContents>) => {
    dataProvider.updateSectionContents(contents);
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

  const updateSocials = (socials: Partial<SocialLinks>) => {
    dataProvider.updateSocials(socials);
    refreshState();
  };

  const updateSEO = (seo: Partial<SEOSettings>) => {
    dataProvider.updateSEO(seo);
    refreshState();
  };

  const updateChatbotSettings = (settings: Partial<ChatbotSettings>) => {
    dataProvider.updateChatbotSettings(settings);
    refreshState();
  };

  const updateAudioSettings = (settings: Partial<AudioSettings>) => {
    dataProvider.updateAudioSettings(settings);
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

  const saveChef = (chef: ChefProfile) => {
    dataProvider.saveChef(chef);
    refreshState();
  };

  const deleteChef = (id: string) => {
    dataProvider.deleteChef(id);
    refreshState();
  };

  const saveTimelineEvent = (event: TimelineEvent) => {
    dataProvider.saveTimelineEvent(event);
    refreshState();
  };

  const deleteTimelineEvent = (id: string) => {
    dataProvider.deleteTimelineEvent(id);
    refreshState();
  };

  const saveBlogPost = (post: BlogPostItem) => {
    dataProvider.saveBlogPost(post);
    refreshState();
  };

  const deleteBlogPost = (id: string) => {
    dataProvider.deleteBlogPost(id);
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

  const pushAllToSupabase = async () => {
    const res = await dataProvider.pushAllToSupabase();
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
    const ok = await dataProvider.submitPartyInquiry(inquiry);
    refreshState();
    return ok;
  };

  const addOrder = (orderInput: Parameters<typeof dataProvider.addOrder>[0]) => {
    const created = dataProvider.addOrder(orderInput);
    refreshState();
    return created;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    dataProvider.updateOrderStatus(orderId, status);
    refreshState();
  };

  const deleteOrder = (orderId: string) => {
    dataProvider.deleteOrder(orderId);
    refreshState();
  };

  const clearOrders = () => {
    dataProvider.clearOrders();
    refreshState();
  };

  const addReservation = (resInput: Omit<TableReservation, 'id' | 'createdAt' | 'status'>) => {
    const created = dataProvider.addReservation(resInput);
    refreshState();
    return created;
  };

  const updateReservationStatus = (id: string, status: ReservationStatus) => {
    dataProvider.updateReservationStatus(id, status);
    refreshState();
  };

  const deleteReservation = (id: string) => {
    dataProvider.deleteReservation(id);
    refreshState();
  };

  const addContactMessage = (msgInput: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>) => {
    const created = dataProvider.addContactMessage(msgInput);
    refreshState();
    return created;
  };

  const deleteContactMessage = (id: string) => {
    dataProvider.deleteContactMessage(id);
    refreshState();
  };

  return (
    <RestaurantContext.Provider
      value={{
        data,
        isConnected: dataProvider.isConnectedToSupabase(),
        supabaseConfig,
        orders: data.orders || [],
        reservations: data.reservations || [],
        contactMessages: data.contactMessages || [],
        addOrder,
        updateOrderStatus,
        deleteOrder,
        clearOrders,
        addReservation,
        updateReservationStatus,
        deleteReservation,
        addContactMessage,
        deleteContactMessage,
        updateProfile,
        updateSections,
        updateSectionContents,
        updateOrderSettings,
        updateOpeningHours,
        updateSocials,
        updateSEO,
        updateChatbotSettings,
        updateAudioSettings,
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
        saveChef,
        deleteChef,
        saveTimelineEvent,
        deleteTimelineEvent,
        saveBlogPost,
        deleteBlogPost,
        connectSupabase,
        disconnectSupabase,
        syncFromSupabase,
        pushAllToSupabase,
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
