import React, { useState } from 'react';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Zap,
  Globe,
  ShoppingBag,
  PackageSearch,
  Calendar,
  ArrowUp,
  ArrowDown,
  MapPin,
  PhoneCall,
  BarChart3,
  AlertCircle,
  Save,
  Eye,
  Navigation,
  ExternalLink,
  Check,
  User,
  Clock,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import {
  ChatbotActionType,
  ChatbotCustomQA,
  ChatbotQuickReply,
  ChatbotSessionLog,
  ChatbotSettings,
  ChatbotUnansweredQuestion,
} from '../../../types';
import { DEFAULT_RESTAURANT_DATA } from '../../../data/defaultRestaurantData';

interface AdminChatbotProps {
  showToast: (msg: string, type?: string) => void;
}

const ACTION_OPTIONS: { value: ChatbotActionType; label: string }[] = [
  { value: 'order_now', label: '⚡ Open In-Chat Order Confirmation Form' },
  { value: 'order_status', label: '📦 Open Live Order Status Tracker' },
  { value: 'book_table', label: '🪑 Open In-Chat Table Reservation Form' },
  { value: 'menu', label: '🍔 Show Full Menu & Categories' },
  { value: 'bestsellers', label: '⭐ Show Best Seller Dishes' },
  { value: 'veg_menu', label: '🌿 Show Pure Vegetarian Dishes' },
  { value: 'offers', label: '🔥 Show Special Offers & Promo Codes' },
  { value: 'hours', label: '📍 Show Opening Hours & Location Map Card' },
  { value: 'location', label: '🗺️ Show Address & Google Maps Card' },
  { value: 'delivery', label: '🛵 Show Delivery Fee, Time & Min Order' },
  { value: 'chefs', label: '👨‍🍳 Show Master Chefs Info' },
  { value: 'faq', label: '❓ Show Website FAQs' },
  { value: 'custom_query', label: '💬 Trigger Custom Keyword / Question' },
];

// Auto-extract meaningful comma-separated keywords from a customer's question
const extractKeywordsFromQuestion = (question: string): string => {
  const stopWords = new Set([
    'what',
    'where',
    'when',
    'how',
    'is',
    'are',
    'the',
    'do',
    'you',
    'have',
    'can',
    'i',
    'get',
    'in',
    'on',
    'at',
    'for',
    'to',
    'of',
    'and',
    'or',
    'please',
    'tell',
    'me',
    'about',
    'your',
    'kya',
    'hai',
    'mein',
    'ka',
    'ki',
    'ke',
    'milta',
    'milega',
    'chahiye',
    'batao',
  ]);
  const words = question
    .toLowerCase()
    .replace(/[?!.,;:'"()]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !stopWords.has(w));
  const unique = Array.from(new Set(words));
  return unique.length > 0 ? unique.join(', ') : question.trim().toLowerCase();
};

export const AdminChatbot: React.FC<AdminChatbotProps> = ({ showToast }) => {
  const { data, updateChatbotSettings } = useRestaurant();

  // Initialize local editable state so every input is 100% responsive and smooth
  const [draft, setDraft] = useState<ChatbotSettings>(() => ({
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
  }));

  const [activeSubTab, setActiveSubTab] = useState<
    'general' | 'messages' | 'quick_replies' | 'custom_qa' | 'unanswered' | 'analytics'
  >('general');

  // New Quick Reply Form State
  const [newQrLabelEn, setNewQrLabelEn] = useState('');
  const [newQrLabelHi, setNewQrLabelHi] = useState('');
  const [newQrLabelGu, setNewQrLabelGu] = useState('');
  const [newQrAction, setNewQrAction] = useState<ChatbotActionType>('custom_query');
  const [newQrCustomQuery, setNewQrCustomQuery] = useState('');

  // New Custom Q&A Form State
  const [newQaTitle, setNewQaTitle] = useState('');
  const [newQaKeywords, setNewQaKeywords] = useState('');
  const [newQaAnswerEn, setNewQaAnswerEn] = useState('');
  const [newQaAnswerHi, setNewQaAnswerHi] = useState('');
  const [newQaAnswerGu, setNewQaAnswerGu] = useState('');
  const [newQaAttachLocation, setNewQaAttachLocation] = useState(false);
  const [newQaAttachWhatsApp, setNewQaAttachWhatsApp] = useState(false);

  // Unanswered Question Template Builder State
  const [trainingUnansweredId, setTrainingUnansweredId] = useState<string | null>(null);
  const [tplTitle, setTplTitle] = useState('');
  const [tplKeywords, setTplKeywords] = useState('');
  const [tplAnswerEn, setTplAnswerEn] = useState('');
  const [tplAnswerHi, setTplAnswerHi] = useState('');
  const [tplAnswerGu, setTplAnswerGu] = useState('');
  const [tplAttachLocation, setTplAttachLocation] = useState(false);
  const [tplAttachWhatsApp, setTplAttachWhatsApp] = useState(false);

  // Selected Chat Session in Analytics Tab
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDetectingAdminGps, setIsDetectingAdminGps] = useState(false);

  // Live unanswered & chatLogs from context (so new customer chats appear immediately)
  const unansweredList: ChatbotUnansweredQuestion[] =
    data.chatbotSettings?.unansweredQuestions || draft.unansweredQuestions || [];
  const pendingUnansweredCount = unansweredList.filter(u => u.status === 'pending').length;
  const chatLogsList: ChatbotSessionLog[] =
    data.chatbotSettings?.chatLogs || draft.chatLogs || [];

  // Helper to update local draft AND persist to context immediately
  const updateField = <K extends keyof ChatbotSettings>(
    key: K,
    value: ChatbotSettings[K]
  ) => {
    setDraft(prev => {
      const next = { ...prev, [key]: value };
      updateChatbotSettings({ [key]: value });
      return next;
    });
  };

  const handleSaveAllChanges = () => {
    updateChatbotSettings({
      ...draft,
      unansweredQuestions: unansweredList,
      chatLogs: chatLogsList,
    });
    showToast('All Chatbot settings, Q&A templates, location & WhatsApp rules saved!', 'success');
  };

  const handleResetDefaults = () => {
    const def = JSON.parse(
      JSON.stringify(DEFAULT_RESTAURANT_DATA.chatbotSettings!)
    ) as ChatbotSettings;
    setDraft(def);
    updateChatbotSettings(def);
    showToast('Chatbot settings restored to defaults!', 'info');
  };

  // Detect Restaurant GPS Coordinates for Admin Location Setup
  const handleDetectRestaurantGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser.', 'error');
      return;
    }
    setIsDetectingAdminGps(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsDetectingAdminGps(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        setDraft(prev => {
          const next = {
            ...prev,
            customLatitude: lat,
            customLongitude: lng,
            customLocationMapsUrl: mapsUrl,
          };
          updateChatbotSettings({
            customLatitude: lat,
            customLongitude: lng,
            customLocationMapsUrl: mapsUrl,
          });
          return next;
        });
        showToast(`GPS Pin updated (${lat}, ${lng})!`, 'success');
      },
      () => {
        setIsDetectingAdminGps(false);
        showToast('Could not detect GPS automatically. Paste your Google Maps link below.', 'info');
      }
    );
  };

  // --- Quick Reply Handlers ---
  const handleAddQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQrLabelEn.trim()) {
      showToast('Please enter the button label in English.', 'error');
      return;
    }

    const newChip: ChatbotQuickReply = {
      id: `qr-${Date.now()}`,
      labelEn: newQrLabelEn.trim(),
      labelHi: newQrLabelHi.trim() || newQrLabelEn.trim(),
      labelGu: newQrLabelGu.trim() || newQrLabelEn.trim(),
      action: newQrAction,
      customQuery: newQrAction === 'custom_query' ? newQrCustomQuery.trim() : undefined,
      isActive: true,
    };

    const nextQrs = [...draft.quickReplies, newChip];
    updateField('quickReplies', nextQrs);

    setNewQrLabelEn('');
    setNewQrLabelHi('');
    setNewQrLabelGu('');
    setNewQrCustomQuery('');
    showToast('Quick Reply button added!', 'success');
  };

  const handleUpdateQuickReplyField = (
    id: string,
    field: keyof ChatbotQuickReply,
    value: string | boolean
  ) => {
    const updated = draft.quickReplies.map(qr =>
      qr.id === id ? { ...qr, [field]: value } : qr
    );
    updateField('quickReplies', updated);
  };

  const handleMoveQuickReply = (index: number, direction: 'up' | 'down') => {
    const list = [...draft.quickReplies];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateField('quickReplies', list);
  };

  const handleDeleteQuickReply = (id: string) => {
    updateField(
      'quickReplies',
      draft.quickReplies.filter(qr => qr.id !== id)
    );
    showToast('Quick Reply removed.', 'info');
  };

  // --- Custom Q&A Handlers ---
  const handleAddCustomQA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQaTitle.trim() || !newQaKeywords.trim() || !newQaAnswerEn.trim()) {
      showToast('Please fill Question Title, Trigger Keywords, and English Answer.', 'error');
      return;
    }

    const newQa: ChatbotCustomQA = {
      id: `qa-${Date.now()}`,
      questionTitle: newQaTitle.trim(),
      keywords: newQaKeywords.trim(),
      answerEn: newQaAnswerEn.trim(),
      answerHi: newQaAnswerHi.trim() || newQaAnswerEn.trim(),
      answerGu: newQaAnswerGu.trim() || newQaAnswerEn.trim(),
      attachLocationCard: newQaAttachLocation,
      attachWhatsAppButton: newQaAttachWhatsApp,
      isActive: true,
    };

    const nextQAs = [newQa, ...draft.customQAs];
    updateField('customQAs', nextQAs);

    setNewQaTitle('');
    setNewQaKeywords('');
    setNewQaAnswerEn('');
    setNewQaAnswerHi('');
    setNewQaAnswerGu('');
    setNewQaAttachLocation(false);
    setNewQaAttachWhatsApp(false);
    showToast('Custom Q&A rule added to Chatbot!', 'success');
  };

  const handleUpdateQAField = (
    id: string,
    field: keyof ChatbotCustomQA,
    value: string | boolean
  ) => {
    const updated = draft.customQAs.map(qa =>
      qa.id === id ? { ...qa, [field]: value } : qa
    );
    updateField('customQAs', updated);
  };

  const handleDeleteQA = (id: string) => {
    updateField(
      'customQAs',
      draft.customQAs.filter(qa => qa.id !== id)
    );
    showToast('Custom Q&A removed.', 'info');
  };

  // --- Unanswered Question -> 1-Click Template Builder ---
  const openTemplateBuilderFromQuestion = (
    questionText: string,
    unansweredId?: string
  ) => {
    setTrainingUnansweredId(unansweredId || 'manual');
    setTplTitle(questionText.trim());
    setTplKeywords(extractKeywordsFromQuestion(questionText));
    setTplAnswerEn('');
    setTplAnswerHi('');
    setTplAnswerGu('');
    setTplAttachLocation(
      questionText.toLowerCase().includes('where') ||
        questionText.toLowerCase().includes('location') ||
        questionText.toLowerCase().includes('address')
    );
    setTplAttachWhatsApp(false);
    setActiveSubTab('unanswered');
  };

  const handleSaveTrainedTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim() || !tplKeywords.trim() || !tplAnswerEn.trim()) {
      showToast('Please enter Keywords and Answer for this template.', 'error');
      return;
    }

    const createdQaId = `qa-trained-${Date.now()}`;
    const newQa: ChatbotCustomQA = {
      id: createdQaId,
      questionTitle: tplTitle.trim(),
      keywords: tplKeywords.trim(),
      answerEn: tplAnswerEn.trim(),
      answerHi: tplAnswerHi.trim() || tplAnswerEn.trim(),
      answerGu: tplAnswerGu.trim() || tplAnswerEn.trim(),
      attachLocationCard: tplAttachLocation,
      attachWhatsAppButton: tplAttachWhatsApp,
      isActive: true,
    };

    const nextQAs = [newQa, ...draft.customQAs];
    const nextUnanswered = unansweredList.map(u =>
      u.id === trainingUnansweredId ||
      u.questionText.toLowerCase() === tplTitle.trim().toLowerCase()
        ? { ...u, status: 'resolved' as const, resolvedQAId: createdQaId }
        : u
    );

    setDraft(prev => ({
      ...prev,
      customQAs: nextQAs,
      unansweredQuestions: nextUnanswered,
    }));

    updateChatbotSettings({
      customQAs: nextQAs,
      unansweredQuestions: nextUnanswered,
    });

    setTrainingUnansweredId(null);
    setTplTitle('');
    setTplKeywords('');
    setTplAnswerEn('');
    setTplAnswerHi('');
    setTplAnswerGu('');
    showToast('Bot trained! It will now automatically answer this question.', 'success');
  };

  const handleDeleteUnanswered = (id: string) => {
    const next = unansweredList.filter(u => u.id !== id);
    setDraft(prev => ({ ...prev, unansweredQuestions: next }));
    updateChatbotSettings({ unansweredQuestions: next });
    showToast('Removed from unanswered list.', 'info');
  };

  const handleClearChatLogs = () => {
    setDraft(prev => ({ ...prev, chatLogs: [] }));
    updateChatbotSettings({ chatLogs: [] });
    setSelectedSessionId(null);
    showToast('Chat history logs cleared.', 'info');
  };

  // --- Analytics Calculations ---
  const totalSessions = chatLogsList.length;
  const totalUserMessages = chatLogsList.reduce(
    (sum, s) => sum + s.messages.filter(m => m.sender === 'user').length,
    0
  );
  const totalUnansweredInLogs = chatLogsList.reduce(
    (sum, s) => sum + (s.unansweredCount || 0),
    0
  );
  const autoAnsweredCount = Math.max(0, totalUserMessages - totalUnansweredInLogs);
  const accuracyRate =
    totalUserMessages > 0
      ? Math.round((autoAnsweredCount / totalUserMessages) * 100)
      : 100;
  const totalChatOrders = chatLogsList.filter(s => s.orderPlaced).length;
  const totalWhatsAppClicks = chatLogsList.filter(s => s.whatsappClicked).length;

  // Topic Frequency Map
  const topicCounts: Record<string, number> = {};
  chatLogsList.forEach(sess => {
    sess.messages.forEach(m => {
      if (m.sender === 'bot' && m.matchedTopic) {
        topicCounts[m.matchedTopic] = (topicCounts[m.matchedTopic] || 0) + 1;
      }
    });
  });
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const selectedSession =
    chatLogsList.find(s => s.id === selectedSessionId) || chatLogsList[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Master Controls */}
      <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-extrabold text-[#1a1a1a]">
                Smart Restaurant Chatbot, Analytics & Training Studio
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  draft.enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {draft.enabled ? '● Active on Website' : '○ Disabled'}
              </span>
            </div>
            <p className="text-xs text-[#7a6e65] mt-1 max-w-2xl">
              Customize every message, edit all Q&A rules, configure WhatsApp Support fallback &
              Location sharing, analyze customer chats, and train the bot on unanswered questions in
              1 click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleSaveAllChanges}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Changes</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#fff8f0] hover:bg-[#f3e9dc] text-[#5a524c] border border-[#e0d6c8] text-xs font-semibold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextState = !draft.enabled;
              updateField('enabled', nextState);
              showToast(
                nextState ? 'Chatbot enabled on website!' : 'Chatbot hidden on website.',
                'success'
              );
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              draft.enabled
                ? 'bg-[#1a1a1a] text-white hover:bg-stone-800'
                : 'bg-[#e8281a] text-white hover:bg-[#c01f12]'
            }`}
          >
            {draft.enabled ? 'Disable Chatbot' : 'Enable Chatbot'}
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            {
              id: 'general',
              label: '1. Identity, WhatsApp & Location',
              icon: Sparkles,
            },
            {
              id: 'messages',
              label: '2. Welcome & Fallback Text',
              icon: MessageSquare,
            },
            {
              id: 'quick_replies',
              label: `3. Quick Buttons (${draft.quickReplies.length})`,
              icon: Zap,
            },
            {
              id: 'custom_qa',
              label: `4. Auto-Reply Q&As (${draft.customQAs.length})`,
              icon: HelpCircle,
            },
            {
              id: 'unanswered',
              label: `5. Unanswered Queue (${pendingUnansweredCount})`,
              icon: AlertCircle,
              badge: pendingUnansweredCount,
            },
            {
              id: 'analytics',
              label: `6. Customer Chats & Analytics (${totalSessions})`,
              icon: BarChart3,
            },
          ] as const
        ).map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#e8281a] text-white shadow-sm'
                  : 'bg-white text-[#5a524c] border border-[#e0d6c8] hover:bg-[#fff8f0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {'badge' in tab && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-[#e8281a]' : 'bg-[#e8281a] text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL APPEARANCE, WHATSAPP FALLBACK & LOCATION SETTINGS */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bot Identity & Appearance */}
            <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4">
              <h4 className="font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#e8281a]" />
                <span>Chatbot Identity & Appearance (Editable)</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Assistant Name
                </label>
                <input
                  type="text"
                  value={draft.botName}
                  onChange={e => updateField('botName', e.target.value)}
                  placeholder="e.g., Sarab Smart Concierge"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-medium text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Header Subtitle / Status Line
                </label>
                <input
                  type="text"
                  value={draft.botSubtitle}
                  onChange={e => updateField('botSubtitle', e.target.value)}
                  placeholder="e.g., Instant Menu, Order Confirm & Live Status"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-medium text-[#1a1a1a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                    Widget Screen Position
                  </label>
                  <select
                    value={draft.position}
                    onChange={e =>
                      updateField('position', e.target.value as 'right' | 'left')
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a]"
                  >
                    <option value="right">Bottom Right</option>
                    <option value="left">Bottom Left</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                    Default Chat Language
                  </label>
                  <select
                    value={draft.defaultLanguage}
                    onChange={e =>
                      updateField(
                        'defaultLanguage',
                        e.target.value as 'en' | 'hi' | 'gu'
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a]"
                  >
                    <option value="en">English (EN)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="gu">Gujarati (ગુજરાતી)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                    Theme Color Mode
                  </label>
                  <select
                    value={draft.useBrandColor ? 'brand' : 'custom'}
                    onChange={e =>
                      updateField('useBrandColor', e.target.value === 'brand')
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a]"
                  >
                    <option value="brand">Match Website Brand Color</option>
                    <option value="custom">Use Custom Bot Color</option>
                  </select>
                </div>

                {!draft.useBrandColor && (
                  <div>
                    <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                      Custom Color Hex
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.customColor || '#e8281a'}
                        onChange={e => updateField('customColor', e.target.value)}
                        className="w-10 h-10 rounded-xl border border-[#e0d6c8] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={draft.customColor || '#e8281a'}
                        onChange={e => updateField('customColor', e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Auto-Popup Delay (Seconds, 0 = Do Not Auto-Open)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={draft.autoOpenDelaySeconds}
                  onChange={e =>
                    updateField('autoOpenDelaySeconds', Number(e.target.value) || 0)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a]"
                />
              </div>
            </div>

            {/* Restaurant Owner Smart Capabilities */}
            <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4">
              <h4 className="font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e8281a]" />
                <span>Smart Capabilities & Interactive Flows</span>
              </h4>

              {(
                [
                  {
                    key: 'enableOrderPlacement',
                    title: 'In-Chat Order Confirmation',
                    desc: 'Allow customers to select dishes, enter delivery details, and confirm orders directly inside the chat.',
                    icon: ShoppingBag,
                  },
                  {
                    key: 'enableOrderStatusLookup',
                    title: 'Live Order Status Tracker',
                    desc: 'Allow customers to check real-time status (Pending → Cooking → Ready → Delivered) by Order ID or Phone.',
                    icon: PackageSearch,
                  },
                  {
                    key: 'enableTableBooking',
                    title: 'Instant Table Reservation in Chat',
                    desc: 'Allow guests to reserve a dining table (date, time, party size) without leaving the chat window.',
                    icon: Calendar,
                  },
                  {
                    key: 'enableDishCards',
                    title: 'Interactive Dish Cards with "+ Add" Button',
                    desc: 'Show visual dish cards with photo, price, and 1-click Add to Order button when customers ask about food.',
                    icon: Globe,
                  },
                  {
                    key: 'enableWhatsAppHandoff',
                    title: 'WhatsApp Support Escalation',
                    desc: 'When the bot cannot answer a question, show a 1-click button to forward that question to your WhatsApp Support number.',
                    icon: PhoneCall,
                  },
                  {
                    key: 'enableLocationSharing',
                    title: 'Location Map Card & Customer Live GPS Pin',
                    desc: 'Show your restaurant Google Maps card in chat and allow customers to share their live GPS location for delivery.',
                    icon: MapPin,
                  },
                ] as const
              ).map(feature => {
                const FIcon = feature.icon;
                const isChecked = Boolean(draft[feature.key]);
                return (
                  <div
                    key={feature.key}
                    className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#e0d6c8] flex items-center justify-center shrink-0 text-[#e8281a]">
                        <FIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1a1a1a]">{feature.title}</p>
                        <p className="text-[11px] text-[#7a6e65] leading-snug mt-0.5">
                          {feature.desc}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => updateField(feature.key, e.target.checked)}
                      className="w-4 h-4 accent-[#e8281a] mt-1 cursor-pointer shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* WHATSAPP SUPPORT FALLBACK CONFIGURATION */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1a1a1a]">
                    WhatsApp Support Number & Unanswered Question Handoff
                  </h4>
                  <p className="text-[11px] text-[#7a6e65]">
                    Jis bhi sawal ka jawab chatbot ke paas na ho, customer 1-click me aapke is
                    WhatsApp Support number par wo sawal bhej sakta hai.
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.autoShowWhatsAppOnUnanswered !== false}
                  onChange={e =>
                    updateField('autoShowWhatsAppOnUnanswered', e.target.checked)
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
                <span>Show WhatsApp Support Button When Bot Doesn&apos;t Know Answer</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Admin WhatsApp Support Number (with Country Code, e.g. 919876543210)
                </label>
                <input
                  type="text"
                  value={draft.whatsappSupportNumber ?? data.profile.whatsappNumber ?? ''}
                  onChange={e => updateField('whatsappSupportNumber', e.target.value)}
                  placeholder="e.g., 919876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-bold text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  English WhatsApp Support Prompt (Shown on Unanswered Questions)
                </label>
                <input
                  type="text"
                  value={draft.whatsappFallbackPromptEn || ''}
                  onChange={e => updateField('whatsappFallbackPromptEn', e.target.value)}
                  placeholder="Need instant help? Send your question directly to our WhatsApp Support:"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Hindi WhatsApp Support Prompt (हिंदी)
                </label>
                <input
                  type="text"
                  value={draft.whatsappFallbackPromptHi || ''}
                  onChange={e => updateField('whatsappFallbackPromptHi', e.target.value)}
                  placeholder="तुरंत जवाब के लिए नीचे क्लिक करके अपना सवाल WhatsApp पर भेजें:"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Gujarati WhatsApp Support Prompt (ગુજરાતી)
                </label>
                <input
                  type="text"
                  value={draft.whatsappFallbackPromptGu || ''}
                  onChange={e => updateField('whatsappFallbackPromptGu', e.target.value)}
                  placeholder="તુરંત જવાબ માટે તમારો પ્રશ્ન સીધો WhatsApp પર મોકલો:"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
                />
              </div>
            </div>
          </div>

          {/* RESTAURANT LOCATION & GOOGLE MAPS PIN CONFIGURATION */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1a1a1a]">
                    Restaurant Location, Landmark & Google Maps Pin (For Chatbot)
                  </h4>
                  <p className="text-[11px] text-[#7a6e65]">
                    Configure the location card shown when customers ask for your address/directions
                    in chat.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDetectRestaurantGps}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {isDetectingAdminGps
                    ? 'Detecting GPS...'
                    : '📍 Auto-Detect My Current GPS Coordinates'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Location Card Title / Branch Name
                </label>
                <input
                  type="text"
                  value={draft.customLocationTitle || ''}
                  onChange={e => updateField('customLocationTitle', e.target.value)}
                  placeholder={data.profile.name}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Landmark & Parking Directions Note
                </label>
                <input
                  type="text"
                  value={draft.customLocationLandmark || ''}
                  onChange={e => updateField('customLocationLandmark', e.target.value)}
                  placeholder="e.g., Opposite City Mall • Free Valet Parking"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Full Restaurant Address (Displayed in Chat Location Card)
                </label>
                <input
                  type="text"
                  value={draft.customLocationAddress || ''}
                  onChange={e => updateField('customLocationAddress', e.target.value)}
                  placeholder={`${data.profile.address}, ${data.profile.city}`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Google Maps Pin / Directions Link
                </label>
                <input
                  type="text"
                  value={draft.customLocationMapsUrl || ''}
                  onChange={e => updateField('customLocationMapsUrl', e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-mono text-[#1a1a1a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                    Latitude (Optional)
                  </label>
                  <input
                    type="text"
                    value={draft.customLatitude || ''}
                    onChange={e => updateField('customLatitude', e.target.value)}
                    placeholder="e.g., 18.9220"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-mono text-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                    Longitude (Optional)
                  </label>
                  <input
                    type="text"
                    value={draft.customLongitude || ''}
                    onChange={e => updateField('customLongitude', e.target.value)}
                    placeholder="e.g., 72.8347"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-mono text-[#1a1a1a]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WELCOME, FALLBACK & CONFIRMATION MESSAGES */}
      {activeSubTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4">
            <h4 className="font-bold text-sm text-[#1a1a1a]">
              👋 Welcome Greeting Messages (Multi-Language, Editable)
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                English Welcome Message
              </label>
              <textarea
                rows={3}
                value={draft.welcomeMessageEn}
                onChange={e => updateField('welcomeMessageEn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Hindi Welcome Message (हिंदी)
              </label>
              <textarea
                rows={3}
                value={draft.welcomeMessageHi}
                onChange={e => updateField('welcomeMessageHi', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Gujarati Welcome Message (ગુજરાતી)
              </label>
              <textarea
                rows={3}
                value={draft.welcomeMessageGu}
                onChange={e => updateField('welcomeMessageGu', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4">
            <h4 className="font-bold text-sm text-[#1a1a1a]">
              🤖 Fallback & Order Confirmation Messages (Editable)
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                English Fallback Message (When question isn&apos;t recognized)
              </label>
              <textarea
                rows={2}
                value={draft.fallbackMessageEn}
                onChange={e => updateField('fallbackMessageEn', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Hindi Fallback Message (हिंदी)
              </label>
              <textarea
                rows={2}
                value={draft.fallbackMessageHi}
                onChange={e => updateField('fallbackMessageHi', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Gujarati Fallback Message (ગુજરાતી)
              </label>
              <textarea
                rows={2}
                value={draft.fallbackMessageGu}
                onChange={e => updateField('fallbackMessageGu', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>

            <div className="pt-2 border-t border-[#e0d6c8]">
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                In-Chat Order Confirmation Message Note
              </label>
              <textarea
                rows={2}
                value={draft.orderConfirmationNote}
                onChange={e => updateField('orderConfirmationNote', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUICK ACTION BUTTONS */}
      {activeSubTab === 'quick_replies' && (
        <div className="space-y-6">
          {/* Add New Quick Reply Button */}
          <form
            onSubmit={handleAddQuickReply}
            className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4"
          >
            <h4 className="font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#e8281a]" />
              <span>Add New Quick Action Button</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Button Label (English) *
                </label>
                <input
                  type="text"
                  value={newQrLabelEn}
                  onChange={e => setNewQrLabelEn(e.target.value)}
                  placeholder="e.g., 🎉 Party Catering"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Button Label (Hindi - Optional)
                </label>
                <input
                  type="text"
                  value={newQrLabelHi}
                  onChange={e => setNewQrLabelHi(e.target.value)}
                  placeholder="e.g., 🎉 पार्टी कैटरिंग"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Button Label (Gujarati - Optional)
                </label>
                <input
                  type="text"
                  value={newQrLabelGu}
                  onChange={e => setNewQrLabelGu(e.target.value)}
                  placeholder="e.g., 🎉 પાર્ટી કેટરિંગ"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  When Customer Clicks This Button:
                </label>
                <select
                  value={newQrAction}
                  onChange={e => setNewQrAction(e.target.value as ChatbotActionType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold"
                >
                  {ACTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {newQrAction === 'custom_query' && (
                <div>
                  <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                    Custom Question / Trigger Keyword to Send
                  </label>
                  <input
                    type="text"
                    value={newQrCustomQuery}
                    onChange={e => setNewQrCustomQuery(e.target.value)}
                    placeholder="e.g., party catering"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Quick Button</span>
            </button>
          </form>

          {/* Existing Quick Replies List (All Fields Editable) */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-3">
            <h4 className="font-bold text-sm text-[#1a1a1a]">
              Manage & Edit Quick Action Chips ({draft.quickReplies.length})
            </h4>

            <div className="space-y-3">
              {draft.quickReplies.map((qr, idx) => (
                <div
                  key={qr.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    qr.isActive
                      ? 'bg-[#fff8f0] border-[#e0d6c8]'
                      : 'bg-stone-100 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#7a6e65] mb-1">
                        English Label
                      </label>
                      <input
                        type="text"
                        value={qr.labelEn}
                        onChange={e =>
                          handleUpdateQuickReplyField(qr.id, 'labelEn', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#7a6e65] mb-1">
                        Hindi Label
                      </label>
                      <input
                        type="text"
                        value={qr.labelHi}
                        onChange={e =>
                          handleUpdateQuickReplyField(qr.id, 'labelHi', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#7a6e65] mb-1">
                        Gujarati Label
                      </label>
                      <input
                        type="text"
                        value={qr.labelGu}
                        onChange={e =>
                          handleUpdateQuickReplyField(qr.id, 'labelGu', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#7a6e65] mb-1">
                        Button Action
                      </label>
                      <select
                        value={qr.action}
                        onChange={e =>
                          handleUpdateQuickReplyField(qr.id, 'action', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs font-semibold"
                      >
                        {ACTION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {qr.action === 'custom_query' ? (
                      <div className="flex-1 min-w-[220px]">
                        <input
                          type="text"
                          value={qr.customQuery || ''}
                          onChange={e =>
                            handleUpdateQuickReplyField(
                              qr.id,
                              'customQuery',
                              e.target.value
                            )
                          }
                          placeholder="Custom trigger query text..."
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#e0d6c8] text-xs font-mono text-[#e8281a]"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#7a6e65]">
                        Action: <strong>{qr.action}</strong>
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMoveQuickReply(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 rounded-xl bg-white border border-[#e0d6c8] text-[#5a524c] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuickReply(idx, 'down')}
                        disabled={idx === draft.quickReplies.length - 1}
                        className="p-2 rounded-xl bg-white border border-[#e0d6c8] text-[#5a524c] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuickReplyField(qr.id, 'isActive', !qr.isActive)
                        }
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                          qr.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {qr.isActive ? 'Active' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuickReply(qr.id)}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOM Q&A AUTO-REPLY BRAIN (ALL FIELDS EDITABLE) */}
      {activeSubTab === 'custom_qa' && (
        <div className="space-y-6">
          {/* Add New Custom Q&A Rule */}
          <form
            onSubmit={handleAddCustomQA}
            className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4"
          >
            <div>
              <h4 className="font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#e8281a]" />
                <span>Train Chatbot with New Custom Question & Auto-Reply</span>
              </h4>
              <p className="text-xs text-[#7a6e65] mt-0.5">
                Enter trigger keywords (e.g.,{' '}
                <code className="text-[#e8281a] font-bold">
                  parking, valet, jain food, birthday, halal, wifi
                </code>
                ) and the exact reply the chatbot should give.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Topic / Question Title *
                </label>
                <input
                  type="text"
                  value={newQaTitle}
                  onChange={e => setNewQaTitle(e.target.value)}
                  placeholder="e.g., Jain Food & No-Onion No-Garlic Options"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Trigger Keywords (comma-separated) *
                </label>
                <input
                  type="text"
                  value={newQaKeywords}
                  onChange={e => setNewQaKeywords(e.target.value)}
                  placeholder="e.g., jain, no onion, no garlic, swaminarayan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Auto-Reply Answer (English) *
                </label>
                <textarea
                  rows={3}
                  value={newQaAnswerEn}
                  onChange={e => setNewQaAnswerEn(e.target.value)}
                  placeholder="Yes! Most of our vegetarian pizzas and starters can be prepared 100% Jain..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Auto-Reply Answer (Hindi - Optional)
                </label>
                <textarea
                  rows={3}
                  value={newQaAnswerHi}
                  onChange={e => setNewQaAnswerHi(e.target.value)}
                  placeholder="हाँ! हमारे अधिकांश शाकाहारी व्यंजन बिना प्याज-लहसुन (जैन) के बनाए जा सकते हैं..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Auto-Reply Answer (Gujarati - Optional)
                </label>
                <textarea
                  rows={3}
                  value={newQaAnswerGu}
                  onChange={e => setNewQaAnswerGu(e.target.value)}
                  placeholder="હા! અમારી મોટાભાગની શાકાહારી વાનગીઓ ૧૦૦% જૈન બની શકે છે..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newQaAttachLocation}
                  onChange={e => setNewQaAttachLocation(e.target.checked)}
                  className="w-4 h-4 accent-[#e8281a]"
                />
                <span>📍 Attach Restaurant Location & Google Maps Card to this Reply</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newQaAttachWhatsApp}
                  onChange={e => setNewQaAttachWhatsApp(e.target.checked)}
                  className="w-4 h-4 accent-[#25D366]"
                />
                <span>💬 Attach Direct WhatsApp Support Button to this Reply</span>
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Auto-Reply Rule</span>
            </button>
          </form>

          {/* Existing Custom Q&A Rules (100% Inline Editable) */}
          <div className="space-y-4">
            {draft.customQAs.map(qa => (
              <div
                key={qa.id}
                className={`bg-white rounded-3xl p-5 border transition-all space-y-3.5 ${
                  qa.isActive ? 'border-[#e0d6c8]' : 'border-stone-200 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        qa.isActive ? 'text-emerald-600' : 'text-stone-400'
                      }`}
                    />
                    <input
                      type="text"
                      value={qa.questionTitle}
                      onChange={e =>
                        handleUpdateQAField(qa.id, 'questionTitle', e.target.value)
                      }
                      placeholder="Question / Rule Title"
                      className="font-bold text-sm text-[#1a1a1a] bg-[#fff8f0] px-3 py-1.5 rounded-xl border border-[#e0d6c8] focus:border-[#e8281a] focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateQAField(qa.id, 'isActive', !qa.isActive)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                        qa.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {qa.isActive ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQA(qa.id)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7a6e65] mb-1">
                    Trigger Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={qa.keywords}
                    onChange={e => handleUpdateQAField(qa.id, 'keywords', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-mono text-[#e8281a]"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7a6e65] mb-1">
                      English Reply
                    </label>
                    <textarea
                      rows={3}
                      value={qa.answerEn}
                      onChange={e =>
                        handleUpdateQAField(qa.id, 'answerEn', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7a6e65] mb-1">
                      Hindi Reply
                    </label>
                    <textarea
                      rows={3}
                      value={qa.answerHi || ''}
                      onChange={e =>
                        handleUpdateQAField(qa.id, 'answerHi', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7a6e65] mb-1">
                      Gujarati Reply
                    </label>
                    <textarea
                      rows={3}
                      value={qa.answerGu || ''}
                      onChange={e =>
                        handleUpdateQAField(qa.id, 'answerGu', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-[#e0d6c8]/60">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#5a524c] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(qa.attachLocationCard)}
                      onChange={e =>
                        handleUpdateQAField(qa.id, 'attachLocationCard', e.target.checked)
                      }
                      className="w-3.5 h-3.5 accent-[#e8281a]"
                    />
                    <span>📍 Attach Location Map Card</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#5a524c] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(qa.attachWhatsAppButton)}
                      onChange={e =>
                        handleUpdateQAField(
                          qa.id,
                          'attachWhatsAppButton',
                          e.target.checked
                        )
                      }
                      className="w-3.5 h-3.5 accent-[#25D366]"
                    />
                    <span>💬 Attach WhatsApp Support Button</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: UNANSWERED CUSTOMER QUESTIONS & 1-CLICK ANSWER TEMPLATE BUILDER */}
      {activeSubTab === 'unanswered' && (
        <div className="space-y-6">
          {/* Template Builder Modal / Card (Opens when Admin clicks "Create Answer Template" on any question) */}
          <form
            onSubmit={handleSaveTrainedTemplate}
            className="bg-white rounded-3xl p-6 border-2 border-[#e8281a]/30 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#e8281a] bg-[#e8281a]/10 px-2.5 py-1 rounded-full">
                  ✨ 1-Click Q&A Template Builder
                </span>
                <h4 className="font-bold text-base text-[#1a1a1a] mt-1.5">
                  Create Auto-Reply Template for Customer Question
                </h4>
                <p className="text-xs text-[#7a6e65]">
                  Jo sawal chatbot jawab nahi de paya, uska template aur answer yahan banakar add
                  karein. Agli baar chatbot turant jawab dega!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Customer Question / Template Title *
                </label>
                <input
                  type="text"
                  required
                  value={tplTitle}
                  onChange={e => {
                    setTplTitle(e.target.value);
                    if (!tplKeywords) {
                      setTplKeywords(extractKeywordsFromQuestion(e.target.value));
                    }
                  }}
                  placeholder="e.g., Do you have rooftop seating or live music?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-bold text-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Auto-Extracted Trigger Keywords (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={tplKeywords}
                  onChange={e => setTplKeywords(e.target.value)}
                  placeholder="e.g., rooftop, seating, live music, outdoor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-mono text-[#e8281a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Template Answer (English) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={tplAnswerEn}
                  onChange={e => setTplAnswerEn(e.target.value)}
                  placeholder="Write the official answer for customers..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Template Answer (Hindi - Optional)
                </label>
                <textarea
                  rows={3}
                  value={tplAnswerHi}
                  onChange={e => setTplAnswerHi(e.target.value)}
                  placeholder="हिंदी में जवाब लिखें (खाली छोड़ने पर English जवाब दिखेगा)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                  Template Answer (Gujarati - Optional)
                </label>
                <textarea
                  rows={3}
                  value={tplAnswerGu}
                  onChange={e => setTplAnswerGu(e.target.value)}
                  placeholder="ગુજરાતીમાં જવાબ લખો..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplAttachLocation}
                    onChange={e => setTplAttachLocation(e.target.checked)}
                    className="w-4 h-4 accent-[#e8281a]"
                  />
                  <span>📍 Include Location & Google Maps Card</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplAttachWhatsApp}
                    onChange={e => setTplAttachWhatsApp(e.target.checked)}
                    className="w-4 h-4 accent-[#25D366]"
                  />
                  <span>💬 Include Direct WhatsApp Support Button</span>
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Template & Train Chatbot</span>
              </button>
            </div>
          </form>

          {/* List of Unanswered Customer Questions */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-[#1a1a1a]">
                  Unanswered Customer Questions Queue ({unansweredList.length})
                </h4>
                <p className="text-xs text-[#7a6e65]">
                  Every time a visitor asks a question that hits fallback, it is recorded here so
                  you can turn it into an automatic answer template.
                </p>
              </div>
            </div>

            {unansweredList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#fff8f0] border border-dashed border-[#e0d6c8] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-[#1a1a1a]">
                  Zero Unanswered Questions Right Now!
                </p>
                <p className="text-xs text-[#7a6e65] max-w-md mx-auto">
                  Whenever a customer asks something the chatbot cannot answer, it will appear here
                  automatically and offer the customer a 1-click WhatsApp Support button.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {unansweredList.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.status === 'resolved'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-[#fff8f0] border-[#e0d6c8]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status === 'resolved' ? '✓ Template Added' : '● Needs Answer'}
                        </span>
                        <span className="text-[11px] font-semibold text-[#7a6e65]">
                          Asked {item.count}x • Lang: {item.language.toUpperCase()} •{' '}
                          {new Date(item.askedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#1a1a1a]">
                        &ldquo;{item.questionText}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          openTemplateBuilderFromQuestion(item.questionText, item.id)
                        }
                        className="px-3.5 py-2 rounded-xl bg-[#e8281a] hover:bg-[#c01f12] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Answer Template</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUnanswered(item.id)}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: CUSTOMER CHAT HISTORY & ANALYTICS DASHBOARD */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white rounded-2xl p-4 border border-[#e0d6c8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6e65]">
                Total Chats
              </span>
              <p className="text-2xl font-black text-[#1a1a1a] mt-1">{totalSessions}</p>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Customer Sessions
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0d6c8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6e65]">
                Questions Asked
              </span>
              <p className="text-2xl font-black text-[#1a1a1a] mt-1">{totalUserMessages}</p>
              <span className="text-[11px] text-[#7a6e65] font-semibold">
                Total User Queries
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0d6c8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6e65]">
                Auto-Answer Rate
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{accuracyRate}%</p>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {autoAnsweredCount} Auto-Replied
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0d6c8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6e65]">
                Unanswered
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {pendingUnansweredCount}
              </p>
              <span className="text-[11px] text-amber-700 font-semibold">
                Pending Training
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0d6c8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6e65]">
                In-Chat Orders
              </span>
              <p className="text-2xl font-black text-[#e8281a] mt-1">{totalChatOrders}</p>
              <span className="text-[11px] text-[#7a6e65] font-semibold">
                Confirmed in Bot
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0d6c8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a6e65]">
                WhatsApp Handoffs
              </span>
              <p className="text-2xl font-black text-[#128C7E] mt-1">
                {totalWhatsAppClicks}
              </p>
              <span className="text-[11px] text-[#128C7E] font-semibold">
                Sent to Support
              </span>
            </div>
          </div>

          {/* Top Asked Topics Breakdown */}
          {sortedTopics.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-3">
              <h4 className="font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#e8281a]" />
                <span>Most Frequently Asked Customer Topics</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedTopics.map(([topic, count]) => (
                  <div
                    key={topic}
                    className="p-3 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-[#1a1a1a] truncate pr-2">
                      {topic}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#e8281a]/10 text-[#e8281a] text-xs font-black shrink-0">
                      {count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Chat Transcripts Viewer */}
          <div className="bg-white rounded-3xl p-6 border border-[#e0d6c8] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#e8281a]" />
                  <span>Customer Chat History & Live Transcripts ({chatLogsList.length})</span>
                </h4>
                <p className="text-xs text-[#7a6e65]">
                  Click any customer conversation on the left to inspect their full chat and convert
                  any question into a Q&A template.
                </p>
              </div>

              {chatLogsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChatLogs}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold cursor-pointer"
                >
                  Clear Chat History
                </button>
              )}
            </div>

            {chatLogsList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#fff8f0] border border-dashed border-[#e0d6c8] text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-[#7a6e65] mx-auto" />
                <p className="text-sm font-bold text-[#1a1a1a]">No Customer Chats Recorded Yet</p>
                <p className="text-xs text-[#7a6e65] max-w-md mx-auto">
                  Open the Chatbot on the website and send a test message — the full conversation
                  transcript and analytics will appear here in real time!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Sessions List */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {chatLogsList.map(sess => {
                    const isSelected = selectedSession?.id === sess.id;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => setSelectedSessionId(sess.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                            : 'bg-[#fff8f0] text-[#1a1a1a] border-[#e0d6c8] hover:border-[#e8281a]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="w-4 h-4 shrink-0 text-[#e8281a]" />
                            <span className="font-bold text-xs truncate">
                              {sess.customerLabel}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-75 uppercase font-bold">
                            {sess.language}
                          </span>
                        </div>

                        {sess.customerPhone && (
                          <p className="text-[11px] opacity-85 font-mono">
                            📞 {sess.customerPhone}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSelected
                                ? 'bg-white/15 text-white'
                                : 'bg-white text-[#5a524c]'
                            }`}
                          >
                            {sess.messagesCount} msgs
                          </span>
                          {sess.unansweredCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {sess.unansweredCount} unanswered
                            </span>
                          )}
                          {sess.orderPlaced && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              🛒 Order Placed
                            </span>
                          )}
                          {sess.whatsappClicked && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              💬 WhatsApp
                            </span>
                          )}
                          {sess.locationShared && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              📍 GPS Shared
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] opacity-70 pt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(sess.lastMessageAt).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Full Conversation Transcript */}
                <div className="lg:col-span-2 bg-[#fff8f0] rounded-2xl p-4 border border-[#e0d6c8] flex flex-col max-h-[480px]">
                  {selectedSession ? (
                    <>
                      <div className="pb-3 mb-3 border-b border-[#e0d6c8] flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h5 className="font-bold text-sm text-[#1a1a1a]">
                            Transcript: {selectedSession.customerLabel}
                          </h5>
                          <p className="text-[11px] text-[#7a6e65]">
                            Started: {new Date(selectedSession.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {selectedSession.messages.map(m => (
                          <div
                            key={m.id}
                            className={`flex flex-col ${
                              m.sender === 'user' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs whitespace-pre-line ${
                                m.sender === 'user'
                                  ? 'bg-[#e8281a] text-white rounded-br-none'
                                  : m.isUnanswered
                                  ? 'bg-amber-50 text-[#1a1a1a] border border-amber-300 rounded-bl-none'
                                  : 'bg-white text-[#1a1a1a] border border-[#e0d6c8] rounded-bl-none'
                              }`}
                            >
                              {m.text}
                            </div>

                            {m.locationUrl && (
                              <a
                                href={m.locationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>Open Customer GPS Pin</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            <div className="flex items-center gap-2 mt-1 px-1">
                              <span className="text-[10px] text-[#7a6e65]">
                                {m.sender === 'user' ? 'Customer' : 'Bot'} • {m.timestamp}
                              </span>

                              {m.matchedTopic && (
                                <span className="text-[10px] font-semibold text-emerald-700">
                                  [{m.matchedTopic}]
                                </span>
                              )}

                              {m.sender === 'user' && (
                                <button
                                  type="button"
                                  onClick={() => openTemplateBuilderFromQuestion(m.text)}
                                  className="text-[10px] font-bold text-[#e8281a] hover:underline cursor-pointer"
                                >
                                  + Make Q&A Template
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
