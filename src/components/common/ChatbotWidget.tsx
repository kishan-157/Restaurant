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
} from '../../types';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';

type ChatLang = 'en' | 'hi' | 'gu';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  items?: MenuItem[];
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

  // In-Chat Order Status Lookup State
  const [lookupQuery, setLookupQuery] = useState('');

  // In-Chat Table Booking State
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resPartySize, setResPartySize] = useState('2 People');
  const [resDate, setResDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState('07:30 PM');

  const currency = data.profile.currencySymbol || '$';
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeMode]);

  // Keep welcome message synced when admin updates welcome text or language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome-msg') {
        return [
          {
            ...prev[0],
            text: getWelcomeText(lang),
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
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        sender: 'bot',
        text: getWelcomeText(newLang),
        timestamp: now,
      },
    ]);
  };

  const handleResetChat = () => {
    setActiveMode('chat');
    sessionIdRef.current = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    sessionStartedAtRef.current = new Date().toISOString();
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'bot',
        text: getWelcomeText(lang),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleQuickAddItem = (item: MenuItem) => {
    addToCart(item, undefined, [], 1, '');
    setIsCartOpen(false);
    setAddedItemIds(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [item.id]: false }));
    }, 1200);
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
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Core Knowledge Engine: Answers from Custom Admin Q&As + Live Website Data + Order Tracking
  const generateBotReply = (
    rawQuery: string,
    forcedAction?: ChatbotActionType
  ): {
    text: string;
    items?: MenuItem[];
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
    const activeOffers = data.offers.filter(o => o.isActive);

    // 0. Direct Forced Actions from Quick Reply Buttons
    if (forcedAction === 'order_now' && settings.enableOrderPlacement) {
      setActiveMode('order_form');
      return {
        text:
          lang === 'hi'
            ? '🛒 हमने चैट में ही ऑर्डर पैनल खोल दिया है! अपनी पसंद की डिश चुनें और तुरंत ऑर्डर कन्फर्म करें।'
            : lang === 'gu'
            ? '🛒 અમે ચેટમાં જ ઓર્ડર પેનલ ખોલી છે! તમારી મનપસંદ વાનગી પસંદ કરો અને તરત ઓર્ડર કન્फર્મ કરો.'
            : '🛒 I have opened the Instant Order Confirm panel below! Select your dishes, enter your details, and confirm your order right here.',
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

    // 4. Specific Dish Search (Name, Tag, or Description match)
    const matchedDishes = availableItems.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(q);
      const wordMatch = item.name
        .toLowerCase()
        .split(/\s+/)
        .some(w => w.length > 3 && q.includes(w));
      const tagMatch = (item.tags || []).some(t => q.includes(t.toLowerCase()));
      return nameMatch || wordMatch || tagMatch;
    });

    if (
      !forcedAction &&
      matchedDishes.length > 0 &&
      !q.includes('menu') &&
      !q.includes('मेनू') &&
      !q.includes('મેનુ')
    ) {
      const top = matchedDishes.slice(0, 4);
      const lines = top.map(i => {
        const itemVariants = data.variants.filter(
          v => v.menuItemId === i.id && v.isAvailable
        );
        const variantStr =
          itemVariants.length > 0
            ? ` (Sizes: ${itemVariants.map(v => `${v.name} ${currency}${v.price}`).join(', ')})`
            : '';
        return `• ${i.name} — ${currency}${i.price.toFixed(2)}${variantStr}`;
      });

      return {
        text:
          lang === 'hi'
            ? `🍽️ हमारे मेनू में यह उपलब्ध है:\n${lines.join('\n')}\n\nआप "+ Add" दबाकर सीधे चैट से ऑर्डर कन्फर्म कर सकते हैं!`
            : lang === 'gu'
            ? `🍽️ અમારા મેનુમાં આ ઉપલબ્ધ છે:\n${lines.join('\n')}\n\nતમે "+ Add" દબાવીને સીધો ચેટમાંથી જ ઓર્ડર કન્ફર્મ કરી શકો છો!`
            : `🍽️ Here are the matching dishes & prices from our live menu:\n${lines.join('\n')}\n\nTap "+ Add" on any card below to order right inside chat!`,
        items: settings.enableDishCards ? top : undefined,
        matchedTopic: 'Menu Dish Inquiry',
      };
    }

    // 5. Category Match
    const matchedCat = activeCategories.find(
      c => q.includes(c.name.toLowerCase()) || q.includes(c.slug.toLowerCase())
    );
    if (!forcedAction && matchedCat) {
      const catItems = availableItems.filter(i => i.categoryId === matchedCat.id);
      const list = catItems
        .slice(0, 5)
        .map(i => `• ${i.name}: ${currency}${i.price.toFixed(2)}`)
        .join('\n');
      return {
        text: `🍴 ${matchedCat.name} (${catItems.length} dishes):\n${list}`,
        items: settings.enableDishCards ? catItems.slice(0, 4) : undefined,
        matchedTopic: `Category: ${matchedCat.name}`,
      };
    }

    // 6. Best Sellers / Popular
    if (
      forcedAction === 'bestsellers' ||
      q.includes('best') ||
      q.includes('popular') ||
      q.includes('special') ||
      q.includes('बेस्ट') ||
      q.includes('બેસ્ટ')
    ) {
      const best = availableItems.filter(i => i.isBestseller).slice(0, 4);
      const list = best.map(i => `⭐ ${i.name} — ${currency}${i.price.toFixed(2)}`).join('\n');
      return {
        text:
          lang === 'hi'
            ? `🔥 हमारे सबसे लोकप्रिय बेस्टसेलर डिश:\n${list}`
            : lang === 'gu'
            ? `🔥 અમારી સૌથી લોકપ્રિય બેસ્ટસેલર વાનગીઓ:\n${list}`
            : `🔥 Our Top-Rated Best Sellers:\n${list}`,
        items: settings.enableDishCards ? best : undefined,
        matchedTopic: 'Best Sellers',
      };
    }

    // 7. Pure Veg
    if (
      forcedAction === 'veg_menu' ||
      q.includes('veg') ||
      q.includes('vegetarian') ||
      q.includes('शाकाहारी') ||
      q.includes('વેજ')
    ) {
      const vegItems = availableItems.filter(i => i.isVeg);
      const list = vegItems
        .slice(0, 5)
        .map(i => `🌿 ${i.name} — ${currency}${i.price.toFixed(2)}`)
        .join('\n');
      return {
        text:
          lang === 'hi'
            ? `🌿 हमारे पास ${vegItems.length} शुद्ध शाकाहारी (Veg) डिश उपलब्ध हैं:\n${list}`
            : lang === 'gu'
            ? `🌿 અમારી પાસે ${vegItems.length} શુદ્ધ શાકાહારી (Veg) વાનગીઓ ઉપલબ્ધ છે:\n${list}`
            : `🌿 We have ${vegItems.length} Vegetarian dishes available:\n${list}`,
        items: settings.enableDishCards ? vegItems.slice(0, 4) : undefined,
        matchedTopic: 'Vegetarian Menu',
      };
    }

    // 8. Full Menu & Prices
    if (
      forcedAction === 'menu' ||
      q.includes('menu') ||
      q.includes('price') ||
      q.includes('food') ||
      q.includes('dish') ||
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
      const featured = availableItems.slice(0, 4);
      return {
        text:
          lang === 'hi'
            ? `📋 ${data.profile.name} का लाइव मेनू (${availableItems.length} उपलब्ध डिश):\n${catSummary}\n\nकिसी भी कैटेगरी या डिश का नाम लिखें या नीचे से सीधे ऑर्डर में जोड़ें:`
            : lang === 'gu'
            ? `📋 ${data.profile.name} નું લાઈવ મેનુ (${availableItems.length} વાનગીઓ):\n${catSummary}\n\nકોઈપણ વાનગીનું નામ લખો અથવા નીચેથી સીધા ઓર્ડરમાં ઉમેરો:`
            : `📋 ${data.profile.name} Live Menu (${availableItems.length} dishes across ${activeCategories.length} categories):\n${catSummary}\n\nTap "+ Add" below or ask for any dish price!`,
        items: settings.enableDishCards ? featured : undefined,
        matchedTopic: 'Full Menu Overview',
      };
    }

    // 9. Special Offers & Deals
    if (
      forcedAction === 'offers' ||
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
        matchedTopic: 'Special Offers & Coupons',
      };
    }

    // 10. Opening Hours & Location (with Interactive Google Maps Location Card!)
    if (
      forcedAction === 'hours' ||
      forcedAction === 'location' ||
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
      const scheduleLines = Object.entries(data.openingHours.schedule)
        .map(([day, s]) => `• ${day}: ${s.isOpen ? `${s.openTime} - ${s.closeTime}` : 'Closed'}`)
        .join('\n');
      return {
        text: `🕒 ${data.openingHours.topbarHoursText}\n📍 ${locationTitle}\n${locationAddress}${
          locationLandmark ? `\n🧭 Landmark: ${locationLandmark}` : ''
        }\n📞 Phone: ${data.profile.phone}\n\nWeekly Schedule:\n${scheduleLines}`,
        showLocationCard: true,
        matchedTopic: 'Location & Opening Hours',
      };
    }

    // 11. Delivery Info
    if (
      forcedAction === 'delivery' ||
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
    if (forcedAction === 'chefs' || q.includes('chef') || q.includes('cook')) {
      const chefs = data.chefs || [];
      const lines = chefs.map(c => `👨‍🍳 ${c.name} — ${c.role}`).join('\n');
      return {
        text: lines || `👨‍🍳 Executive Chef: ${data.sectionContents?.about?.chefName || 'Master Chef'}`,
        matchedTopic: 'Chefs & Kitchen Team',
      };
    }

    // 13. FAQs list
    if (forcedAction === 'faq' || q.includes('faq') || q.includes('help')) {
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
        matchedTopic: 'Greeting',
      };
    }

    // Default Fallback -> Unanswered Question!
    // Triggers Unanswered Queue logging + WhatsApp Support Handoff Card
    return {
      text: getFallbackText(lang),
      items: settings.enableDishCards ? availableItems.slice(0, 2) : undefined,
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

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // --- Confirm Order Directly Inside Chatbot ---
  const handleConfirmOrderInChat = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    if (cart.length === 0) {
      setOrderError('Please add at least 1 dish to your order first.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderError('Please enter your Name and Phone Number.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setOrderError('Please enter your Delivery Address.');
      return;
    }

    const os = data.orderSettings;
    const deliveryFee =
      orderType === 'delivery'
        ? subtotal >= os.freeDeliveryThreshold
          ? 0
          : os.deliveryFee
        : 0;
    const finalTotal = Number((subtotal + deliveryFee).toFixed(2));

    const createdOrder = addOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : '',
      specialInstructions: specialNotes.trim(),
      items: cart.map(c => ({
        id: c.cartItemId,
        name: c.item.name,
        variantName: c.selectedVariant?.name,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        lineTotal: c.lineTotal,
        addonNames: c.selectedAddons?.map(a => a.name),
        isVeg: c.item.isVeg,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      total: finalTotal,
      channel: 'admin',
      status: 'pending',
      notes: 'Confirmed via Website Smart Chatbot',
    });

    clearCart();
    setActiveMode('chat');

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const confirmBotMsg: ChatMessage = {
      id: `ord-confirm-${Date.now()}`,
      sender: 'bot',
      text: `🎉 Order Confirmed! (#${createdOrder.orderNumber})\n\n${settings.orderConfirmationNote}`,
      timestamp: now,
      orderId: createdOrder.id,
    };

    const nextMessages = [...messages, confirmBotMsg];
    setMessages(nextMessages);
    recordChatInteraction(nextMessages, undefined, 'Order Confirmed in Chat', {
      orderPlaced: true,
      customerNameOverride: customerName.trim(),
      customerPhoneOverride: customerPhone.trim(),
    });
  };

  // --- Lookup Order Status Directly Inside Chatbot ---
  const handleLookupOrderStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    const matched = findMatchingOrder(lookupQuery);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

          {/* MODE 1: IN-CHAT INSTANT ORDER CONFIRMATION PANEL */}
          {activeMode === 'order_form' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fff8f0]">
              <div className="bg-white rounded-2xl p-4 border border-[#e0d6c8] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a]">
                    1. Your Selected Dishes ({itemCount})
                  </h5>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[11px] text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-[#7a6e65]">
                      Tap any popular dish below to add to your order:
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                      {data.items
                        .filter(i => i.stockStatus === 'available')
                        .slice(0, 6)
                        .map(dish => (
                          <div
                            key={dish.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8]"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-[#1a1a1a] truncate">
                                {dish.name}
                              </p>
                              <p className="text-[11px] font-semibold text-[#e8281a]">
                                {currency}
                                {dish.price.toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAddItem(dish)}
                              className="px-3 py-1.5 rounded-lg bg-[#e8281a] text-white text-[11px] font-bold shrink-0 cursor-pointer"
                            >
                              + Add
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(cItem => (
                      <div
                        key={cItem.cartItemId}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#1a1a1a] truncate">
                            {cItem.item.name}
                          </p>
                          <p className="text-[11px] text-[#7a6e65]">
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
                  placeholder="Mobile / WhatsApp Number *"
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

                <div className="pt-2 border-t border-[#e0d6c8] flex items-center justify-between text-xs">
                  <span className="text-[#7a6e65] font-medium">Total Payable:</span>
                  <span className="text-base font-black text-[#1a1a1a]">
                    {currency}
                    {(
                      subtotal +
                      (orderType === 'delivery' &&
                      subtotal > 0 &&
                      subtotal < data.orderSettings.freeDeliveryThreshold
                        ? data.orderSettings.deliveryFee
                        : 0)
                    ).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Order Now</span>
                </button>
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

                      {/* Interactive Dish Cards inside Chat */}
                      {msg.items && msg.items.length > 0 && (
                        <div className="mt-2.5 w-full space-y-2">
                          {msg.items.map(dish => {
                            const isAdded = addedItemIds[dish.id];
                            return (
                              <div
                                key={dish.id}
                                className="bg-white rounded-2xl p-2.5 border border-[#e0d6c8] flex items-center justify-between gap-2.5 shadow-2xs"
                              >
                                {dish.imageUrl && (
                                  <img
                                    src={dish.imageUrl}
                                    alt={dish.name}
                                    className="w-12 h-12 rounded-xl object-cover shrink-0"
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
                                  <p className="text-xs font-extrabold text-[#e8281a] mt-0.5">
                                    {currency}
                                    {dish.price.toFixed(2)}
                                  </p>
                                </div>

                                <button
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
                              </div>
                            );
                          })}

                          {settings.enableOrderPlacement && itemCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setActiveMode('order_form')}
                              className="w-full py-2 rounded-xl bg-[#e8281a] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>
                                Confirm Order in Chat ({itemCount} items • {currency}
                                {subtotal.toFixed(2)})
                              </span>
                            </button>
                          )}
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
