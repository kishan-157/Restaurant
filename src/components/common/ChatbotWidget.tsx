import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  ShoppingBag,
  Sparkles,
  Plus,
  Minus,
  Check,
  Bot,
  RotateCcw,
  PackageSearch,
  Calendar,
  CheckCircle2,
  Clock,
  ChefHat,
  Truck,
  XCircle,
  Trash2,
  MapPin,
  Navigation,
  ExternalLink,
  PhoneCall,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import {
  ChatbotActionType,
  ChatbotChatMessageLog,
  ChatbotQuickReply,
  ChatbotSessionLog,
  ChatbotSettings,
  ChatbotUnansweredQuestion,
  MenuItem,
  OrderType,
  ItemVariant,
  AddonOption,
  SpecialOffer,
} from '../../types';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';
import { formatISTTime, getISTDateInputString, getISTDayName } from '../../utils/indianTime';

type ChatLang = 'en' | 'hi' | 'gu';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  items?: MenuItem[];
  offers?: SpecialOffer[];
  showCategoryBrowser?: boolean;
  selectedCategoryId?: string;
  orderId?: string; // renders a live-updating Order Status Card from context
  isUnanswered?: boolean;
  unansweredQuery?: string;
  showWhatsAppCard?: boolean;
  showLocationCard?: boolean;
  customerSharedLocationUrl?: string;
  reservationInfo?: {
    id: string;
    guestName: string;
    partySize: string;
    date: string;
    time: string;
  };
}

// Normalize phonetic spellings (Hinglish / Hindi / Gujarati / English) for accurate dish & category search
const normalizeFoodSearch = (raw: string): string => {
  return raw
    .toLowerCase()
    .replace(/toofani|tofani|tufani|तूफानी|तूफ़ानी|તુફાની/g, 'tufani')
    .replace(/paneer|panir|panner|पनीर|પનીર/g, 'paneer')
    .replace(/tikka|tika|टिक्का|ટિક્કા/g, 'tikka')
    .replace(/masala|mashala|मसाला|મસાલા/g, 'masala')
    .replace(/burger|bargar|बर्गर|બર્ગર/g, 'burger')
    .replace(/pizza|piza|पिज्जा|पिज़्ज़ा|પિઝા/g, 'pizza')
    .replace(/chicken|chiken|चिकन|ચિકન/g, 'chicken')
    .replace(/pasta|पास्ता|પાસ્તા/g, 'pasta')
    .replace(/naan|nan|नान|નાન/g, 'naan')
    .replace(/dal|daal|दाल|દાળ/g, 'dal')
    .replace(/wrap|roll|रैप|रोल/g, 'wrap')
    .replace(/lava|cake|केक/g, 'cake');
};

const QUERY_STOP_WORDS = new Set([
  'mujhe',
  'chahiye',
  'milega',
  'milegi',
  'kya',
  'hai',
  'hain',
  'ka',
  'ki',
  'ke',
  'ko',
  'se',
  'me',
  'mein',
  'link',
  'do',
  'de',
  'dena',
  'batao',
  'bataiye',
  'price',
  'rate',
  'kitna',
  'kitne',
  'order',
  'karna',
  'karni',
  'want',
  'need',
  'show',
  'give',
  'please',
  'can',
  'get',
  'the',
  'for',
  'with',
  'and',
  'dish',
  'item',
  'food',
  'menu',
]);

export const ChatbotWidget: React.FC = () => {
  const { data, orders, addOrder, addReservation, updateChatbotSettings } = useRestaurant();
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalCount: itemCount,
    setIsCartOpen,
  } = useCart();

  const settings: ChatbotSettings = {
    ...DEFAULT_RESTAURANT_DATA.chatbotSettings!,
    ...(data.chatbotSettings || {}),
    quickReplies:
      data.chatbotSettings?.quickReplies ||
      DEFAULT_RESTAURANT_DATA.chatbotSettings!.quickReplies,
    customQAs:
      data.chatbotSettings?.customQAs ||
      DEFAULT_RESTAURANT_DATA.chatbotSettings!.customQAs,
    unansweredQuestions: data.chatbotSettings?.unansweredQuestions || [],
    chatLogs: data.chatbotSettings?.chatLogs || [],
  };

  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<ChatLang>(settings.defaultLanguage || 'en');
  const [input, setInput] = useState('');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [sharedGpsUrl, setSharedGpsUrl] = useState<string>('');

  // Inline Dish Options Customizer State (for selecting Variants & Add-ons inside Chatbot!)
  const [customizingDishId, setCustomizingDishId] = useState<string | null>(null);
  const [selectedVariantByDish, setSelectedVariantByDish] = useState<Record<string, string>>({});
  const [selectedAddonsByDish, setSelectedAddonsByDish] = useState<Record<string, string[]>>({});
  const [customNoteByDish, setCustomNoteByDish] = useState<Record<string, string>>({});

  // Promo / Coupon Code State inside Chatbot Order Form
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<string>('');

  // Stable Session ID for Admin Customer Chat History & Analytics
  const sessionIdRef = useRef<string>(`sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`);
  const sessionStartedAtRef = useRef<string>(new Date().toISOString());

  // Active Interactive Drawer Mode inside Chat
  const [activeMode, setActiveMode] = useState<
    'chat' | 'order_form' | 'status_lookup' | 'table_booking'
  >('chat');

  // In-Chat Order Confirmation Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSelectedCategory, setOrderSelectedCategory] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  // In-Chat Order Status Lookup State
  const [lookupQuery, setLookupQuery] = useState('');

  // In-Chat Table Booking State
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resPartySize, setResPartySize] = useState('2 People');
  const [resDate, setResDate] = useState(() => getISTDateInputString());
  const [resTime, setResTime] = useState('07:30 PM');

  const currency = data.profile.currencySymbol || '₹';
  const primaryColor = settings.useBrandColor
    ? data.profile.primaryColor || '#e8281a'
    : settings.customColor || '#e8281a';

  // Effective WhatsApp Support Number (Admin Chatbot Setting -> Restaurant Profile WhatsApp -> Phone)
  const rawSupportPhone =
    settings.whatsappSupportNumber?.trim() ||
    data.profile.whatsappNumber?.trim() ||
    data.profile.phone?.trim() ||
    '919876543210';
  const whatsappDigits = rawSupportPhone.replace(/\D/g, '') || '919876543210';

  // Effective Restaurant Location Details
  const locationTitle = settings.customLocationTitle?.trim() || data.profile.name;
  const locationAddress =
    settings.customLocationAddress?.trim() ||
    `${data.profile.address}, ${data.profile.city} ${data.profile.postalCode || ''}`.trim();
  const locationLandmark = settings.customLocationLandmark?.trim() || '';
  const locationMapsUrl =
    settings.customLocationMapsUrl?.trim() ||
    data.profile.googleMapsUrl?.trim() ||
    `https://maps.google.com/?q=${encodeURIComponent(locationAddress)}`;

  const getWelcomeText = (l: ChatLang) => {
    if (l === 'hi') return settings.welcomeMessageHi || settings.welcomeMessageEn;
    if (l === 'gu') return settings.welcomeMessageGu || settings.welcomeMessageEn;
    return settings.welcomeMessageEn;
  };

  const getFallbackText = (l: ChatLang) => {
    if (l === 'hi') return settings.fallbackMessageHi || settings.fallbackMessageEn;
    if (l === 'gu') return settings.fallbackMessageGu || settings.fallbackMessageEn;
    return settings.fallbackMessageEn;
  };

  const getWhatsAppFallbackPrompt = (l: ChatLang) => {
    if (l === 'hi')
      return (
        settings.whatsappFallbackPromptHi ||
        settings.whatsappFallbackPromptEn ||
        'तुरंत जवाब के लिए अपना सवाल हमारे WhatsApp सपोर्ट पर भेजें:'
      );
    if (l === 'gu')
      return (
        settings.whatsappFallbackPromptGu ||
        settings.whatsappFallbackPromptEn ||
        'તુરંત જવાબ માટે તમારો પ્રશ્ન અમારા WhatsApp સપોર્ટ પર મોકલો:'
      );
    return (
      settings.whatsappFallbackPromptEn ||
      'Need instant help from our team? Send your question directly to our WhatsApp Support:'
    );
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: getWelcomeText(settings.defaultLanguage || 'en'),
      timestamp: formatISTTime(),
      showCategoryBrowser: true,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeMode]);

  // Listen for global coupon application event from OffersSection
  useEffect(() => {
    const onApplyCoupon = (e: Event) => {
      const code = (e as CustomEvent<string>).detail;
      if (code) {
        setCouponInput(code.toUpperCase());
        setAppliedCouponCode(code.toUpperCase());
        setCouponFeedback(`Coupon ${code.toUpperCase()} applied!`);
      }
    };
    window.addEventListener('sarab:apply-coupon', onApplyCoupon);
    return () => window.removeEventListener('sarab:apply-coupon', onApplyCoupon);
  }, []);

  // Keep welcome message synced when admin updates welcome text or language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome-msg') {
        return [
          {
            ...prev[0],
            text: getWelcomeText(lang),
            showCategoryBrowser: true,
          },
        ];
      }
      return prev;
    });
  }, [
    lang,
    settings.welcomeMessageEn,
    settings.welcomeMessageHi,
    settings.welcomeMessageGu,
  ]);

  // Optional auto-open timer configured in Admin Panel
  useEffect(() => {
    if (!settings.enabled || !settings.autoOpenDelaySeconds || settings.autoOpenDelaySeconds <= 0)
      return;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, settings.autoOpenDelaySeconds * 1000);
    return () => clearTimeout(timer);
  }, [settings.enabled, settings.autoOpenDelaySeconds]);

  if (!settings.enabled) return null;

  // Build WhatsApp Support URL with pre-filled customer question
  const buildWhatsAppUrl = (questionText?: string) => {
    const prefix =
      lang === 'hi'
        ? `नमस्ते ${data.profile.name} टीम! मेरा एक सवाल है:`
        : lang === 'gu'
        ? `નમસ્તે ${data.profile.name} ટીમ! મારો એક પ્રશ્ન છે:`
        : `Hello ${data.profile.name} Support! I have a question from your website chat:`;
    const locationPart = sharedGpsUrl ? `\n📍 My Location: ${sharedGpsUrl}` : '';
    const fullText = questionText
      ? `${prefix}\n"${questionText}"${locationPart}`
      : `${prefix}${locationPart}`;
    return `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(fullText)}`;
  };

  // Persist conversation log & unanswered questions to ChatbotSettings so Admin can analyze & train
  const recordChatInteraction = (
    updatedMessages: ChatMessage[],
    unansweredQueryText?: string,
    matchedTopic?: string,
    extraFlags?: {
      orderPlaced?: boolean;
      whatsappClicked?: boolean;
      locationShared?: boolean;
      customerNameOverride?: string;
      customerPhoneOverride?: string;
    }
  ) => {
    const currentLogs: ChatbotSessionLog[] = Array.isArray(data.chatbotSettings?.chatLogs)
      ? [...data.chatbotSettings!.chatLogs!]
      : [];
    const currentUnanswered: ChatbotUnansweredQuestion[] = Array.isArray(
      data.chatbotSettings?.unansweredQuestions
    )
      ? [...data.chatbotSettings!.unansweredQuestions!]
      : [];

    // 1. If there is an unanswered question, add or increment it in unansweredQuestions
    if (unansweredQueryText && unansweredQueryText.trim().length > 1) {
      const cleanQ = unansweredQueryText.trim();
      const existingIdx = currentUnanswered.findIndex(
        u => u.questionText.toLowerCase() === cleanQ.toLowerCase()
      );
      if (existingIdx >= 0) {
        currentUnanswered[existingIdx] = {
          ...currentUnanswered[existingIdx],
          count: (currentUnanswered[existingIdx].count || 1) + 1,
          askedAt: new Date().toISOString(),
          language: lang,
          status: 'pending',
        };
      } else {
        currentUnanswered.unshift({
          id: `unans-${Date.now()}`,
          questionText: cleanQ,
          language: lang,
          askedAt: new Date().toISOString(),
          count: 1,
          status: 'pending',
          sessionId: sessionIdRef.current,
        });
      }
    }

    // 2. Update or create current session log
    const sessionIdx = currentLogs.findIndex(s => s.id === sessionIdRef.current);
    const prevSession = sessionIdx >= 0 ? currentLogs[sessionIdx] : undefined;

    const mappedMessages: ChatbotChatMessageLog[] = updatedMessages.map(m => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
      matchedTopic: m.sender === 'bot' ? matchedTopic : undefined,
      isUnanswered: m.isUnanswered,
      locationUrl: m.customerSharedLocationUrl,
    }));

    const unansweredCount = mappedMessages.filter(m => m.sender === 'bot' && m.isUnanswered).length;
    const guestLabel =
      extraFlags?.customerNameOverride ||
      customerName.trim() ||
      resName.trim() ||
      prevSession?.customerLabel ||
      `Visitor #${sessionIdRef.current.slice(-4).toUpperCase()}`;

    const guestPhone =
      extraFlags?.customerPhoneOverride ||
      customerPhone.trim() ||
      resPhone.trim() ||
      prevSession?.customerPhone ||
      '';

    const updatedSession: ChatbotSessionLog = {
      id: sessionIdRef.current,
      customerLabel: guestLabel,
      customerPhone: guestPhone,
      startedAt: prevSession?.startedAt || sessionStartedAtRef.current,
      lastMessageAt: new Date().toISOString(),
      language: lang,
      messagesCount: mappedMessages.length,
      unansweredCount,
      orderPlaced: Boolean(prevSession?.orderPlaced || extraFlags?.orderPlaced),
      whatsappClicked: Boolean(prevSession?.whatsappClicked || extraFlags?.whatsappClicked),
      locationShared: Boolean(prevSession?.locationShared || extraFlags?.locationShared),
      messages: mappedMessages,
    };

    if (sessionIdx >= 0) {
      currentLogs[sessionIdx] = updatedSession;
    } else {
      currentLogs.unshift(updatedSession);
    }

    // Keep max 50 recent chat sessions so storage remains fast
    updateChatbotSettings({
      unansweredQuestions: currentUnanswered.slice(0, 100),
      chatLogs: currentLogs.slice(0, 50),
    });
  };

  const handleLanguageChange = (newLang: ChatLang) => {
    setLang(newLang);
    const now = formatISTTime();
    setMessages(prev => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        sender: 'bot',
        text: getWelcomeText(newLang),
        timestamp: now,
        showCategoryBrowser: true,
      },
    ]);
  };

  const handleResetChat = () => {
    setActiveMode('chat');
    setCustomizingDishId(null);
    sessionIdRef.current = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    sessionStartedAtRef.current = new Date().toISOString();
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'bot',
        text: getWelcomeText(lang),
        timestamp: formatISTTime(),
        showCategoryBrowser: true,
      },
    ]);
  };

  // --- Dish Variants & Add-ons Helpers for Chatbot ---
  const getDishVariants = (dishId: string): ItemVariant[] => {
    return data.variants.filter(v => v.menuItemId === dishId && v.isAvailable);
  };

  const getDishAddonGroups = (dish: MenuItem) => {
    const groups =
      dish.addonGroupIds && dish.addonGroupIds.length > 0
        ? data.addonGroups.filter(g => dish.addonGroupIds!.includes(g.id))
        : dish.hasAddons
        ? data.addonGroups
        : [];
    return groups
      .map(group => ({
        group,
        options: (group.options || []).filter(o => o.isAvailable !== false),
      }))
      .filter(g => g.options.length > 0);
  };

  const getAllAvailableAddonOptions = (): AddonOption[] => {
    return data.addonGroups.flatMap(g => g.options || []);
  };

  const dishHasOptions = (_dish: MenuItem): boolean => {
    // Allow every dish in Chatbot to open ⚙️ Options (for Variants, Add-ons, or Custom Cooking Note)
    return true;
  };

  const toggleDishOptionsPanel = (dish: MenuItem) => {
    if (customizingDishId === dish.id) {
      setCustomizingDishId(null);
      return;
    }
    const itemVariants = getDishVariants(dish.id);
    if (itemVariants.length > 0 && !selectedVariantByDish[dish.id]) {
      setSelectedVariantByDish(prev => ({ ...prev, [dish.id]: itemVariants[0].id }));
    }
    setCustomizingDishId(dish.id);
  };

  const handleToggleAddonForDish = (dishId: string, addonId: string) => {
    setSelectedAddonsByDish(prev => {
      const current = prev[dishId] || [];
      const exists = current.includes(addonId);
      return {
        ...prev,
        [dishId]: exists ? current.filter(id => id !== addonId) : [...current, addonId],
      };
    });
  };

  const handleAddCustomizedDish = (dish: MenuItem) => {
    const itemVariants = getDishVariants(dish.id);
    const chosenVariantId = selectedVariantByDish[dish.id];
    const chosenVariant =
      itemVariants.find(v => v.id === chosenVariantId) || itemVariants[0] || undefined;

    const chosenAddonIds = selectedAddonsByDish[dish.id] || [];
    const allAddons = getAllAvailableAddonOptions();
    const chosenAddons: AddonOption[] = allAddons.filter(o =>
      chosenAddonIds.includes(o.id)
    );
    const note = (customNoteByDish[dish.id] || '').trim();

    addToCart(dish, chosenVariant, chosenAddons, 1, note);
    setIsCartOpen(false);
    setCustomizingDishId(null);
    setAddedItemIds(prev => ({ ...prev, [dish.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [dish.id]: false }));
    }, 1200);
  };

  const handleQuickAddItem = (item: MenuItem) => {
    const itemVariants = getDishVariants(item.id);
    const defaultVariant = itemVariants.length > 0 ? itemVariants[0] : undefined;
    addToCart(item, defaultVariant, [], 1, '');
    setIsCartOpen(false);
    setAddedItemIds(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  // --- Promo / Coupon Calculation inside Chatbot ---
  const activeOffers = data.offers.filter(o => o.isActive);
  const matchedOffer = appliedCouponCode
    ? data.offers.find(o => o.code.toUpperCase() === appliedCouponCode.toUpperCase())
    : undefined;

  const calculateCouponDiscount = (): { discountAmount: number; freeDeliveryByCoupon: boolean } => {
    if (!appliedCouponCode || subtotal <= 0) {
      return { discountAmount: 0, freeDeliveryByCoupon: false };
    }
    const code = appliedCouponCode.toUpperCase();
    const badgeAndTitle = `${matchedOffer?.discountBadge || ''} ${matchedOffer?.title || ''} ${code}`.toUpperCase();

    if (badgeAndTitle.includes('FREE DEL') || code.includes('FREEDEL')) {
      return { discountAmount: 0, freeDeliveryByCoupon: true };
    }

    const percentMatch = badgeAndTitle.match(/(\d+)\s*%/);
    if (percentMatch) {
      const pct = Math.min(90, Math.max(1, parseInt(percentMatch[1], 10)));
      return {
        discountAmount: Math.round((subtotal * pct) / 100),
        freeDeliveryByCoupon: false,
      };
    }

    const flatMatch = badgeAndTitle.match(/(?:₹|RS\.?|INR|FLAT\s*)(\d+)/i);
    if (flatMatch) {
      const flatAmt = parseInt(flatMatch[1], 10);
      return {
        discountAmount: Math.min(subtotal, flatAmt),
        freeDeliveryByCoupon: false,
      };
    }

    // Default 15% discount if custom offer has no numeric badge
    return {
      discountAmount: Math.round(subtotal * 0.15),
      freeDeliveryByCoupon: false,
    };
  };

  const { discountAmount: chatCouponDiscount, freeDeliveryByCoupon } = calculateCouponDiscount();

  const handleApplyCouponInChat = (rawCode?: string) => {
    const code = (rawCode ?? couponInput).trim().toUpperCase();
    if (!code) {
      setCouponFeedback('Please enter a coupon code.');
      return;
    }
    const found = data.offers.find(o => o.code.toUpperCase() === code && o.isActive);
    if (found) {
      setAppliedCouponCode(found.code.toUpperCase());
      setCouponInput(found.code.toUpperCase());
      setCouponFeedback(`✅ Applied "${found.code}" (${found.discountBadge})!`);
      window.dispatchEvent(new CustomEvent('sarab:apply-coupon', { detail: found.code.toUpperCase() }));
    } else {
      setCouponFeedback(`❌ Invalid coupon. Try: ${activeOffers.map(o => o.code).join(', ') || 'SARAB15'}`);
    }
  };

  // Direct Dish Link Handler: Opens the dish directly in the website Menu section
  const handleOpenDishDirectLink = (dish: MenuItem) => {
    window.dispatchEvent(new CustomEvent('sarab:open-dish', { detail: dish.id }));
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Direct Order Handler for a specific dish inside Chatbot
  const handleDirectOrderDishInChat = (dish: MenuItem) => {
    const alreadyInCart = cart.some(c => c.item.id === dish.id);
    if (!alreadyInCart) {
      const itemVariants = getDishVariants(dish.id);
      addToCart(dish, itemVariants[0], [], 1, '');
    }
    setIsCartOpen(false);
    setActiveMode('order_form');
  };

  // Select a Category directly inside the Chat conversation to view all its dishes
  const handleSelectCategoryInChat = (categoryId: string) => {
    const availableItems = data.items.filter(i => i.stockStatus === 'available');
    const activeCategories = data.categories
      .filter(c => c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const matchedCat = activeCategories.find(c => c.id === categoryId);
    const catItems =
      categoryId === 'all'
        ? availableItems
        : availableItems.filter(i => i.categoryId === categoryId);
    const catTitle = matchedCat ? matchedCat.name : 'All Menu Categories';
    const now = formatISTTime();

    const userMsg: ChatMessage = {
      id: `user-cat-${Date.now()}`,
      sender: 'user',
      text: `📂 Category: ${catTitle}`,
      timestamp: now,
    };

    const botMsg: ChatMessage = {
      id: `bot-cat-${Date.now() + 1}`,
      sender: 'bot',
      text:
        lang === 'hi'
          ? `🍴 "${catTitle}" कैटेगरी में ${catItems.length} डिश उपलब्ध हैं। आप "+ Add" या "⚙️ Options" दबाकर मनपसंद साइज/टॉपिंग के साथ एक से ज़्यादा डिश चुन सकते हैं और अंत में ऑर्डर प्लेस कर सकते हैं:`
          : lang === 'gu'
          ? `🍴 "${catTitle}" કેટેગરીમાં ${catItems.length} વાનગીઓ ઉપલબ્ધ છે. તમે "+ Add" અથવા "⚙️ Options" દબાવીને એકથી વધુ વાનગીઓ પસંદ કરી શકો છો:`
          : `🍴 Showing all ${catItems.length} dishes in "${catTitle}". Select multiple items (or tap "⚙️ Options" for sizes & add-ons) and place your order at the end:`,
      timestamp: now,
      items: catItems,
      showCategoryBrowser: true,
      selectedCategoryId: categoryId,
    };

    const nextMessages = [...messages, userMsg, botMsg];
    setMessages(nextMessages);
    recordChatInteraction(nextMessages, undefined, `Category Selected: ${catTitle}`);
  };

  // Detect & Share Customer Live GPS Location
  const handleDetectCustomerLocation = (target: 'chat' | 'order_form') => {
    if (!navigator.geolocation) {
      const fallbackNote = 'Location detection is not supported on this browser.';
      if (target === 'order_form') {
        setOrderError(fallbackNote);
      }
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const mapsPin = `https://maps.google.com/?q=${lat},${lng}`;
        setSharedGpsUrl(mapsPin);

        if (target === 'order_form') {
          setDeliveryAddress(prev =>
            prev.trim()
              ? `${prev.trim()} (📍 GPS Pin: ${mapsPin})`
              : `📍 Live GPS Location: ${mapsPin}`
          );
        } else {
          const now = formatISTTime();
          const userMsg: ChatMessage = {
            id: `user-loc-${Date.now()}`,
            sender: 'user',
            text: `📍 Shared Live Location: ${lat}, ${lng}`,
            timestamp: now,
            customerSharedLocationUrl: mapsPin,
          };
          const botMsg: ChatMessage = {
            id: `bot-loc-${Date.now() + 1}`,
            sender: 'bot',
            text:
              lang === 'hi'
                ? `✅ आपकी लाइव GPS लोकेशन (${lat}, ${lng}) सेव कर ली गई है! यह आपके डिलीवरी ऑर्डर और WhatsApp सपोर्ट में अपने-आप जुड़ जाएगी।`
                : lang === 'gu'
                ? `✅ તમારું લાઈવ GPS લોકેશન (${lat}, ${lng}) સેવ થઈ ગયું છે! તે તમારા ડિલિવરી ઓર્ડરમાં આપમેળે ઉમેરાઈ જશે.`
                : `✅ Your Live GPS Location (${lat}, ${lng}) has been pinned! We have pre-filled it for your Delivery Order and WhatsApp Support.`,
            timestamp: now,
            showLocationCard: true,
          };
          setDeliveryAddress(prev =>
            prev.trim() ? prev : `📍 Live GPS Pin: ${mapsPin}`
          );
          const nextMsgs = [...messages, userMsg, botMsg];
          setMessages(nextMsgs);
          recordChatInteraction(nextMsgs, undefined, 'Customer Location Shared', {
            locationShared: true,
          });
        }
      },
      () => {
        setIsLocating(false);
        if (target === 'chat') {
          const now = formatISTTime();
          const botMsg: ChatMessage = {
            id: `bot-loc-info-${Date.now()}`,
            sender: 'bot',
            text:
              lang === 'hi'
                ? `📍 हमारी रेस्तरां लोकेशन नीचे दी गई है (यदि GPS अनुमति बंद है, तो आप अपना पता सीधे टाइप कर सकते हैं):`
                : lang === 'gu'
                ? `📍 અમારું રેસ્ટોરન્ટ લોકેશન નીચે આપેલ છે:`
                : `📍 Here is our Restaurant Location & Google Maps Pin (you can also type your area/landmark in chat):`,
            timestamp: now,
            showLocationCard: true,
          };
          setMessages(prev => [...prev, botMsg]);
        } else {
          setOrderError('Could not auto-detect GPS in preview frame. Please type your address.');
        }
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Look up order by Order Number (e.g. ORD-1234) or Phone Number
  const findMatchingOrder = (rawQuery: string) => {
    const clean = rawQuery.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return undefined;

    return orders.find(o => {
      const ordNum = o.orderNumber.toLowerCase().replace(/^#/, '');
      const phoneDigits = o.customerPhone.replace(/\D/g, '');
      const queryDigits = clean.replace(/\D/g, '');
      return (
        ordNum === clean ||
        ordNum.includes(clean) ||
        (queryDigits.length >= 6 && phoneDigits.includes(queryDigits))
      );
    });
  };

  // Core Knowledge Engine: Answers from Forced Quick Actions + Custom Admin Q&As + Live Website Data
  const generateBotReply = (
    rawQuery: string,
    forcedAction?: ChatbotActionType
  ): {
    text: string;
    items?: MenuItem[];
    offers?: SpecialOffer[];
    showCategoryBrowser?: boolean;
    selectedCategoryId?: string;
    orderId?: string;
    isUnanswered?: boolean;
    unansweredQuery?: string;
    showWhatsAppCard?: boolean;
    showLocationCard?: boolean;
    matchedTopic?: string;
  } => {
    const q = rawQuery.toLowerCase().trim();
    const availableItems = data.items.filter(i => i.stockStatus === 'available');
    const activeCategories = data.categories.filter(c => c.isActive);

    // 0. Direct Forced Actions from Quick Reply Buttons (Always Priority #1 when clicked!)
    if (forcedAction && forcedAction !== 'custom_query') {
      if (forcedAction === 'order_now' && settings.enableOrderPlacement) {
        setActiveMode('order_form');
        return {
          text:
            lang === 'hi'
              ? '🛒 हमने चैट में ही ऑर्डर पैनल खोल दिया है! अपनी पसंद की डिश चुनें और तुरंत ऑर्डर कन्फर्म करें।'
              : lang === 'gu'
              ? '🛒 અમે ચેટમાં જ ઓર્ડર પેનલ ખોલી છે! તમારી મનપસંદ વાનગી પસંદ કરો અને તરત ઓર્ડર કન્ફર્મ કરો.'
              : '🛒 I have opened the Instant Order Confirm panel below! Select your dishes, customize options, and confirm your order right here.',
          matchedTopic: 'In-Chat Order Form',
        };
      }

      if (forcedAction === 'order_status' && settings.enableOrderStatusLookup) {
        if (orders.length > 0) {
          const latest = orders[0];
          return {
            text:
              lang === 'hi'
                ? `📦 आपके हाल के ऑर्डर #${latest.orderNumber} का लाइव स्टेटस नीचे दिया गया है (अन्य ऑर्डर के लिए अपना Order ID या मोबाइल नंबर लिखें):`
                : lang === 'gu'
                ? `📦 તમારા તાજેતરના ઓર્ડર #${latest.orderNumber} નું લાઈવ સ્ટેટસ નીચે મુજબ છે (અન્ય ઓર્ડર માટે Order ID કે મોબાઈલ નંબર લખો):`
                : `📦 Here is the live status of your recent order #${latest.orderNumber} (or type any Order ID / Phone Number to check another order):`,
            orderId: latest.id,
            matchedTopic: 'Order Status Tracking',
          };
        }
        setActiveMode('status_lookup');
        return {
          text:
            lang === 'hi'
              ? '📦 अपना लाइव ऑर्डर स्टेटस देखने के लिए अपना Order ID (जैसे ORD-1234) या 10-अंकों का मोबाइल नंबर दर्ज करें।'
              : lang === 'gu'
              ? '📦 તમારું લાઈવ ઓર્ડર સ્ટેટસ જોવા માટે તમારો Order ID (જેમ કે ORD-1234) અથવા મોબાઈલ નંબર લખો.'
              : '📦 Please enter your Order ID (e.g., ORD-1234) or your Phone Number to check your live kitchen & delivery status.',
          matchedTopic: 'Order Status Tracking',
        };
      }

      if (forcedAction === 'book_table' && settings.enableTableBooking) {
        setActiveMode('table_booking');
        return {
          text:
            lang === 'hi'
              ? '🪑 नीचे दिए गए फॉर्म में अपनी तारीख, समय और मेहमानों की संख्या भरकर तुरंत टेबल बुक करें!'
              : lang === 'gu'
              ? '🪑 નીચેના ફોર્મમાં તારીખ, સમય અને મહેમાનોની સંખ્યા ભરીને તરત જ ટેબલ બુક કરો!'
              : '🪑 Fill in your preferred date, time, and party size below to reserve your table instantly!',
          matchedTopic: 'Table Reservation',
        };
      }

      if (forcedAction === 'bestsellers') {
        const best = availableItems.filter(i => i.isBestseller);
        const list = best.map(i => `⭐ ${i.name} — ${currency}${i.price.toFixed(2)}`).join('\n');
        return {
          text:
            lang === 'hi'
              ? `🔥 हमारे सबसे लोकप्रिय बेस्टसेलर डिश (${best.length} आइटम):\n${list}\n\n👇 नीचे "+ Add" या "⚙️ Options" से अपनी पसंद के विकल्प चुनें:`
              : lang === 'gu'
              ? `🔥 અમારી સૌથી લોકપ્રિય બેસ્ટસેલર વાનગીઓ (${best.length} આઇટમ):\n${list}`
              : `🔥 Our Top-Rated Best Sellers (${best.length} dishes):\n${list}\n\n👇 Tap "+ Add" or "⚙️ Options" below to select sizes & add-ons:`,
          items: best,
          showCategoryBrowser: true,
          matchedTopic: 'Best Sellers',
        };
      }

      if (forcedAction === 'veg_menu') {
        const vegItems = availableItems.filter(i => i.isVeg);
        const list = vegItems
          .map(i => `🌿 ${i.name} — ${currency}${i.price.toFixed(2)}`)
          .join('\n');
        return {
          text:
            lang === 'hi'
              ? `🌿 हमारे पास ${vegItems.length} शुद्ध शाकाहारी (Veg) डिश उपलब्ध हैं:\n${list}`
              : lang === 'gu'
              ? `🌿 અમારી પાસે ${vegItems.length} શુદ્ધ શાકાહારી (Veg) વાનગીઓ ઉપલબ્ધ છે:\n${list}`
              : `🌿 All ${vegItems.length} Vegetarian dishes from our menu:\n${list}`,
          items: vegItems,
          showCategoryBrowser: true,
          matchedTopic: 'Vegetarian Menu',
        };
      }

      if (forcedAction === 'menu') {
        const catSummary = activeCategories
          .map(c => {
            const count = availableItems.filter(i => i.categoryId === c.id).length;
            return `• ${c.name} (${count} items)`;
          })
          .join('\n');
        return {
          text:
            lang === 'hi'
              ? `📋 ${data.profile.name} का पूरा मेनू (${availableItems.length} डिश, ${activeCategories.length} कैटेगरी):\n${catSummary}\n\n👇 नीचे किसी भी कैटेगरी पर क्लिक करें या "+ Add" / "⚙️ Options" दबाकर मनपसंद प्रोडक्ट्स चुनें:`
              : lang === 'gu'
              ? `📋 ${data.profile.name} નું સંપૂર્ણ મેનુ (${availableItems.length} વાનગીઓ, ${activeCategories.length} કેટેગરી):\n${catSummary}\n\n👇 નીચે કોઈપણ કેટેગરી પસંદ કરો અને "+ Add" દબાવીને વાનગીઓ ઉમેરો:`
              : `📋 ${data.profile.name} Complete Menu (${availableItems.length} dishes across ${activeCategories.length} categories):\n${catSummary}\n\n👇 Tap any Category button below, customize sizes/toppings with "⚙️ Options", and place your order at the end!`,
          items: availableItems,
          showCategoryBrowser: true,
          selectedCategoryId: 'all',
          matchedTopic: 'Full Menu Overview',
        };
      }

      if (forcedAction === 'offers') {
        const deal = data.sectionContents?.specialDeal;
        const offerLines = activeOffers.map(
          o => `🏷️ ${o.title} (${o.discountBadge}) — Code: ${o.code}\n   ${o.description}`
        );
        const dealLine = deal
          ? `🔥 ${deal.titleLine1} ${deal.titleHighlight}: ${deal.dealPrice} (was ${deal.originalPrice})`
          : '';
        return {
          text:
            [dealLine, ...offerLines].filter(Boolean).join('\n\n') ||
            'Check our Special Offers section for today’s live combo deals!',
          offers: activeOffers,
          matchedTopic: 'Special Offers & Coupons',
        };
      }

      if (forcedAction === 'hours' || forcedAction === 'location') {
        const todayIstDay = getISTDayName();
        const currentIstTime = formatISTTime();
        const scheduleLines = Object.entries(data.openingHours.schedule)
          .map(
            ([day, s]) =>
              `${day === todayIstDay ? '👉 ' : '• '}${day}: ${
                s.isOpen ? `${s.openTime} - ${s.closeTime} (IST)` : 'Closed'
              }`
          )
          .join('\n');
        return {
          text: `🕒 ${data.openingHours.topbarHoursText}\n🇮🇳 Current Indian Time: ${todayIstDay}, ${currentIstTime}\n📍 ${locationTitle}\n${locationAddress}${
            locationLandmark ? `\n🧭 Landmark: ${locationLandmark}` : ''
          }\n📞 Phone: ${data.profile.phone}\n\nWeekly Schedule (IST):\n${scheduleLines}`,
          showLocationCard: true,
          matchedTopic: 'Location & Opening Hours',
        };
      }

      if (forcedAction === 'delivery') {
        const os = data.orderSettings;
        return {
          text:
            lang === 'hi'
              ? `🛵 एक्सप्रेस होम डिलीवरी जानकारी:\n• डिलीवरी समय: ${os.estimatedDeliveryTime}\n• पिकअप समय: ${os.estimatedPickupTime}\n• डिलीवरी शुल्क: ${currency}${os.deliveryFee} (${currency}${os.freeDeliveryThreshold} से ऊपर के ऑर्डर पर FREE डिलीवरी!)\n• न्यूनतम ऑर्डर: ${currency}${os.minOrderAmount}`
              : lang === 'gu'
              ? `🛵 હોમ ડિલિવરી માહિતી:\n• ડિલિવરી સમય: ${os.estimatedDeliveryTime}\n• પિકઅપ સમય: ${os.estimatedPickupTime}\n• ડિલિવરી ચાર્જ: ${currency}${os.deliveryFee} (${currency}${os.freeDeliveryThreshold} થી વધુના ઓર્ડર પર FREE ડિલિવરી!)\n• મિનિમમ ઓર્ડર: ${currency}${os.minOrderAmount}`
              : `🛵 Express Delivery Details:\n• Estimated Delivery: ${os.estimatedDeliveryTime}\n• Express Pickup: ${os.estimatedPickupTime}\n• Delivery Fee: ${currency}${os.deliveryFee} (FREE Delivery on orders over ${currency}${os.freeDeliveryThreshold}!)\n• Minimum Order: ${currency}${os.minOrderAmount}`,
          matchedTopic: 'Delivery Information',
        };
      }

      if (forcedAction === 'chefs') {
        const chefs = data.chefs || [];
        const lines = chefs.map(c => `👨‍🍳 ${c.name} — ${c.role}`).join('\n');
        return {
          text: lines || `👨‍🍳 Executive Chef: ${data.sectionContents?.about?.chefName || 'Master Chef'}`,
          matchedTopic: 'Chefs & Kitchen Team',
        };
      }

      if (forcedAction === 'faq') {
        const faqText = data.faqs
          .slice(0, 5)
          .map(f => `Q: ${f.question}\nA: ${f.answer}`)
          .join('\n\n');
        return {
          text: faqText || getFallbackText(lang),
          matchedTopic: 'General FAQs',
        };
      }
    }

    // 1. Check if user typed an Order Number (e.g. ORD-xxxx) or asked for order status with digits
    if (
      settings.enableOrderStatusLookup &&
      (q.includes('ord-') ||
        q.includes('status') ||
        q.includes('track') ||
        q.includes('where is my order') ||
        q.includes('मेरा ऑर्डर') ||
        q.includes('स्टेटस') ||
        q.includes('ઓર્ડર સ્ટેટસ'))
    ) {
      const matched = findMatchingOrder(rawQuery);
      if (matched) {
        return {
          text:
            lang === 'hi'
              ? `✅ ऑर्डर #${matched.orderNumber} मिल गया! लाइव स्टेटस नीचे देखें:`
              : lang === 'gu'
              ? `✅ ઓર્ડર #${matched.orderNumber} મળી ગયો! લાઈવ સ્ટેટસ નીચે જુઓ:`
              : `✅ Found Order #${matched.orderNumber}! Here is the real-time status from our kitchen:`,
          orderId: matched.id,
          matchedTopic: 'Order Status Tracking',
        };
      } else if (orders.length > 0 && !q.match(/\d{4}/)) {
        return {
          text:
            lang === 'hi'
              ? `📦 आपका नवीनतम ऑर्डर #${orders[0].orderNumber} नीचे दिखाया गया है:`
              : lang === 'gu'
              ? `📦 તમારો તાજેતરનો ઓર્ડર #${orders[0].orderNumber} નીચે દર્શાવેલ છે:`
              : `📦 Showing your most recent order #${orders[0].orderNumber} below:`,
          orderId: orders[0].id,
          matchedTopic: 'Order Status Tracking',
        };
      } else {
        setActiveMode('status_lookup');
        return {
          text:
            lang === 'hi'
              ? '🔍 कृपया अपना सही Order ID (जैसे ORD-1234) या ऑर्डर में दिया गया फोन नंबर नीचे लिखें:'
              : lang === 'gu'
              ? '🔍 કૃપા કરીને તમારો સાચો Order ID (જેમ કે ORD-1234) અથવા ફોન નંબર નીચે લખો:'
              : '🔍 Please enter your Order ID (e.g., ORD-1234) or Phone Number below to look up your live order:',
          matchedTopic: 'Order Status Tracking',
        };
      }
    }

    // 2. Check Custom Admin Q&A Rules (Trained by Restaurant Owner in Admin Panel)
    for (const qa of settings.customQAs) {
      if (!qa.isActive) continue;
      const keywords = qa.keywords
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);
      if (
        keywords.some(kw => q.includes(kw)) ||
        (qa.questionTitle && q.length > 4 && qa.questionTitle.toLowerCase().includes(q))
      ) {
        const reply =
          lang === 'hi'
            ? qa.answerHi || qa.answerEn
            : lang === 'gu'
            ? qa.answerGu || qa.answerEn
            : qa.answerEn;
        return {
          text: reply,
          showLocationCard: Boolean(qa.attachLocationCard),
          showWhatsAppCard: Boolean(qa.attachWhatsAppButton),
          matchedTopic: `Custom Q&A: ${qa.questionTitle}`,
        };
      }
    }

    // 3. Check Website FAQs (from Admin Content tab)
    for (const faq of data.faqs) {
      const fq = faq.question.toLowerCase();
      if (q.length > 4 && (fq.includes(q) || q.includes(fq.slice(0, 18)))) {
        return {
          text: `❓ ${faq.question}\n\n✅ ${faq.answer}`,
          matchedTopic: 'Website FAQ',
        };
      }
    }

    // 4. Specific Dish Search (Phonetic + Multi-Language + Tag + Name match, e.g. "paneer tufani")
    const normQ = normalizeFoodSearch(q);
    const meaningfulTokens = normQ
      .replace(/[^a-z0-9\u0900-\u097F\u0A80-\u0AFF\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !QUERY_STOP_WORDS.has(w));

    const matchedDishes = availableItems.filter(item => {
      const normName = normalizeFoodSearch(item.name);
      const normDesc = normalizeFoodSearch(item.description || '');
      const normTags = (item.tags || []).map(t => normalizeFoodSearch(t));

      if (normQ.length >= 3 && normName.includes(normQ)) return true;

      if (meaningfulTokens.length > 0) {
        const allTokensInItem = meaningfulTokens.every(
          tk =>
            normName.includes(tk) ||
            normTags.some(t => t.includes(tk)) ||
            normDesc.includes(tk)
        );
        if (allTokensInItem) return true;

        const nameWords = normName.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
        if (nameWords.some(nw => meaningfulTokens.includes(nw))) return true;
      }

      return false;
    });

    if (
      matchedDishes.length > 0 &&
      !['menu', 'full menu', 'मेनू', 'મેનુ'].includes(q)
    ) {
      const lines = matchedDishes.map(i => {
        const catObj = activeCategories.find(c => c.id === i.categoryId);
        const itemVariants = getDishVariants(i.id);
        const variantStr =
          itemVariants.length > 0
            ? ` (Sizes: ${itemVariants.map(v => `${v.name} ${currency}${v.price}`).join(', ')})`
            : '';
        return `🍽️ ${i.name} (${catObj?.name || 'Special'}) — ${currency}${i.price.toFixed(2)}${variantStr}\n   🔗 Direct Link: #dish-${i.id}`;
      });

      return {
        text:
          lang === 'hi'
            ? `✅ जी हाँ! आपकी पूछी गई डिश हमारे मेनू में उपलब्ध है:\n\n${lines.join('\n\n')}\n\n👇 नीचे दिए गए कार्ड से आप "+ Add" या "⚙️ Options" (साइज/टॉपिंग) चुन सकते हैं, या "⚡ Direct Order" से तुरंत ऑर्डर कर सकते हैं:`
            : lang === 'gu'
            ? `✅ હા! તમે પૂછેલી વાનગી અમારા મેનુમાં ઉપલબ્ધ છે:\n\n${lines.join('\n\n')}\n\n👇 નીચેના કાર્ડથી તમે "+ Add" કે "⚙️ Options" કરી શકો છો અથવા "⚡ Direct Order" કરી શકો છો:`
            : `✅ Yes! Here is the direct dish link & live details from our menu:\n\n${lines.join('\n\n')}\n\n👇 Use the card below to "+ Add", tap "⚙️ Options" to pick sizes/add-ons, or click "⚡ Direct Order":`,
        items: matchedDishes,
        showCategoryBrowser: true,
        matchedTopic: `Dish Link: ${matchedDishes[0].name}`,
      };
    }

    // 5. Category Match
    const matchedCat = activeCategories.find(c => {
      const normCatName = normalizeFoodSearch(c.name);
      const normSlug = normalizeFoodSearch(c.slug);
      return (
        q.includes(c.name.toLowerCase()) ||
        q.includes(c.slug.toLowerCase()) ||
        normQ.includes(normCatName) ||
        normQ.includes(normSlug)
      );
    });
    if (matchedCat) {
      const catItems = availableItems.filter(i => i.categoryId === matchedCat.id);
      const list = catItems
        .map(i => `• ${i.name}: ${currency}${i.price.toFixed(2)}`)
        .join('\n');
      return {
        text:
          lang === 'hi'
            ? `🍴 ${matchedCat.name} कैटेगरी के सभी ${catItems.length} प्रोडक्ट नीचे दिए गए हैं। आप एक से ज़्यादा प्रोडक्ट "+ Add" या "⚙️ Options" कर सकते हैं:\n${list}`
            : lang === 'gu'
            ? `🍴 ${matchedCat.name} કેટેગરીની તમામ ${catItems.length} વાનગીઓ નીચે મુજબ છે:\n${list}`
            : `🍴 All ${catItems.length} dishes in ${matchedCat.name}:\n${list}\n\nSelect multiple items below and place your order when ready!`,
        items: catItems,
        showCategoryBrowser: true,
        selectedCategoryId: matchedCat.id,
        matchedTopic: `Category: ${matchedCat.name}`,
      };
    }

    // 6. Best Sellers / Popular
    if (
      q.includes('best') ||
      q.includes('popular') ||
      q.includes('special') ||
      q.includes('बेस्ट') ||
      q.includes('બેસ્ટ')
    ) {
      const best = availableItems.filter(i => i.isBestseller);
      const list = best.map(i => `⭐ ${i.name} — ${currency}${i.price.toFixed(2)}`).join('\n');
      return {
        text:
          lang === 'hi'
            ? `🔥 हमारे सबसे लोकप्रिय बेस्टसेलर डिश (${best.length} आइटम):\n${list}`
            : lang === 'gu'
            ? `🔥 અમારી સૌથી લોકપ્રિય બેસ્ટસેલર વાનગીઓ (${best.length} આઇટમ):\n${list}`
            : `🔥 Our Top-Rated Best Sellers (${best.length} dishes):\n${list}`,
        items: best,
        showCategoryBrowser: true,
        matchedTopic: 'Best Sellers',
      };
    }

    // 7. Pure Veg
    if (
      q.includes('veg') ||
      q.includes('vegetarian') ||
      q.includes('शाकाहारी') ||
      q.includes('વેજ')
    ) {
      const vegItems = availableItems.filter(i => i.isVeg);
      const list = vegItems
        .map(i => `🌿 ${i.name} — ${currency}${i.price.toFixed(2)}`)
        .join('\n');
      return {
        text:
          lang === 'hi'
            ? `🌿 हमारे पास ${vegItems.length} शुद्ध शाकाहारी (Veg) डिश उपलब्ध हैं:\n${list}`
            : lang === 'gu'
            ? `🌿 અમારી પાસે ${vegItems.length} શુદ્ધ શાકાહારી (Veg) વાનગીઓ ઉપલબ્ધ છે:\n${list}`
            : `🌿 All ${vegItems.length} Vegetarian dishes from our menu:\n${list}`,
        items: vegItems,
        showCategoryBrowser: true,
        matchedTopic: 'Vegetarian Menu',
      };
    }

    // 8. Full Menu & All Categories Interactive Selector
    if (
      q.includes('menu') ||
      q.includes('price') ||
      q.includes('food') ||
      q.includes('dish') ||
      q.includes('category') ||
      q.includes('categories') ||
      q.includes('मेनू') ||
      q.includes('रेट') ||
      q.includes('મેનુ') ||
      q.includes('ભાવ')
    ) {
      const catSummary = activeCategories
        .map(c => {
          const count = availableItems.filter(i => i.categoryId === c.id).length;
          return `• ${c.name} (${count} items)`;
        })
        .join('\n');
      return {
        text:
          lang === 'hi'
            ? `📋 ${data.profile.name} का पूरा मेनू (${availableItems.length} डिश, ${activeCategories.length} कैटेगरी):\n${catSummary}\n\n👇 नीचे किसी भी कैटेगरी पर क्लिक करें या "+ Add" / "⚙️ Options" दबाकर मनपसंद प्रोडक्ट्स चुनें:`
            : lang === 'gu'
            ? `📋 ${data.profile.name} નું સંપૂર્ણ મેનુ (${availableItems.length} વાનગીઓ, ${activeCategories.length} કેટેગરી):\n${catSummary}\n\n👇 નીચે કોઈપણ કેટેગરી પસંદ કરો અને "+ Add" દબાવીને વાનગીઓ ઉમેરો:`
            : `📋 ${data.profile.name} Complete Menu (${availableItems.length} dishes across ${activeCategories.length} categories):\n${catSummary}\n\n👇 Tap any Category button below to filter, add multiple products to your cart, and place your order at the end!`,
        items: availableItems,
        showCategoryBrowser: true,
        selectedCategoryId: 'all',
        matchedTopic: 'Full Menu Overview',
      };
    }

    // 9. Special Offers & Deals
    if (
      q.includes('offer') ||
      q.includes('discount') ||
      q.includes('coupon') ||
      q.includes('deal') ||
      q.includes('ऑफर') ||
      q.includes('डिस्काउंट') ||
      q.includes('ઓફર')
    ) {
      const deal = data.sectionContents?.specialDeal;
      const offerLines = activeOffers.map(
        o => `🏷️ ${o.title} (${o.discountBadge}) — Code: ${o.code}\n   ${o.description}`
      );
      const dealLine = deal
        ? `🔥 ${deal.titleLine1} ${deal.titleHighlight}: ${deal.dealPrice} (was ${deal.originalPrice})`
        : '';
      return {
        text:
          [dealLine, ...offerLines].filter(Boolean).join('\n\n') ||
          'Check our Special Offers section for today’s live combo deals!',
        offers: activeOffers,
        matchedTopic: 'Special Offers & Coupons',
      };
    }

    // 10. Opening Hours & Location (with Interactive Google Maps Location Card!)
    if (
      q.includes('time') ||
      q.includes('open') ||
      q.includes('hour') ||
      q.includes('close') ||
      q.includes('address') ||
      q.includes('location') ||
      q.includes('map') ||
      q.includes('direction') ||
      q.includes('where') ||
      q.includes('लोकेशन') ||
      q.includes('समय') ||
      q.includes('पता') ||
      q.includes('સમય') ||
      q.includes('સરનામું')
    ) {
      const todayIstDay = getISTDayName();
      const currentIstTime = formatISTTime();
      const scheduleLines = Object.entries(data.openingHours.schedule)
        .map(
          ([day, s]) =>
            `${day === todayIstDay ? '👉 ' : '• '}${day}: ${
              s.isOpen ? `${s.openTime} - ${s.closeTime} (IST)` : 'Closed'
            }`
        )
        .join('\n');
      return {
        text: `🕒 ${data.openingHours.topbarHoursText}\n🇮🇳 Current Indian Time: ${todayIstDay}, ${currentIstTime}\n📍 ${locationTitle}\n${locationAddress}${
          locationLandmark ? `\n🧭 Landmark: ${locationLandmark}` : ''
        }\n📞 Phone: ${data.profile.phone}\n\nWeekly Schedule (IST):\n${scheduleLines}`,
        showLocationCard: true,
        matchedTopic: 'Location & Opening Hours',
      };
    }

    // 11. Delivery Info
    if (
      q.includes('deliver') ||
      q.includes('shipping') ||
      q.includes('charge') ||
      q.includes('fee') ||
      q.includes('डिलीवरी') ||
      q.includes('ડિલિવરી')
    ) {
      const os = data.orderSettings;
      return {
        text:
          lang === 'hi'
            ? `🛵 एक्सप्रेस होम डिलीवरी जानकारी:\n• डिलीवरी समय: ${os.estimatedDeliveryTime}\n• पिकअप समय: ${os.estimatedPickupTime}\n• डिलीवरी शुल्क: ${currency}${os.deliveryFee} (${currency}${os.freeDeliveryThreshold} से ऊपर के ऑर्डर पर FREE डिलीवरी!)\n• न्यूनतम ऑर्डर: ${currency}${os.minOrderAmount}`
            : lang === 'gu'
            ? `🛵 હોમ ડિલિવરી માહિતી:\n• ડિલિવરી સમય: ${os.estimatedDeliveryTime}\n• પિકઅપ સમય: ${os.estimatedPickupTime}\n• ડિલિવરી ચાર્જ: ${currency}${os.deliveryFee} (${currency}${os.freeDeliveryThreshold} થી વધુના ઓર્ડર પર FREE ડિલિવરી!)\n• મિનિમમ ઓર્ડર: ${currency}${os.minOrderAmount}`
            : `🛵 Express Delivery Details:\n• Estimated Delivery: ${os.estimatedDeliveryTime}\n• Express Pickup: ${os.estimatedPickupTime}\n• Delivery Fee: ${currency}${os.deliveryFee} (FREE Delivery on orders over ${currency}${os.freeDeliveryThreshold}!)\n• Minimum Order: ${currency}${os.minOrderAmount}`,
        matchedTopic: 'Delivery Information',
      };
    }

    // 12. Chefs
    if (q.includes('chef') || q.includes('cook')) {
      const chefs = data.chefs || [];
      const lines = chefs.map(c => `👨‍🍳 ${c.name} — ${c.role}`).join('\n');
      return {
        text: lines || `👨‍🍳 Executive Chef: ${data.sectionContents?.about?.chefName || 'Master Chef'}`,
        matchedTopic: 'Chefs & Kitchen Team',
      };
    }

    // 13. FAQs list
    if (q.includes('faq') || q.includes('help')) {
      const faqText = data.faqs
        .slice(0, 4)
        .map(f => `Q: ${f.question}\nA: ${f.answer}`)
        .join('\n\n');
      return {
        text: faqText || getFallbackText(lang),
        matchedTopic: 'General FAQs',
      };
    }

    // 14. Direct WhatsApp Support Request
    if (
      q.includes('whatsapp') ||
      q.includes('support') ||
      q.includes('manager') ||
      q.includes('human') ||
      q.includes('call') ||
      q.includes('contact') ||
      q.includes('बात')
    ) {
      return {
        text:
          lang === 'hi'
            ? `💬 आप नीचे दिए गए WhatsApp बटन पर क्लिक करके सीधे हमारे रेस्तरां मैनेजर से बात कर सकते हैं (+${whatsappDigits}):`
            : lang === 'gu'
            ? `💬 તમે નીચેના WhatsApp બટન પર ક્લિક કરીને સીધા અમારા રેસ્ટોરન્ટ મેનેજર સાથે વાત કરી શકો છો (+${whatsappDigits}):`
            : `💬 Click the WhatsApp Support button below to chat directly with our Restaurant Manager (+${whatsappDigits}):`,
        showWhatsAppCard: true,
        unansweredQuery: rawQuery,
        matchedTopic: 'WhatsApp Support Request',
      };
    }

    // 15. In-Chat Order Trigger by Text
    if (
      settings.enableOrderPlacement &&
      (q.includes('order now') ||
        q.includes('place order') ||
        q.includes('confirm order') ||
        q.includes('ऑर्डर करना') ||
        q.includes('ઓર્ડર કરવો'))
    ) {
      setActiveMode('order_form');
      return {
        text:
          lang === 'hi'
            ? '🛒 अपना ऑर्डर तुरंत कन्फर्म करने के लिए नीचे विवरण भरें:'
            : lang === 'gu'
            ? '🛒 તમારો ઓર્ડર તરત કન્ફર્મ કરવા માટે નીચે વિગતો ભરો:'
            : '🛒 Complete your details in the panel below to confirm your order immediately:',
        matchedTopic: 'In-Chat Order Form',
      };
    }

    // 16. Table Booking Trigger by Text
    if (
      settings.enableTableBooking &&
      (q.includes('book') ||
        q.includes('table') ||
        q.includes('reservation') ||
        q.includes('टेबल'))
    ) {
      setActiveMode('table_booking');
      return {
        text:
          lang === 'hi'
            ? '🪑 नीचे दिए गए पैनल से अपनी टेबल तुरंत बुक करें:'
            : lang === 'gu'
            ? '🪑 નીચેના પેનલમાંથી તમારું ટેબલ તરત બુક કરો:'
            : '🪑 Reserve your dining table right here using the form below:',
        matchedTopic: 'Table Reservation',
      };
    }

    // 17. Greetings
    if (['hi', 'hello', 'hey', 'namaste', 'नमस्ते', 'નમસ્તે'].includes(q)) {
      return {
        text: getWelcomeText(lang),
        items: settings.enableDishCards ? availableItems.slice(0, 3) : undefined,
        showCategoryBrowser: true,
        matchedTopic: 'Greeting',
      };
    }

    // Default Fallback -> Unanswered Question!
    return {
      text: getFallbackText(lang),
      items: settings.enableDishCards ? availableItems.slice(0, 2) : undefined,
      showCategoryBrowser: true,
      isUnanswered: true,
      unansweredQuery: rawQuery,
      showWhatsAppCard: settings.autoShowWhatsAppOnUnanswered !== false,
      matchedTopic: 'Unanswered / Fallback',
    };
  };

  const handleSendMessage = (
    customText?: string,
    forcedAction?: ChatbotActionType
  ) => {
    const queryText = (customText ?? input).trim();
    if (!queryText && !forcedAction) return;

    const now = formatISTTime();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: now,
    };

    const reply = generateBotReply(queryText, forcedAction);
    const botMsg: ChatMessage = {
      id: `bot-${Date.now() + 1}`,
      sender: 'bot',
      text: reply.text,
      timestamp: now,
      items: reply.items,
      offers: reply.offers,
      showCategoryBrowser: reply.showCategoryBrowser,
      selectedCategoryId: reply.selectedCategoryId,
      orderId: reply.orderId,
      isUnanswered: reply.isUnanswered,
      unansweredQuery: reply.unansweredQuery,
      showWhatsAppCard: reply.showWhatsAppCard,
      showLocationCard: reply.showLocationCard,
    };

    const nextMessages = [...messages, userMsg, botMsg];
    setMessages(nextMessages);
    if (!customText) setInput('');

    // Record into Admin Chat Logs & Unanswered Questions Queue
    recordChatInteraction(
      nextMessages,
      reply.isUnanswered ? queryText : undefined,
      reply.matchedTopic
    );
  };

  // --- Confirm Order Directly Inside Chatbot (Supports both Kitchen Admin & WhatsApp!) ---
  const submitChatbotOrder = (channel: 'admin' | 'whatsapp') => {
    setOrderError('');

    if (cart.length === 0) {
      setOrderError('Please add at least 1 dish to your order first.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderError('Please enter your Name and 10-digit Mobile Number.');
      return;
    }
    if (customerPhone.replace(/\D/g, '').length < 10) {
      setOrderError('Please enter a valid 10-digit Mobile Number.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setOrderError('Please enter your Delivery Address.');
      return;
    }

    const os = data.orderSettings;
    if (orderType === 'delivery' && subtotal < os.minOrderAmount) {
      setOrderError(
        `Minimum order for delivery is ${currency}${os.minOrderAmount}. Please add ${currency}${(
          os.minOrderAmount - subtotal
        ).toFixed(0)} more.`
      );
      return;
    }

    const deliveryFee =
      orderType === 'delivery'
        ? subtotal >= os.freeDeliveryThreshold || freeDeliveryByCoupon
          ? 0
          : os.deliveryFee
        : 0;
    const finalTotal = Math.max(0, Number((subtotal - chatCouponDiscount + deliveryFee).toFixed(2)));
    const couponNote = appliedCouponCode
      ? ` [Coupon: ${appliedCouponCode}${chatCouponDiscount > 0 ? ` -${currency}${chatCouponDiscount}` : ' FREE DEL'}]`
      : '';

    const createdOrder = addOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : '',
      specialInstructions: `${specialNotes.trim()}${couponNote}`.trim(),
      items: cart.map(c => ({
        id: c.cartItemId,
        name: c.item.name,
        variantName: c.selectedVariant?.name,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        lineTotal: c.lineTotal,
        addonNames: c.selectedAddons?.map(a => a.name),
        customerNote: c.customerNote,
        isVeg: c.item.isVeg,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      total: finalTotal,
      channel,
      status: 'pending',
      notes: `Confirmed via Website Smart Chatbot${couponNote}`,
    });

    if (channel === 'whatsapp') {
      const itemsText = cart
        .map(
          c =>
            `• ${c.quantity}x ${c.item.name}${
              c.selectedVariant ? ` (${c.selectedVariant.name})` : ''
            }${
              c.selectedAddons?.length
                ? ` [+ ${c.selectedAddons.map(a => a.name).join(', ')}]`
                : ''
            } = ${currency}${c.lineTotal.toFixed(2)}`
        )
        .join('\n');
      const waText = `*NEW ORDER #${createdOrder.orderNumber}*\nCustomer: ${customerName.trim()} (${customerPhone.trim()})\nType: ${orderType.toUpperCase()}\n${
        orderType === 'delivery' ? `Address: ${deliveryAddress.trim()}\n` : ''
      }\n*Items:*\n${itemsText}\n\nSubtotal: ${currency}${subtotal.toFixed(2)}${
        chatCouponDiscount > 0
          ? `\nCoupon (${appliedCouponCode}): -${currency}${chatCouponDiscount.toFixed(2)}`
          : ''
      }\nDelivery: ${deliveryFee === 0 ? 'FREE' : `${currency}${deliveryFee.toFixed(2)}`}\n*Total Payable: ${currency}${finalTotal.toFixed(2)}*`;

      const waLink = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(waText)}`;
      window.open(waLink, '_blank', 'noopener,noreferrer');
    }

    clearCart();
    setAppliedCouponCode(null);
    setCouponInput('');
    setCouponFeedback('');
    setActiveMode('chat');

    const now = formatISTTime();
    const confirmBotMsg: ChatMessage = {
      id: `ord-confirm-${Date.now()}`,
      sender: 'bot',
      text: `🎉 Order Confirmed! (#${createdOrder.orderNumber})${couponNote}\n\n${settings.orderConfirmationNote}`,
      timestamp: now,
      orderId: createdOrder.id,
    };

    const nextMessages = [...messages, confirmBotMsg];
    setMessages(nextMessages);
    recordChatInteraction(nextMessages, undefined, 'Order Confirmed in Chat', {
      orderPlaced: true,
      whatsappClicked: channel === 'whatsapp',
      customerNameOverride: customerName.trim(),
      customerPhoneOverride: customerPhone.trim(),
    });
  };

  const handleConfirmOrderInChat = (e: React.FormEvent) => {
    e.preventDefault();
    submitChatbotOrder('admin');
  };

  // --- Lookup Order Status Directly Inside Chatbot ---
  const handleLookupOrderStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    const matched = findMatchingOrder(lookupQuery);
    const now = formatISTTime();

    if (matched) {
      setActiveMode('chat');
      const nextMsgs: ChatMessage[] = [
        ...messages,
        {
          id: `user-track-${Date.now()}`,
          sender: 'user',
          text: `Track Order: ${lookupQuery.trim()}`,
          timestamp: now,
        },
        {
          id: `bot-track-${Date.now() + 1}`,
          sender: 'bot',
          text:
            lang === 'hi'
              ? `✅ ऑर्डर #${matched.orderNumber} का लाइव स्टेटस नीचे देखें:`
              : lang === 'gu'
              ? `✅ ઓર્ડર #${matched.orderNumber} નું લાઈવ સ્ટેટસ નીચે જુઓ:`
              : `✅ Live Status for Order #${matched.orderNumber}:`,
          timestamp: now,
          orderId: matched.id,
        },
      ];
      setMessages(nextMsgs);
      recordChatInteraction(nextMsgs, undefined, 'Order Status Lookup');
      setLookupQuery('');
    } else {
      setActiveMode('chat');
      const nextMsgs: ChatMessage[] = [
        ...messages,
        {
          id: `user-track-${Date.now()}`,
          sender: 'user',
          text: `Track Order: ${lookupQuery.trim()}`,
          timestamp: now,
        },
        {
          id: `bot-track-notfound-${Date.now() + 1}`,
          sender: 'bot',
          text:
            lang === 'hi'
              ? `❌ "${lookupQuery}" से कोई ऑर्डर नहीं मिला। कृपया अपना सही Order ID (जैसे ORD-1234) या मोबाइल नंबर जांचें।`
              : lang === 'gu'
              ? `❌ "${lookupQuery}" થી કોઈ ઓર્ડર મળ્યો નથી. કૃપા કરીને તમારો Order ID અથવા મોબાઈલ નંબર તપાસો.`
              : `❌ No order found matching "${lookupQuery}". Please check your Order ID (e.g., ORD-1234) or Phone Number.`,
          timestamp: now,
          showWhatsAppCard: true,
          unansweredQuery: `Order Status Inquiry for: ${lookupQuery}`,
        },
      ];
      setMessages(nextMsgs);
      recordChatInteraction(nextMsgs, undefined, 'Order Status Not Found');
      setLookupQuery('');
    }
  };

  // --- Confirm Table Reservation Inside Chatbot ---
  const handleConfirmTableBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName.trim() || !resPhone.trim()) return;

    const createdRes = addReservation({
      guestName: resName.trim(),
      guestEmail: '',
      guestPhone: resPhone.trim(),
      partySize: resPartySize,
      reservationDate: resDate,
      reservationTime: resTime,
      specialRequest: 'Booked via Website Chatbot',
    });

    setActiveMode('chat');
    const now = formatISTTime();
    const nextMsgs: ChatMessage[] = [
      ...messages,
      {
        id: `res-confirm-${Date.now()}`,
        sender: 'bot',
        text:
          lang === 'hi'
            ? `🪑 आपकी टेबल बुकिंग रिक्वेस्ट कन्फर्म हो गई है!`
            : lang === 'gu'
            ? `🪑 તમારી ટેબલ બુકિંગ રિક્વેસ્ટ કન્ફર્મ થઈ ગઈ છે!`
            : `🪑 Your Table Reservation has been submitted!`,
        timestamp: now,
        reservationInfo: {
          id: createdRes.id,
          guestName: createdRes.guestName,
          partySize: createdRes.partySize,
          date: createdRes.reservationDate,
          time: createdRes.reservationTime,
        },
      },
    ];
    setMessages(nextMsgs);
    recordChatInteraction(nextMsgs, undefined, 'Table Booking Confirmed', {
      customerNameOverride: resName.trim(),
      customerPhoneOverride: resPhone.trim(),
    });
    setResName('');
    setResPhone('');
  };

  const activeQuickReplies: ChatbotQuickReply[] = settings.quickReplies.filter(qr => {
    if (!qr.isActive) return false;
    if (qr.action === 'order_now' && !settings.enableOrderPlacement) return false;
    if (qr.action === 'order_status' && !settings.enableOrderStatusLookup) return false;
    if (qr.action === 'book_table' && !settings.enableTableBooking) return false;
    return true;
  });

  const getQuickChipLabel = (qr: ChatbotQuickReply) => {
    if (lang === 'hi') return qr.labelHi || qr.labelEn;
    if (lang === 'gu') return qr.labelGu || qr.labelEn;
    return qr.labelEn;
  };

  const positionClasses =
    settings.position === 'left' ? 'left-3 sm:left-6' : 'right-3 sm:right-6';
  const desktopWindowSide =
    settings.position === 'left' ? 'sm:left-6 sm:right-auto' : 'sm:right-6 sm:left-auto';

  // Inline Customizer UI for Selecting Dish Sizes/Variants, Add-on Toppings & Cooking Note inside Chatbot
  const renderInlineDishCustomizer = (dish: MenuItem) => {
    if (customizingDishId !== dish.id) return null;

    const itemVariants = getDishVariants(dish.id);
    const itemAddonGroups = getDishAddonGroups(dish);
    const chosenVariantId = selectedVariantByDish[dish.id] || itemVariants[0]?.id;
    const chosenVariant = itemVariants.find(v => v.id === chosenVariantId) || itemVariants[0];
    const chosenAddonIds = selectedAddonsByDish[dish.id] || [];
    const allAddons = getAllAvailableAddonOptions();
    const chosenAddons = allAddons.filter(o => chosenAddonIds.includes(o.id));
    const addonsSum = chosenAddons.reduce((s, a) => s + a.price, 0);
    const customTotal = (chosenVariant ? chosenVariant.price : dish.price) + addonsSum;

    return (
      <div className="mt-2 p-2.5 rounded-xl bg-[#fff8f0] border border-[#e8281a]/40 space-y-2.5 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-[#e0d6c8] pb-1.5">
          <span className="text-[11px] font-extrabold text-[#1a1a1a]">
            ⚙️ Customize {dish.name}
          </span>
          <button
            type="button"
            onClick={() => setCustomizingDishId(null)}
            className="text-[10px] font-bold text-[#7a6e65] hover:text-[#e8281a] cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* 1. Size / Portion Variants */}
        {itemVariants.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5a524c]">
              Select Size / Option (Required):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {itemVariants.map(v => {
                const isSelected = (chosenVariant?.id || '') === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setSelectedVariantByDish(prev => ({ ...prev, [dish.id]: v.id }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e8281a] text-white border-[#e8281a]'
                        : 'bg-white text-[#1a1a1a] border-[#e0d6c8] hover:border-[#e8281a]'
                    }`}
                  >
                    {v.name} • {currency}
                    {v.price}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Extra Add-on Toppings / Sides */}
        {itemAddonGroups.map(({ group, options }) => (
          <div key={group.id} className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5a524c]">
              {group.name} (Optional Add-ons):
            </p>
            <div className="grid grid-cols-1 gap-1">
              {options.map(opt => {
                const isChecked = chosenAddonIds.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    onClick={() => handleToggleAddonForDish(dish.id, opt.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-[#e0d6c8] text-[#1a1a1a]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-[#c4b8aa] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </span>
                      <span>{opt.name}</span>
                    </span>
                    <span className="font-bold text-[#e8281a]">
                      +{currency}
                      {opt.price}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* 3. Special Cooking Note */}
        <input
          type="text"
          value={customNoteByDish[dish.id] || ''}
          onChange={e =>
            setCustomNoteByDish(prev => ({ ...prev, [dish.id]: e.target.value }))
          }
          placeholder="Cooking note (e.g., extra spicy, Jain, no onion)..."
          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#e0d6c8] text-[11px]"
        />

        {/* 4. Add Customized Item Button */}
        <button
          type="button"
          onClick={() => handleAddCustomizedDish(dish)}
          className="w-full py-2 px-3 rounded-xl bg-[#e8281a] hover:bg-[#c01e12] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            Add Selected Options to Order ({currency}
            {customTotal.toFixed(2)})
          </span>
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className={`fixed bottom-4 sm:bottom-5 ${positionClasses} z-40 flex items-center gap-3`}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white text-[#1a1a1a] px-4 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.14)] border border-[#e0d6c8] text-xs font-bold hover:scale-105 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f6a623]" />
            <span>
              {lang === 'hi'
                ? 'मेनू, ऑर्डर और लाइव स्टेटस'
                : lang === 'gu'
                ? 'મેનુ, ઓર્ડર અને લાઈવ સ્ટેટસ'
                : 'Order & Track Live in Chat'}
            </span>
          </button>
        )}

        <button
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="Open Restaurant Chatbot"
          className="w-13 h-13 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center shadow-[0_12px_35px_rgba(232,40,26,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
          style={{ backgroundColor: primaryColor }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#25D366] border-2 border-white animate-pulse" />
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed inset-x-2.5 bottom-3 sm:bottom-24 ${desktopWindowSide} z-50 w-auto sm:w-[420px] h-[calc(100dvh-4.5rem)] sm:h-[640px] max-h-[660px] bg-[#fff8f0] rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.28)] border border-[#e0d6c8] flex flex-col overflow-hidden animate-fadeIn`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {/* Header */}
          <div
            className="px-4 py-3.5 text-white flex items-center justify-between shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h4
                    className="font-bold text-sm sm:text-base leading-tight truncate"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {settings.botName || `${data.profile.name} Assistant`}
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
                </div>
                <p className="text-[11px] text-white/85 truncate">{settings.botSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Switcher */}
              <div className="flex items-center bg-black/20 rounded-xl p-0.5 text-[10px] font-bold">
                {(['en', 'hi', 'gu'] as ChatLang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => handleLanguageChange(l)}
                    className={`px-2 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                      lang === l ? 'bg-white text-[#1a1a1a]' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'ગુ'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleResetChat}
                title="Reset Conversation"
                className="p-2 rounded-xl hover:bg-white/15 text-white/90 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-2 rounded-xl hover:bg-white/15 text-white/90 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top Action Switcher Bar (Chat / Order in Chat / Track Order / Book Table / WhatsApp) */}
          <div className="px-3 py-2 bg-white border-b border-[#e0d6c8] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setActiveMode('chat')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeMode === 'chat'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-[#fff8f0] text-[#5a524c] hover:bg-[#f3e9dc]'
              }`}
            >
              💬 Chat
            </button>

            {settings.enableOrderPlacement && (
              <button
                type="button"
                onClick={() => setActiveMode('order_form')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMode === 'order_form'
                    ? 'bg-[#e8281a] text-white'
                    : 'bg-[#fff8f0] text-[#e8281a] border border-[#e8281a]/30 hover:bg-[#e8281a]/10'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order Now {itemCount > 0 ? `(${itemCount})` : ''}</span>
              </button>
            )}

            {settings.enableOrderStatusLookup && (
              <button
                type="button"
                onClick={() => setActiveMode('status_lookup')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMode === 'status_lookup'
                    ? 'bg-[#1a1a1a] text-white'
                    : 'bg-[#fff8f0] text-[#5a524c] hover:bg-[#f3e9dc]'
                }`}
              >
                <PackageSearch className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </button>
            )}

            {settings.enableTableBooking && (
              <button
                type="button"
                onClick={() => setActiveMode('table_booking')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMode === 'table_booking'
                    ? 'bg-[#1a1a1a] text-white'
                    : 'bg-[#fff8f0] text-[#5a524c] hover:bg-[#f3e9dc]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Table</span>
              </button>
            )}

            {settings.enableWhatsAppHandoff && (
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  recordChatInteraction(messages, undefined, 'WhatsApp Header Click', {
                    whatsappClicked: true,
                  })
                }
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366] hover:text-white transition-all cursor-pointer"
              >
                <PhoneCall className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          {/* MODE 1: IN-CHAT INSTANT ORDER CONFIRMATION PANEL (WITH FULL CATEGORY, OPTIONS & COUPON BROWSER) */}
          {activeMode === 'order_form' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fff8f0]">
              {/* 1A. Browse All Categories & Menu Products to Add Multiple Items + Customize Options */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#e0d6c8] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a]">
                    1. Select Dishes & Options
                  </h5>
                  <span className="text-[10px] font-semibold text-[#7a6e65]">
                    {data.items.filter(i => i.stockStatus === 'available').length} dishes available
                  </span>
                </div>

                {/* Category Filter Pills (All Categories from Menu) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setOrderSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      orderSelectedCategory === 'all'
                        ? 'bg-[#e8281a] text-white'
                        : 'bg-[#fff8f0] text-[#5a524c] border border-[#e0d6c8] hover:border-[#e8281a]'
                    }`}
                  >
                    All ({data.items.filter(i => i.stockStatus === 'available').length})
                  </button>
                  {data.categories
                    .filter(c => c.isActive)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(cat => {
                      const count = data.items.filter(
                        i => i.stockStatus === 'available' && i.categoryId === cat.id
                      ).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setOrderSelectedCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                            orderSelectedCategory === cat.id
                              ? 'bg-[#e8281a] text-white'
                              : 'bg-[#fff8f0] text-[#5a524c] border border-[#e0d6c8] hover:border-[#e8281a]'
                          }`}
                        >
                          {cat.name} ({count})
                        </button>
                      );
                    })}
                </div>

                {/* Quick Dish Search inside Order Form */}
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  placeholder="Search any dish (e.g., Paneer Toofani, Burger, Pizza)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />

                {/* All Matching Menu Products with Multi-Select (- / +) & ⚙️ Options Customizer */}
                <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {data.items
                    .filter(i => {
                      if (i.stockStatus !== 'available') return false;
                      if (
                        orderSelectedCategory !== 'all' &&
                        i.categoryId !== orderSelectedCategory
                      ) {
                        return false;
                      }
                      if (orderSearchQuery.trim()) {
                        const nq = normalizeFoodSearch(orderSearchQuery.trim());
                        const nn = normalizeFoodSearch(i.name);
                        const nd = normalizeFoodSearch(i.description || '');
                        return nn.includes(nq) || nd.includes(nq);
                      }
                      return true;
                    })
                    .map(dish => {
                      const matchingCartEntries = cart.filter(c => c.item.id === dish.id);
                      const qtyInCart = matchingCartEntries.reduce((s, c) => s + c.quantity, 0);
                      const primaryEntry = matchingCartEntries[0];
                      const hasOpts = dishHasOptions(dish);

                      return (
                        <div
                          key={dish.id}
                          className="p-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {dish.imageUrl && (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1a1a1a] truncate">
                                  {dish.name}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[11px] font-semibold text-[#e8281a]">
                                    {currency}
                                    {dish.price.toFixed(2)}
                                  </p>
                                  {hasOpts && (
                                    <button
                                      type="button"
                                      onClick={() => toggleDishOptionsPanel(dish)}
                                      className="text-[10px] font-bold text-[#1a1a1a] bg-white hover:bg-[#f6a623]/20 px-1.5 py-0.5 rounded border border-[#e0d6c8] cursor-pointer"
                                    >
                                      ⚙️ Options
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {qtyInCart > 0 && primaryEntry ? (
                              <div className="flex items-center gap-1 bg-white border border-[#e8281a] rounded-lg px-1.5 py-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    primaryEntry.quantity > 1
                                      ? updateQuantity(primaryEntry.cartItemId, -1)
                                      : removeFromCart(primaryEntry.cartItemId)
                                  }
                                  className="w-5 h-5 rounded-md bg-[#fff8f0] flex items-center justify-center text-xs cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-extrabold w-4 text-center">
                                  {qtyInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(primaryEntry.cartItemId, 1)}
                                  className="w-5 h-5 rounded-md bg-[#e8281a] text-white flex items-center justify-center text-xs cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickAddItem(dish)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#e8281a] text-white text-[11px] font-bold shrink-0 cursor-pointer"
                              >
                                + Add
                              </button>
                            )}
                          </div>

                          {/* Inline Options Selector inside Order Form */}
                          {renderInlineDishCustomizer(dish)}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 1B. Selected Cart Items Summary (Showing Sizes, Add-ons & Notes!) */}
              {cart.length > 0 && (
                <div className="bg-white rounded-2xl p-3.5 border border-[#e0d6c8] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a]">
                      Selected in Cart ({itemCount} items • {currency}
                      {subtotal.toFixed(2)})
                    </h5>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[11px] text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {cart.map(cItem => (
                      <div
                        key={cItem.cartItemId}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#1a1a1a] truncate">
                            {cItem.item.name}
                          </p>
                          {cItem.selectedVariant && (
                            <p className="text-[10px] font-semibold text-[#5a524c]">
                              Size: {cItem.selectedVariant.name}
                            </p>
                          )}
                          {cItem.selectedAddons && cItem.selectedAddons.length > 0 && (
                            <p className="text-[10px] text-emerald-700 font-medium truncate">
                              + {cItem.selectedAddons.map(a => a.name).join(', ')}
                            </p>
                          )}
                          {cItem.customerNote && (
                            <p className="text-[10px] italic text-amber-800 truncate">
                              Note: {cItem.customerNote}
                            </p>
                          )}
                          <p className="text-[11px] font-bold text-[#e8281a]">
                            {currency}
                            {cItem.lineTotal.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              cItem.quantity > 1
                                ? updateQuantity(cItem.cartItemId, -1)
                                : removeFromCart(cItem.cartItemId)
                            }
                            className="w-6 h-6 rounded-lg bg-white border border-[#e0d6c8] flex items-center justify-center text-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">
                            {cItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(cItem.cartItemId, 1)}
                            className="w-6 h-6 rounded-lg bg-white border border-[#e0d6c8] flex items-center justify-center text-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1C. Promo / Coupon Code Bar inside Order Form */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#e0d6c8] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a]">
                    🏷️ Apply Promo / Coupon Code
                  </span>
                  {appliedCouponCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCouponCode(null);
                        setCouponInput('');
                        setCouponFeedback('');
                      }}
                      className="text-[10px] font-bold text-red-600 cursor-pointer"
                    >
                      Remove ({appliedCouponCode})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (e.g., SMASH30, SARAB15)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCouponInChat()}
                    className="px-3 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#e8281a] text-white text-xs font-bold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                {activeOffers.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                    {activeOffers.map(off => (
                      <button
                        key={off.id}
                        type="button"
                        onClick={() => handleApplyCouponInChat(off.code)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap cursor-pointer transition-all ${
                          appliedCouponCode === off.code.toUpperCase()
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-[#fff8f0] text-[#1a1a1a] border-[#e0d6c8] hover:border-[#e8281a]'
                        }`}
                      >
                        🏷️ {off.code} ({off.discountBadge})
                      </button>
                    ))}
                  </div>
                )}

                {couponFeedback && (
                  <p className="text-[10.5px] font-semibold text-emerald-700">{couponFeedback}</p>
                )}
              </div>

              {/* Customer Details & Confirm Form */}
              <form
                onSubmit={handleConfirmOrderInChat}
                className="bg-white rounded-2xl p-4 border border-[#e0d6c8] shadow-xs space-y-3"
              >
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a]">
                  2. Customer & Delivery Details
                </h5>

                <div className="grid grid-cols-3 gap-1.5">
                  {(['delivery', 'takeaway', 'pickup'] as OrderType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOrderType(t)}
                      className={`py-2 rounded-xl text-[11px] font-bold capitalize border transition-all cursor-pointer ${
                        orderType === t
                          ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                          : 'bg-[#fff8f0] text-[#5a524c] border-[#e0d6c8]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Your Full Name *"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />

                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Mobile / WhatsApp Number (10 digits) *"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />

                {orderType === 'delivery' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#5a524c]">
                        Delivery Address & Pin *
                      </span>
                      {settings.enableLocationSharing !== false && (
                        <button
                          type="button"
                          onClick={() => handleDetectCustomerLocation('order_form')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold cursor-pointer border border-emerald-200"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{isLocating ? 'Detecting GPS...' : '📍 Share Live GPS Location'}</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Full Delivery Address, Landmark or GPS Pin *"
                      className="w-full px-3 py-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                    />
                  </div>
                )}

                <input
                  type="text"
                  value={specialNotes}
                  onChange={e => setSpecialNotes(e.target.value)}
                  placeholder="Special cooking note (e.g., extra spicy, no onion)"
                  className="w-full px-3 py-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />

                {orderError && (
                  <p className="text-[11px] text-red-600 font-semibold">{orderError}</p>
                )}

                <div className="pt-2 border-t border-[#e0d6c8] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#7a6e65]">
                    <span>Subtotal:</span>
                    <span>
                      {currency}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  {chatCouponDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-semibold">
                      <span>Coupon Discount ({appliedCouponCode}):</span>
                      <span>
                        -{currency}
                        {chatCouponDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {orderType === 'delivery' && (
                    <div className="flex items-center justify-between text-[#7a6e65]">
                      <span>Delivery Fee:</span>
                      <span>
                        {subtotal >= data.orderSettings.freeDeliveryThreshold || freeDeliveryByCoupon
                          ? 'FREE'
                          : `${currency}${data.orderSettings.deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-[#e0d6c8]">
                    <span className="text-[#1a1a1a] font-bold">Total Payable:</span>
                    <span className="text-base font-black text-[#e8281a]">
                      {currency}
                      {Math.max(
                        0,
                        subtotal -
                          chatCouponDiscount +
                          (orderType === 'delivery' &&
                          subtotal > 0 &&
                          subtotal < data.orderSettings.freeDeliveryThreshold &&
                          !freeDeliveryByCoupon
                            ? data.orderSettings.deliveryFee
                            : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Order in Chat (Send to Kitchen)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => submitChatbotOrder('whatsapp')}
                    className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Confirm & Send Order on WhatsApp</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: IN-CHAT LIVE ORDER STATUS TRACKER */}
          {activeMode === 'status_lookup' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fff8f0]">
              <form
                onSubmit={handleLookupOrderStatus}
                className="bg-white rounded-2xl p-5 border border-[#e0d6c8] shadow-xs space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center">
                    <PackageSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-[#1a1a1a]">
                      Track Live Order Status
                    </h5>
                    <p className="text-[11px] text-[#7a6e65]">
                      Enter your Order ID or Mobile Number
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={lookupQuery}
                  onChange={e => setLookupQuery(e.target.value)}
                  placeholder="e.g., ORD-4821 or 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Check Real-Time Status
                </button>
              </form>

              {orders.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-[#e0d6c8] space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7a6e65]">
                    Recent Active Orders on This Device:
                  </p>
                  {orders.slice(0, 3).map(ord => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setLookupQuery(ord.orderNumber);
                      }}
                      className="p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] flex items-center justify-between cursor-pointer hover:border-[#e8281a]"
                    >
                      <div>
                        <p className="text-xs font-black text-[#1a1a1a]">
                          #{ord.orderNumber} • {ord.customerName}
                        </p>
                        <p className="text-[11px] text-[#7a6e65]">
                          {ord.items.length} items • {currency}
                          {ord.total.toFixed(2)}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODE 3: IN-CHAT TABLE RESERVATION */}
          {activeMode === 'table_booking' && (
            <div className="flex-1 overflow-y-auto p-4 bg-[#fff8f0]">
              <form
                onSubmit={handleConfirmTableBooking}
                className="bg-white rounded-2xl p-5 border border-[#e0d6c8] shadow-xs space-y-3"
              >
                <h5 className="font-bold text-sm text-[#1a1a1a]">
                  🪑 Instant Table Reservation
                </h5>

                <input
                  type="text"
                  required
                  value={resName}
                  onChange={e => setResName(e.target.value)}
                  placeholder="Guest Full Name *"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />

                <input
                  type="tel"
                  required
                  value={resPhone}
                  onChange={e => setResPhone(e.target.value)}
                  placeholder="Mobile Number *"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={resPartySize}
                    onChange={e => setResPartySize(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                  >
                    {['2 People', '4 People', '6 People', '8+ People', 'Birthday Party'].map(
                      sz => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      )
                    )}
                  </select>

                  <input
                    type="date"
                    value={resDate}
                    onChange={e => setResDate(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                  />
                </div>

                <input
                  type="text"
                  value={resTime}
                  onChange={e => setResTime(e.target.value)}
                  placeholder="Preferred Time (e.g., 07:30 PM)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-white text-xs font-bold cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Confirm Table Booking
                </button>
              </form>
            </div>
          )}

          {/* MODE 4: MAIN CONVERSATION MESSAGES AREA */}
          {activeMode === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.map(msg => {
                  const liveOrder = msg.orderId
                    ? orders.find(o => o.id === msg.orderId)
                    : undefined;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line shadow-xs ${
                          msg.sender === 'user'
                            ? 'text-white rounded-br-none'
                            : 'bg-white text-[#1a1a1a] border border-[#e0d6c8] rounded-bl-none'
                        }`}
                        style={
                          msg.sender === 'user' ? { backgroundColor: primaryColor } : undefined
                        }
                      >
                        {msg.text}
                      </div>

                      {/* CUSTOMER SHARED LIVE GPS PIN LINK */}
                      {msg.customerSharedLocationUrl && (
                        <a
                          href={msg.customerSharedLocationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold shadow-xs"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Open Shared GPS Pin on Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {/* RESTAURANT LOCATION & GOOGLE MAPS CARD */}
                      {msg.showLocationCard && (
                        <div className="mt-2.5 w-[92%] bg-white rounded-2xl p-3.5 border border-[#e0d6c8] shadow-sm space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-xs text-[#1a1a1a] truncate">
                                {locationTitle}
                              </h5>
                              <p className="text-[11px] text-[#5a524c] leading-snug mt-0.5">
                                {locationAddress}
                              </p>
                              {locationLandmark && (
                                <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                                  🧭 {locationLandmark}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <a
                              href={locationMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3 rounded-xl bg-[#1a1a1a] hover:bg-[#e8281a] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Google Maps</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {settings.enableLocationSharing !== false && (
                              <button
                                type="button"
                                onClick={() => handleDetectCustomerLocation('chat')}
                                className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Share My GPS</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* WHATSAPP SUPPORT HANDOFF CARD (Shown automatically when question is unanswered or requested) */}
                      {msg.showWhatsAppCard && settings.enableWhatsAppHandoff !== false && (
                        <div className="mt-2.5 w-[92%] bg-emerald-50/90 rounded-2xl p-3.5 border border-emerald-300 shadow-sm space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0">
                              <PhoneCall className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                                Direct WhatsApp Support (+{whatsappDigits})
                              </span>
                              <p className="text-[11px] text-emerald-950 leading-snug mt-0.5">
                                {getWhatsAppFallbackPrompt(lang)}
                              </p>
                            </div>
                          </div>

                          <a
                            href={buildWhatsAppUrl(msg.unansweredQuery)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              recordChatInteraction(
                                messages,
                                undefined,
                                'WhatsApp Fallback Click',
                                { whatsappClicked: true }
                              )
                            }
                            className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>
                              {lang === 'hi'
                                ? 'WhatsApp सपोर्ट पर सवाल भेजें'
                                : lang === 'gu'
                                ? 'WhatsApp સપોર્ટ પર પ્રશ્ન મોકલો'
                                : 'Send Question to WhatsApp Support'}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* INTERACTIVE SPECIAL OFFERS & 1-CLICK COUPON APPLICATION CARDS */}
                      {msg.offers && msg.offers.length > 0 && (
                        <div className="mt-2.5 w-full space-y-2">
                          {msg.offers.map(off => {
                            const isApplied = appliedCouponCode === off.code.toUpperCase();
                            return (
                              <div
                                key={off.id}
                                className="bg-white rounded-2xl p-3 border border-[#e0d6c8] flex items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded bg-[#f6a623] text-[#1a1a1a] text-[9.5px] font-extrabold uppercase">
                                      {off.discountBadge}
                                    </span>
                                    <span className="font-mono text-[11px] font-bold text-[#e8281a]">
                                      {off.code}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-[#1a1a1a] mt-0.5 truncate">
                                    {off.title}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleApplyCouponInChat(off.code);
                                    if (settings.enableOrderPlacement) {
                                      setActiveMode('order_form');
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                                    isApplied
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#1a1a1a] hover:bg-[#e8281a] text-white'
                                  }`}
                                >
                                  {isApplied ? '✓ Applied' : 'Apply Offer'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* LIVE ORDER STATUS CARD (Updates in real time when Admin changes status!) */}
                      {liveOrder && (
                        <div className="mt-2 w-[92%] bg-white rounded-2xl p-3.5 border-2 border-[#e8281a]/25 shadow-md space-y-2.5">
                          <div className="flex items-center justify-between border-b border-[#e0d6c8] pb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6e65] block">
                                Live Order Tracker
                              </span>
                              <span className="text-sm font-black text-[#1a1a1a]">
                                #{liveOrder.orderNumber}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                liveOrder.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : liveOrder.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              ● {liveOrder.status}
                            </span>
                          </div>

                          {/* 4-Step Visual Progress Tracker */}
                          {liveOrder.status !== 'cancelled' ? (
                            <div className="grid grid-cols-4 gap-1 pt-1">
                              {(
                                [
                                  { id: 'pending', label: 'Received', icon: Clock },
                                  { id: 'preparing', label: 'Cooking', icon: ChefHat },
                                  { id: 'ready', label: 'Ready', icon: CheckCircle2 },
                                  { id: 'delivered', label: 'Delivered', icon: Truck },
                                ] as const
                              ).map((step, idx) => {
                                const orderRanks = {
                                  pending: 0,
                                  preparing: 1,
                                  ready: 2,
                                  delivered: 3,
                                  cancelled: -1,
                                };
                                const currentRank = orderRanks[liveOrder.status] ?? 0;
                                const isDone = idx <= currentRank;
                                const StepIcon = step.icon;
                                return (
                                  <div
                                    key={step.id}
                                    className={`flex flex-col items-center p-1.5 rounded-xl text-center ${
                                      isDone
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-stone-100 text-stone-400'
                                    }`}
                                  >
                                    <StepIcon className="w-3.5 h-3.5 mb-0.5" />
                                    <span className="text-[9px] font-bold">{step.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-xl">
                              <XCircle className="w-4 h-4 shrink-0" />
                              <span>This order was cancelled.</span>
                            </div>
                          )}

                          <div className="text-[11px] text-[#5a524c] space-y-0.5">
                            {liveOrder.items.map((it, i) => (
                              <div key={i} className="flex justify-between">
                                <span>
                                  {it.quantity}x {it.name}
                                  {it.variantName ? ` (${it.variantName})` : ''}
                                </span>
                                <span className="font-semibold">
                                  {currency}
                                  {(it.lineTotal ?? it.unitPrice * it.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between font-bold text-[#1a1a1a] pt-1 border-t border-[#e0d6c8]">
                              <span>Total ({liveOrder.orderType})</span>
                              <span>
                                {currency}
                                {liveOrder.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Table Reservation Confirmation Card */}
                      {msg.reservationInfo && (
                        <div className="mt-2 w-[90%] bg-white rounded-2xl p-3.5 border border-emerald-300 shadow-xs text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-800">
                              ✅ Table Request Sent
                            </span>
                            <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              Pending Confirmation
                            </span>
                          </div>
                          <p className="text-[#1a1a1a] font-semibold">
                            {msg.reservationInfo.guestName} • {msg.reservationInfo.partySize}
                          </p>
                          <p className="text-[11px] text-[#7a6e65]">
                            📅 {msg.reservationInfo.date} at {msg.reservationInfo.time}
                          </p>
                        </div>
                      )}

                      {/* Interactive Category Selector Pills inside Chat */}
                      {msg.showCategoryBrowser && (
                        <div className="mt-2.5 w-full bg-white rounded-2xl p-2.5 border border-[#e0d6c8] shadow-2xs">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a6e65] mb-1.5">
                            {lang === 'hi'
                              ? '📂 कैटेगरी चुनें (सभी प्रोडक्ट्स देखें):'
                              : lang === 'gu'
                              ? '📂 કેટેગરી પસંદ કરો:'
                              : '📂 Browse by Category (Select Multiple Dishes):'}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectCategoryInChat('all')}
                              className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                                msg.selectedCategoryId === 'all'
                                  ? 'bg-[#e8281a] text-white'
                                  : 'bg-[#fff8f0] text-[#1a1a1a] border border-[#e0d6c8] hover:border-[#e8281a]'
                              }`}
                            >
                              All ({data.items.filter(i => i.stockStatus === 'available').length})
                            </button>
                            {data.categories
                              .filter(c => c.isActive)
                              .sort((a, b) => a.displayOrder - b.displayOrder)
                              .map(cat => {
                                const count = data.items.filter(
                                  i => i.stockStatus === 'available' && i.categoryId === cat.id
                                ).length;
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleSelectCategoryInChat(cat.id)}
                                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                                      msg.selectedCategoryId === cat.id
                                        ? 'bg-[#e8281a] text-white'
                                        : 'bg-[#fff8f0] text-[#1a1a1a] border border-[#e0d6c8] hover:border-[#e8281a]'
                                    }`}
                                  >
                                    {cat.name} ({count})
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Interactive Dish Cards with Multi-Select (- / +), ⚙️ Options & Direct Links inside Chat */}
                      {msg.items && msg.items.length > 0 && (
                        <div className="mt-2.5 w-full space-y-2 max-h-80 overflow-y-auto pr-1">
                          {msg.items.map(dish => {
                            const isAdded = addedItemIds[dish.id];
                            const matchingEntries = cart.filter(c => c.item.id === dish.id);
                            const qtyInCart = matchingEntries.reduce((s, c) => s + c.quantity, 0);
                            const primaryEntry = matchingEntries[0];
                            const catObj = data.categories.find(c => c.id === dish.categoryId);
                            const hasOpts = dishHasOptions(dish);

                            return (
                              <div
                                key={dish.id}
                                className="bg-white rounded-2xl p-2.5 border border-[#e0d6c8] space-y-2 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-2.5">
                                  {dish.imageUrl && (
                                    <img
                                      src={dish.imageUrl}
                                      alt={dish.name}
                                      className="w-12 h-12 rounded-xl object-cover shrink-0 cursor-pointer"
                                      onClick={() => handleOpenDishDirectLink(dish)}
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          dish.isVeg ? 'bg-green-600' : 'bg-red-600'
                                        }`}
                                      />
                                      <p className="font-bold text-xs text-[#1a1a1a] truncate">
                                        {dish.name}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      <p className="text-xs font-extrabold text-[#e8281a]">
                                        {currency}
                                        {dish.price.toFixed(2)}
                                      </p>
                                      {catObj && (
                                        <span className="text-[10px] text-[#7a6e65] bg-[#fff8f0] px-1.5 py-0.5 rounded-md border border-[#e0d6c8]">
                                          {catObj.name}
                                        </span>
                                      )}
                                      {hasOpts && (
                                        <button
                                          type="button"
                                          onClick={() => toggleDishOptionsPanel(dish)}
                                          className="text-[10px] font-bold text-[#1a1a1a] bg-[#fff8f0] hover:bg-[#f6a623]/25 px-1.5 py-0.5 rounded-md border border-[#e8281a]/30 cursor-pointer"
                                        >
                                          ⚙️ Options
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Multi-Item Selection: Inline - / + Stepper if in cart, otherwise + Add */}
                                  {qtyInCart > 0 && primaryEntry ? (
                                    <div className="flex items-center gap-1 bg-[#fff8f0] border-2 border-[#e8281a] rounded-xl px-1.5 py-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          primaryEntry.quantity > 1
                                            ? updateQuantity(primaryEntry.cartItemId, -1)
                                            : removeFromCart(primaryEntry.cartItemId)
                                        }
                                        className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-xs cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="text-xs font-extrabold w-4 text-center">
                                        {qtyInCart}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(primaryEntry.cartItemId, 1)}
                                        className="w-5 h-5 rounded-lg bg-[#e8281a] text-white flex items-center justify-center text-xs cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickAddItem(dish)}
                                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                                        isAdded
                                          ? 'bg-green-600 text-white'
                                          : 'bg-[#1a1a1a] hover:bg-[#e8281a] text-white'
                                      }`}
                                    >
                                      {isAdded ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>Added</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3 h-3" />
                                          <span>Add</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Inline Options Selector (Variants / Sizes + Add-on Toppings + Note) */}
                                {renderInlineDishCustomizer(dish)}

                                {/* Direct Action Links Row: Direct Dish Link in Menu + Direct Order Now */}
                                <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[#f3e9dc]">
                                  <a
                                    href={`#dish-${dish.id}`}
                                    onClick={e => {
                                      e.preventDefault();
                                      handleOpenDishDirectLink(dish);
                                    }}
                                    className="flex-1 py-1 px-2 rounded-lg bg-[#fff8f0] hover:bg-[#f3e9dc] text-[#1a1a1a] text-[10.5px] font-semibold flex items-center justify-center gap-1 border border-[#e0d6c8] cursor-pointer transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3 text-[#e8281a]" />
                                    <span>Direct Menu Link</span>
                                  </a>

                                  {settings.enableOrderPlacement && (
                                    <button
                                      type="button"
                                      onClick={() => handleDirectOrderDishInChat(dish)}
                                      className="flex-1 py-1 px-2 rounded-lg bg-[#e8281a]/10 hover:bg-[#e8281a] text-[#e8281a] hover:text-white text-[10.5px] font-bold flex items-center justify-center gap-1 border border-[#e8281a]/25 cursor-pointer transition-colors"
                                    >
                                      <ShoppingBag className="w-3 h-3" />
                                      <span>⚡ Direct Order</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <span className="text-[10px] text-[#7a6e65] mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Persistent Multi-Item Cart Summary Bar inside Chat (Place Order at the End!) */}
              {settings.enableOrderPlacement && itemCount > 0 && (
                <div className="px-3 py-2 bg-[#1a1a1a] text-white flex items-center justify-between gap-2 shrink-0 border-t border-[#e8281a]/40">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">
                      🛒 {itemCount} {itemCount === 1 ? 'Dish' : 'Dishes'} Selected ({currency}
                      {subtotal.toFixed(2)})
                    </p>
                    <p className="text-[9.5px] text-white/70 truncate">
                      Keep selecting more items or place order now
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMode('order_form')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#e8281a] hover:bg-[#c01e12] text-white text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Place Order →</span>
                  </button>
                </div>
              )}

              {/* Quick Action Chips (Configured in Admin Panel) */}
              {activeQuickReplies.length > 0 && (
                <div className="px-3 py-2 bg-white/90 border-t border-[#e0d6c8]/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {activeQuickReplies.map(chip => {
                    const label = getQuickChipLabel(chip);
                    return (
                      <button
                        key={chip.id}
                        onClick={() =>
                          handleSendMessage(
                            chip.action === 'custom_query' && chip.customQuery
                              ? chip.customQuery
                              : label,
                            chip.action
                          )
                        }
                        className="px-3 py-1.5 rounded-full bg-[#fff8f0] hover:bg-[#e8281a] text-[#1a1a1a] hover:text-white border border-[#e0d6c8] text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bottom Input Form with Location Pin Share Button */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-[#e0d6c8] flex items-center gap-1.5 shrink-0"
              >
                {settings.enableLocationSharing !== false && (
                  <button
                    type="button"
                    onClick={() => handleDetectCustomerLocation('chat')}
                    title="Share My Live GPS Location"
                    className="w-10 h-10 rounded-xl bg-[#fff8f0] hover:bg-emerald-50 text-[#5a524c] hover:text-emerald-700 border border-[#e0d6c8] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                )}

                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    lang === 'hi'
                      ? 'डिश, रेट, लोकेशन पूछें या Order ID लिखें...'
                      : lang === 'gu'
                      ? 'વાનગી, ભાવ પૂછો અથવા Order ID લખો...'
                      : 'Ask menu, price, location or Order ID...'
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a] placeholder-[#7a6e65] focus:outline-none focus:border-[#e8281a]"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
