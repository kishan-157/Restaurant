import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ShoppingCart,
  ExternalLink,
  SlidersHorizontal,
  Check,
  MapPin,
  TicketPercent,
  RotateCcw,
  Send,
  Globe,
  Square,
  Sparkles,
  UtensilsCrossed,
  Layers,
  Zap,
  Search,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';
import { MenuItem, ItemVariant, AddonOption, SpecialOffer } from '../../types';
import {
  normalizeSpeechTextForClarity,
  splitIntoSpeechSentences,
  selectBestSpeechVoice,
  VOICE_PERSONA_PRESETS,
} from '../../utils/pleasantAudioGenerator';

type VoiceLang = 'hi-IN' | 'gu-IN' | 'en-IN';
type SmartPadTab = 'dishes' | 'categories' | 'commands';

interface VoiceTurn {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  matchedDishes?: MenuItem[];
  matchedOffers?: SpecialOffer[];
  showLocationCard?: boolean;
  showLanguagePicker?: boolean;
  showCartCard?: boolean;
  autoAddedDishName?: string;
}

const CHAR_TRANSLIT_MAP: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h', 'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', '्': '', '़': '',
  'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'jh',
  'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n', 'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n',
  'પ': 'p', 'ફ': 'f', 'બ': 'b', 'ભ': 'bh', 'મ': 'm', 'ય': 'y', 'ર': 'r', 'લ': 'l', 'વ': 'v',
  'શ': 'sh', 'ષ': 'sh', 'સ': 's', 'હ': 'h', 'અ': 'a', 'આ': 'a', 'ઇ': 'i', 'ઈ': 'i', 'ઉ': 'u', 'ઊ': 'u',
  'એ': 'e', 'ઐ': 'ai', 'ઓ': 'o', 'ઔ': 'au', 'ા': 'a', 'િ': 'i', 'ી': 'i', 'ુ': 'u', 'ૂ': 'u',
  'ે': 'e', 'ૈ': 'ai', 'ો': 'o', 'ૌ': 'au', 'ં': 'n', '્': '',
};

function toIndianPhoneticKey(raw: string): string {
  if (!raw) return '';
  let s = raw.toLowerCase().trim();

  const wordMap: [RegExp, string][] = [
    [/पनीर|પનીર/g, 'panir'],
    [/तूफानी|तुफानी|तोफानी|તુફાની|તૂફાની/g, 'tufani'],
    [/बर्गर|બર્ગર/g, 'burger'],
    [/स्मैश|સ્મેશ/g, 'smash'],
    [/पिज़्ज़ा|पिज्जा|पीज़ा|પિઝા|પીઝા/g, 'pizza'],
    [/मार्गेरिटा/g, 'margherita'],
    [/पास्ता|પાસ્તા/g, 'pasta'],
    [/चिकन|ચિકન/g, 'chicken'],
    [/रैप/g, 'wrap'],
    [/केक|लावा|કેક|લાવા/g, 'cake lava'],
    [/फ्राइज़|फ्राइज|ફ્રાયઝ/g, 'fries'],
    [/मसाला/g, 'masala'],
    [/तंदूरी/g, 'tanduri'],
    [/मशरूम/g, 'mushroom'],
    [/ट्रफल/g, 'truffle'],
    [/पेपरोनी/g, 'pepperoni'],
  ];

  for (const [re, rep] of wordMap) s = s.replace(re, rep);

  s = Array.from(s)
    .map(ch => (CHAR_TRANSLIT_MAP[ch] !== undefined ? CHAR_TRANSLIT_MAP[ch] : ch))
    .join('');

  return s
    .replace(/oo/g, 'u')
    .replace(/ee/g, 'i')
    .replace(/aa/g, 'a')
    .replace(/ph/g, 'f')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/chh/g, 'ch')
    .replace(/sh/g, 's')
    .replace(/z/g, 'j')
    .replace(/w/g, 'v')
    .replace(/([a-z])\1+/g, '$1')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function phoneticSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.92;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 6) return 0;

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array(lenB + 1).fill(0)
  );
  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return Math.max(0, 1 - dp[lenA][lenB] / Math.max(lenA, lenB));
}

function formatISTTime(): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export const VoiceAssistantWidget: React.FC = () => {
  const { data } = useRestaurant();
  const { cart, addToCart, totalCount: cartCount, subtotal, setIsCartOpen } = useCart();

  const settings =
    data.voiceAssistantSettings || DEFAULT_RESTAURANT_DATA.voiceAssistantSettings!;
  const primaryColor = data.profile.primaryColor || '#e8281a';
  const currency = data.profile.currencySymbol || '₹';

  const [isOpen, setIsOpen] = useState(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(
    !settings.askLanguageFirst
  );
  const [activeLang, setActiveLang] = useState<VoiceLang>(
    settings.defaultLanguage || 'hi-IN'
  );
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);

  const [isSpeakStudioOpen, setIsSpeakStudioOpen] = useState(false);
  const [smartPadTab, setSmartPadTab] = useState<SmartPadTab>('dishes');
  const [dishSearchFilter, setDishSearchFilter] = useState('');
  const [micStatusMessage, setMicStatusMessage] = useState<string | null>(null);

  const [customizingDishId, setCustomizingDishId] = useState<string | null>(null);
  const [selectedVariantByDish, setSelectedVariantByDish] = useState<Record<string, string>>({});
  const [selectedAddonsByDish, setSelectedAddonsByDish] = useState<Record<string, string[]>>({});
  const [customNoteByDish, setCustomNoteByDish] = useState<Record<string, string>>({});
  const [addedDishFeedback, setAddedDishFeedback] = useState<Record<string, boolean>>({});

  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const speechTokenRef = useRef<number>(0);
  const turnsEndRef = useRef<HTMLDivElement>(null);
  const hasGreetedSessionRef = useRef<boolean>(false);

  const availableDishes = useMemo(
    () => (data.items || []).filter(i => i.stockStatus !== 'hidden'),
    [data.items]
  );

  const activeCategories = useMemo(
    () => (data.categories || []).filter(c => c.isActive),
    [data.categories]
  );

  const filteredSmartDishes = useMemo(() => {
    if (!dishSearchFilter.trim()) return availableDishes.slice(0, 12);
    const q = toIndianPhoneticKey(dishSearchFilter);
    return availableDishes
      .filter(
        d =>
          toIndianPhoneticKey(d.name).includes(q) ||
          d.name.toLowerCase().includes(dishSearchFilter.toLowerCase())
      )
      .slice(0, 10);
  }, [availableDishes, dishSearchFilter]);

  const liveInputDishMatches = useMemo(() => {
    const q = manualInput.trim();
    if (q.length < 2) return [];
    const phoneticQ = toIndianPhoneticKey(q);
    return availableDishes
      .filter(
        d =>
          toIndianPhoneticKey(d.name).includes(phoneticQ) ||
          d.name.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 4);
  }, [manualInput, availableDishes]);

  useEffect(() => {
    if (isOpen) {
      turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, isOpen, interimTranscript, customizingDishId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.getVoices();
      const onVoices = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', onVoices);
      return () => window.speechSynthesis.removeEventListener?.('voiceschanged', onVoices);
    } catch {
      // ignore
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    speechTokenRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsSpeaking(false);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const speakText = useCallback(
    (text: string, lang: VoiceLang, onFinishedSpeaking?: () => void) => {
      if (
        isVoiceMuted ||
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        !text.trim()
      ) {
        onFinishedSpeaking?.();
        return;
      }

      stopListening();
      window.dispatchEvent(new CustomEvent('sarab:stop-welcome-audio'));

      const token = ++speechTokenRef.current;
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const cleanText = normalizeSpeechTextForClarity(text, lang, true);
      const sentences = splitIntoSpeechSentences(cleanText);
      if (sentences.length === 0) {
        onFinishedSpeaking?.();
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      const personaObj = VOICE_PERSONA_PRESETS.find(
        p => p.id === (settings.voicePersona || 'warm_hostess')
      );
      const effectiveGender = settings.voiceGender || personaObj?.gender || 'female';
      const effectiveRate =
        settings.voicePersona && settings.voicePersona !== 'custom' && personaObj
          ? personaObj.rate
          : settings.voiceRate || 0.96;
      const effectivePitch =
        settings.voicePersona && settings.voicePersona !== 'custom' && personaObj
          ? personaObj.pitch
          : settings.voicePitch || 1.04;

      const matchedVoice = selectBestSpeechVoice(voices, lang, effectiveGender);

      const speakSentence = (idx: number) => {
        if (speechTokenRef.current !== token) return;
        if (idx >= sentences.length) {
          setIsSpeaking(false);
          onFinishedSpeaking?.();
          return;
        }

        const u = new SpeechSynthesisUtterance(sentences[idx]);
        u.lang = lang;
        u.rate = Math.min(1.2, Math.max(0.8, effectiveRate));
        u.pitch = Math.min(1.2, Math.max(0.8, effectivePitch));
        u.volume = Math.min(1, Math.max(0.2, settings.volume ?? 0.9));
        if (matchedVoice) u.voice = matchedVoice;

        u.onstart = () => {
          if (speechTokenRef.current !== token) return;
          setIsSpeaking(true);
        };
        u.onend = () => {
          if (speechTokenRef.current !== token) return;
          if (idx + 1 < sentences.length) {
            setTimeout(() => speakSentence(idx + 1), 120);
          } else {
            setIsSpeaking(false);
            onFinishedSpeaking?.();
          }
        };
        u.onerror = () => {
          if (speechTokenRef.current !== token) return;
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(u);
      };

      setIsSpeaking(true);
      speakSentence(0);
    },
    [
      isVoiceMuted,
      settings.voicePersona,
      settings.voiceGender,
      settings.voiceRate,
      settings.voicePitch,
      settings.volume,
      stopListening,
    ]
  );

  const findMatchingDishes = useCallback(
    (spokenText: string): MenuItem[] => {
      const queryPhonetic = toIndianPhoneticKey(spokenText);
      const stopWords = new Set([
        'mujhe', 'chahiye', 'dikhao', 'batao', 'kitne', 'ka', 'hai', 'price',
        'rate', 'cost', 'order', 'add', 'karo', 'cart', 'mein', 'me', 'to',
        'the', 'please', 'want', 'show', 'give', 'ek', 'do', 'teen', 'one',
        'two', 'link', 'kya', 'milega', 'available',
      ]);

      const queryTokens = queryPhonetic
        .split(' ')
        .map(t => t.trim())
        .filter(t => t.length >= 3 && !stopWords.has(t));

      if (queryTokens.length === 0) return [];

      const scored: { item: MenuItem; score: number }[] = [];

      for (const item of availableDishes) {
        const namePhonetic = toIndianPhoneticKey(item.name);
        const nameTokens = namePhonetic.split(' ').filter(Boolean);
        const tagsPhonetic = toIndianPhoneticKey((item.tags || []).join(' '));
        const descPhonetic = toIndianPhoneticKey(item.description || '');

        let score = 0;
        if (queryPhonetic.includes(namePhonetic) || namePhonetic.includes(queryPhonetic)) {
          score += 95;
        }

        for (const qt of queryTokens) {
          if (namePhonetic.includes(qt)) {
            score += 45;
          } else if (tagsPhonetic.includes(qt)) {
            score += 38;
          } else {
            for (const nt of nameTokens) {
              const sim = phoneticSimilarity(qt, nt);
              if (sim >= 0.72) score += Math.round(sim * 42);
            }
            if (descPhonetic.includes(qt)) score += 15;
          }
        }

        if (score >= 34) scored.push({ item, score });
      }

      return scored
        .sort((a, b) => b.score - a.score)
        .map(s => s.item)
        .slice(0, 4);
    },
    [availableDishes]
  );

  const handleAddDishToCart = useCallback(
    (dish: MenuItem, qty = 1) => {
      const itemVariants = (data.variants || []).filter(
        v => v.menuItemId === dish.id && v.isAvailable !== false
      );
      const chosenVariantId = selectedVariantByDish[dish.id];
      const chosenVariant: ItemVariant | undefined =
        itemVariants.find(v => v.id === chosenVariantId) || itemVariants[0];

      const allAddonOptions: AddonOption[] = (data.addonGroups || []).flatMap(
        g => g.options || []
      );
      const chosenAddonIds = selectedAddonsByDish[dish.id] || [];
      const chosenAddons = allAddonOptions.filter(a => chosenAddonIds.includes(a.id));
      const note = customNoteByDish[dish.id]?.trim() || undefined;

      addToCart(dish, chosenVariant, chosenAddons, qty, note);
      setAddedDishFeedback(prev => ({ ...prev, [dish.id]: true }));
      setTimeout(() => {
        setAddedDishFeedback(prev => ({ ...prev, [dish.id]: false }));
      }, 2200);
    },
    [
      data.variants,
      data.addonGroups,
      selectedVariantByDish,
      selectedAddonsByDish,
      customNoteByDish,
      addToCart,
    ]
  );

  const handleOpenDishInMenu = (dish: MenuItem) => {
    stopSpeaking();
    stopListening();
    setIsSpeakStudioOpen(false);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('sarab:open-dish', { detail: dish.id }));
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const processVoiceQuery = useCallback(
    (rawTranscript: string, currentLang: VoiceLang, startMicAfterFn?: () => void) => {
      const text = rawTranscript.trim();
      if (!text) return;

      setIsSpeakStudioOpen(false);
      setInterimTranscript('');
      latestTranscriptRef.current = '';

      const lower = text.toLowerCase();
      const phonetic = toIndianPhoneticKey(text);

      setTurns(prev => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text, timestamp: formatISTTime() },
      ]);

      const mentionsHindi =
        /\b(hindi|hindustani|हिंदी|हिन्दी)\b/i.test(text) || phonetic.includes('hindi');
      const mentionsGujarati =
        /\b(gujarati|gujrati|ગુજરાતી|गुजराती)\b/i.test(text) ||
        phonetic.includes('gujarati') ||
        phonetic.includes('gujrati');
      const mentionsEnglish =
        /\b(english|angrezi|इंग्लिश|अंग्रेजी|ઇંગ્લિશ)\b/i.test(text) ||
        phonetic.includes('inglis') ||
        phonetic.includes('english');

      if (
        !hasSelectedLanguage ||
        /\b(language|bhasha|भाषा|ભાષા|talk in|baat karo)\b/i.test(text)
      ) {
        if (mentionsHindi || mentionsGujarati || mentionsEnglish) {
          const nextLang: VoiceLang = mentionsGujarati
            ? 'gu-IN'
            : mentionsEnglish
            ? 'en-IN'
            : 'hi-IN';

          setActiveLang(nextLang);
          setHasSelectedLanguage(true);

          const replyText =
            nextLang === 'hi-IN'
              ? settings.greetingAfterLanguageHi ||
                'धन्यवाद! अब मैं आपसे हिंदी में बात करूँगी। आप किसी भी डिश का नाम बोल सकते हैं जैसे पनीर तूफानी, या नीचे स्मार्ट वॉयस बटन दबाकर तुरंत पूछ सकते हैं!'
              : nextLang === 'gu-IN'
              ? settings.greetingAfterLanguageGu ||
                'આભાર! હવે હું આપની સાથે ગુજરાતીમાં વાત કરીશ. આપ કોઈપણ વાનગીનું નામ બોલી શકો છો જેમ કે પનીર તુફાની, અથવા નીચેના સ્માર્ટ બટન દબાવી શકો છો!'
              : settings.greetingAfterLanguageEn ||
                'Thank you! I will now assist you in English. You can say any dish name like Paneer Toofani, or use our Smart Voice Pad below!';

          setTurns(prev => [
            ...prev,
            { id: `b-${Date.now() + 1}`, role: 'assistant', text: replyText, timestamp: formatISTTime() },
          ]);
          speakText(replyText, nextLang, () => {
            if (settings.autoListenAfterGreeting) startMicAfterFn?.();
          });
          return;
        }
        setHasSelectedLanguage(true);
      }

      if (
        /\b(mera cart|my cart|bill kitna|total bill|cart dikhao|checkout|कार्ट बताओ|बिल कितना|મારું કાર્ટ|બિલ કેટલું)\b/i.test(
          lower
        )
      ) {
        if (cart.length === 0) {
          const emptyMsg =
            currentLang === 'hi-IN'
              ? 'अभी आपका कार्ट खाली है। आप किसी भी डिश का नाम बोलकर (जैसे पनीर तूफानी या स्मैश बर्गर) कार्ट में जोड़ सकते हैं!'
              : currentLang === 'gu-IN'
              ? 'અત્યારે આપનું કાર્ટ ખાલી છે. આપ કોઈપણ વાનગીનું નામ બોલીને કાર્ટમાં ઉમેરી શકો છો!'
              : 'Your cart is currently empty. You can say any dish name like Paneer Toofani to add it to your cart!';
          setTurns(prev => [
            ...prev,
            { id: `b-${Date.now() + 1}`, role: 'assistant', text: emptyMsg, timestamp: formatISTTime() },
          ]);
          speakText(emptyMsg, currentLang);
          return;
        }

        const itemSummary = cart
          .map(c => `${c.quantity} ${c.item.name} (${currency}${c.lineTotal})`)
          .join(', ');
        const cartMsg =
          currentLang === 'hi-IN'
            ? `आपके कार्ट में कुल ${cartCount} आइटम हैं: ${itemSummary}। आपका कुल बिल ${currency}${subtotal} है। आप नीचे दिए गए बटन से अपना ऑर्डर पूरा कर सकते हैं!`
            : currentLang === 'gu-IN'
            ? `આપના કાર્ટમાં કુલ ${cartCount} આઈટમ છે: ${itemSummary}. આપનું કુલ બિલ ${currency}${subtotal} છે. નીચેના બટનથી ઓર્ડર પૂર્ણ કરો!`
            : `You have ${cartCount} items in your cart: ${itemSummary}. Your subtotal is ${currency}${subtotal}. Tap the button below to review your cart and place your order!`;

        setTurns(prev => [
          ...prev,
          {
            id: `b-${Date.now() + 1}`,
            role: 'assistant',
            text: cartMsg,
            timestamp: formatISTTime(),
            showCartCard: true,
          },
        ]);
        speakText(cartMsg, currentLang);
        return;
      }

      const matchedDishes = findMatchingDishes(text);
      const wantsToAddToCart =
        /\b(add|cart|order|chahiye|manga|mangana|laao|dalo|जोड़ें|कार्ट|ऑर्डर|ઉમેરો|ઓર્ડર)\b/i.test(
          text
        ) && matchedDishes.length > 0;

      if (matchedDishes.length > 0) {
        const topDish = matchedDishes[0];
        const qtyMatch = text.match(/\b([1-9])\b/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

        let autoAddedName: string | undefined;
        if (wantsToAddToCart && settings.enableDirectVoiceCartAdd) {
          handleAddDishToCart(topDish, qty);
          autoAddedName = `${qty}x ${topDish.name}`;
        }

        const vegLabelHi = topDish.isVeg ? 'शुद्ध शाकाहारी (Pure Veg)' : 'नॉन-वेज';
        const vegLabelGu = topDish.isVeg ? 'શુદ્ધ શાકાહારી (Pure Veg)' : 'નોન-વેજ';
        const vegLabelEn = topDish.isVeg ? 'Pure Vegetarian' : 'Non-Veg';

        let replyText = '';
        if (currentLang === 'hi-IN') {
          replyText = autoAddedName
            ? `जी बिल्कुल! मैंने ${qty} ${topDish.name} (${currency}${topDish.price}) आपके कार्ट में जोड़ दिया है। नीचे दिए गए कार्ड से आप इसका मेन्यू लिंक खोल सकते हैं या एक्स्ट्रा टॉपिंग्स चुन सकते हैं!`
            : `जी बिल्कुल! हमारे मेन्यू में ${topDish.name} उपलब्ध है। यह ${vegLabelHi} डिश है और इसकी कीमत ${currency}${topDish.price} है। ${topDish.description} मैंने नीचे इसका डायरेक्ट लिंक और कार्ड खोल दिया है, जहाँ से आप इसे तुरंत कार्ट में जोड़ सकते हैं!`;
        } else if (currentLang === 'gu-IN') {
          replyText = autoAddedName
            ? `હા ચોક્કસ! મેં ${qty} ${topDish.name} (${currency}${topDish.price}) આપના કાર્ટમાં ઉમેરી દીધું છે. નીચે આપેલા કાર્ડ પરથી આપ મેનુ લિંક ખોલી શકો છો!`
            : `હા ચોક્કસ! અમારા મેનુમાં ${topDish.name} ઉપલબ્ધ છે. આ ${vegLabelGu} વાનગી છે અને તેની કિંમત ${currency}${topDish.price} છે. મેં નીચે તેની ડાયરેક્ટ લિંક અને કાર્ડ મૂક્યું છે, જ્યાંથી આપ તરત ઓર્ડર કરી શકો છો!`;
        } else {
          replyText = autoAddedName
            ? `Certainly! I have added ${qty} ${topDish.name} (${currency}${topDish.price}) directly to your cart. You can customize options or open it in the menu using the link below!`
            : `Yes! We serve ${topDish.name} for ${currency}${topDish.price}. It is a ${vegLabelEn} specialty: ${topDish.description} I have displayed its direct menu link and Add to Cart card right below for you!`;
        }

        setTurns(prev => [
          ...prev,
          {
            id: `b-${Date.now() + 1}`,
            role: 'assistant',
            text: replyText,
            timestamp: formatISTTime(),
            matchedDishes,
            autoAddedDishName: autoAddedName,
          },
        ]);
        speakText(replyText, currentLang, () => {
          if (settings.autoListenAfterGreeting) startMicAfterFn?.();
        });
        return;
      }

      const matchedCat = activeCategories.find(c => {
        const catPhonetic = toIndianPhoneticKey(c.name);
        return (
          lower.includes(c.name.toLowerCase()) ||
          phonetic.includes(catPhonetic) ||
          c.name
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length >= 4)
            .some(w => lower.includes(w.replace(/s$/, '')))
        );
      });

      if (matchedCat) {
        const catDishes = availableDishes
          .filter(i => i.categoryId === matchedCat.id)
          .slice(0, 5);
        const names = catDishes.map(d => `${d.name} (${currency}${d.price})`).join(', ');
        const replyText =
          currentLang === 'hi-IN'
            ? `${matchedCat.name} कैटेगरी में हमारे पास ${names} उपलब्ध हैं। मैंने नीचे इनके कार्ड्स दिखा दिए हैं, आप किसी भी डिश को कार्ट में जोड़ सकते हैं!`
            : currentLang === 'gu-IN'
            ? `${matchedCat.name} કેટેગરીમાં અમારી પાસે ${names} ઉપલબ્ધ છે. નીચે આપેલા કાર્ડ પરથી આપ તરત ઓર્ડર કરી શકો છો!`
            : `In our ${matchedCat.name} category, we serve ${names}. You can customize or add any of these dishes below!`;

        setTurns(prev => [
          ...prev,
          {
            id: `b-${Date.now() + 1}`,
            role: 'assistant',
            text: replyText,
            timestamp: formatISTTime(),
            matchedDishes: catDishes,
          },
        ]);
        speakText(replyText, currentLang);
        return;
      }

      if (
        /\b(offer|offers|discount|coupon|promo|deal|chhut|chhoot|ऑफर|छूट|कूपन|ડિસ્કાઉન્ટ|ઓફર)\b/i.test(
          lower
        ) ||
        phonetic.includes('ofar') ||
        phonetic.includes('diskaunt') ||
        phonetic.includes('kupan')
      ) {
        const activeOffers = (data.offers || []).filter(o => o.isActive);
        const topOffer = activeOffers[0];
        if (topOffer) {
          if (/\b(apply|lagao|laga|use)\b/i.test(lower)) {
            window.dispatchEvent(
              new CustomEvent('sarab:apply-coupon', { detail: topOffer.code })
            );
          }
          const replyText =
            currentLang === 'hi-IN'
              ? `जी! आज हमारे पास शानदार ऑफर्स चल रहे हैं। सबसे खास ऑफर है: ${topOffer.title}, जिसमें कूपन कोड ${topOffer.code} लगाने पर आपको ${topOffer.discountBadge} मिलेगा! आप नीचे दिए गए बटन से इसे एक क्लिक में अप्लाई कर सकते हैं।`
              : currentLang === 'gu-IN'
              ? `હા! આજે અમારી પાસે ખાસ ઓફર ચાલી રહી છે: ${topOffer.title}. કૂપન કોડ ${topOffer.code} વાપરવાથી આપને ${topOffer.discountBadge} મળશે! નીચેના બટનથી તરત અપ્લાય કરો.`
              : `Today's top special offer is ${topOffer.title}! Use promo code ${topOffer.code} to get ${topOffer.discountBadge}. You can apply it in one click below!`;

          setTurns(prev => [
            ...prev,
            {
              id: `b-${Date.now() + 1}`,
              role: 'assistant',
              text: replyText,
              timestamp: formatISTTime(),
              matchedOffers: activeOffers,
            },
          ]);
          speakText(replyText, currentLang);
          return;
        }
      }

      if (
        /\b(veg|vegetarian|shakahari|jain|शाकाहारी|वेज|વેજ|શાકાહારી)\b/i.test(lower) ||
        phonetic.includes('vej')
      ) {
        const vegDishes = availableDishes
          .filter(i => i.isVeg && i.stockStatus === 'available')
          .slice(0, 4);
        const names = vegDishes.map(d => `${d.name} (${currency}${d.price})`).join(', ');
        const replyText =
          currentLang === 'hi-IN'
            ? `हमारे पास शुद्ध शाकाहारी (Pure Veg) में कई स्वादिष्ट विकल्प हैं, जैसे: ${names}। मैंने नीचे इनके कार्ड्स दिखा दिए हैं, आप किसी भी डिश को चुन सकते हैं!`
            : currentLang === 'gu-IN'
            ? `અમારી પાસે પ્યોર વેજમાં શાનદાર વાનગીઓ છે, જેમ કે: ${names}. નીચે આપેલા કાર્ડમાંથી આપ તરત પસંદ કરી શકો છો!`
            : `We have delicious Pure Vegetarian dishes including ${names}. Here are our top Pure Veg picks below!`;

        setTurns(prev => [
          ...prev,
          {
            id: `b-${Date.now() + 1}`,
            role: 'assistant',
            text: replyText,
            timestamp: formatISTTime(),
            matchedDishes: vegDishes,
          },
        ]);
        speakText(replyText, currentLang);
        return;
      }

      if (
        /\b(menu|bestseller|popular|famous|special|dish|khana|kya hai|मेन्यू|खाना|स्पेशल|મેનુ|વાનગી)\b/i.test(
          lower
        ) ||
        phonetic.includes('menu') ||
        phonetic.includes('bestselar')
      ) {
        const bestDishes = availableDishes
          .filter(i => i.isBestseller && i.stockStatus === 'available')
          .slice(0, 4);
        const catNames = activeCategories.map(c => c.name).join(', ');
        const dishNames = bestDishes.map(d => `${d.name} (${currency}${d.price})`).join(', ');

        const replyText =
          currentLang === 'hi-IN'
            ? `हमारे मेन्यू में ${catNames} शामिल हैं। हमारी सबसे लोकप्रिय बेस्टसेलर डिशेज़ हैं: ${dishNames}। आप किसी भी डिश का नाम बोलकर या नीचे कार्ड पर क्लिक करके ऑर्डर कर सकते हैं!`
            : currentLang === 'gu-IN'
            ? `અમારા મેનુમાં ${catNames} સામેલ છે. અમારી સૌથી લોકપ્રિય વાનગીઓ છે: ${dishNames}. આપ નીચેના કાર્ડ પરથી તરત ઓર્ડર કરી શકો છો!`
            : `Our menu features ${catNames}. Our top-rated bestsellers are ${dishNames}. You can say any dish name or tap the cards below to order!`;

        setTurns(prev => [
          ...prev,
          {
            id: `b-${Date.now() + 1}`,
            role: 'assistant',
            text: replyText,
            timestamp: formatISTTime(),
            matchedDishes: bestDishes,
          },
        ]);
        speakText(replyText, currentLang);
        return;
      }

      if (
        /\b(time|timing|open|close|hours|kab|khulta|band|टाइम|समय|खुलता|સમય|ક્યારે)\b/i.test(
          lower
        )
      ) {
        const hoursText =
          data.openingHours?.topbarHoursText || '11:00 AM to 11:30 PM (Monday to Sunday)';
        const replyText =
          currentLang === 'hi-IN'
            ? `हमारा रेस्टोरेंट ${data.profile.name} हर दिन ${hoursText} खुला रहता है। आप अभी ऑनलाइन या वॉयस से अपना ऑर्डर दे सकते हैं!`
            : currentLang === 'gu-IN'
            ? `અમારું રેસ્ટોરન્ટ ${data.profile.name} દરરોજ ${hoursText} ખુલ્લું રહે છે. આપ અત્યારે જ ઓર્ડર કરી શકો છો!`
            : `${data.profile.name} is open daily from ${hoursText}. You can place your delivery or takeaway order right now!`;

        setTurns(prev => [
          ...prev,
          { id: `b-${Date.now() + 1}`, role: 'assistant', text: replyText, timestamp: formatISTTime() },
        ]);
        speakText(replyText, currentLang);
        return;
      }

      if (
        /\b(location|address|where|map|direction|kahan|kaha|पता|लोकेशन|कहाँ|સરનામું|ક્યાં)\b/i.test(
          lower
        )
      ) {
        const fullAddr = `${data.profile.address}, ${data.profile.city} ${
          data.profile.postalCode || ''
        }`.trim();
        const replyText =
          currentLang === 'hi-IN'
            ? `हमारा पता है: ${fullAddr}। आप नीचे दिए गए गूगल मैप्स बटन पर क्लिक करके सीधा रास्ता देख सकते हैं या फोन नंबर ${data.profile.phone} पर संपर्क कर सकते हैं।`
            : currentLang === 'gu-IN'
            ? `અમારું સરનામું છે: ${fullAddr}. નીચે આપેલા ગૂગલ મેપ્સ બટનથી આપ સીધો રસ્તો જોઈ શકો છો.`
            : `We are located at ${fullAddr}. You can tap the Google Maps button below for live directions or call us at ${data.profile.phone}.`;

        setTurns(prev => [
          ...prev,
          {
            id: `b-${Date.now() + 1}`,
            role: 'assistant',
            text: replyText,
            timestamp: formatISTTime(),
            showLocationCard: true,
          },
        ]);
        speakText(replyText, currentLang);
        return;
      }

      if (/\b(delivery|charge|fee|free|home|minimum|डिलीवरी|चार्ज|ડિલિવરી)\b/i.test(lower)) {
        const delFee = data.orderSettings.deliveryFee ?? 49;
        const freeAbove = data.orderSettings.freeDeliveryThreshold ?? 499;
        const minOrd = data.orderSettings.minOrderAmount ?? 199;
        const estTime = data.orderSettings.estimatedDeliveryTime || '25-35 mins';

        const replyText =
          currentLang === 'hi-IN'
            ? `होम डिलीवरी का समय ${estTime} है। ${currency}${freeAbove} से ऊपर के सभी ऑर्डर पर डिलीवरी बिल्कुल मुफ्त है! उससे कम पर डिलीवरी चार्ज ${currency}${delFee} है और न्यूनतम ऑर्डर ${currency}${minOrd} है।`
            : currentLang === 'gu-IN'
            ? `હોમ ડિલિવરીનો સમય ${estTime} છે. ${currency}${freeAbove} થી વધુના ઓર્ડર પર ડિલિવરી બિલકુલ ફ્રી છે! ડિલિવરી ચાર્જ ${currency}${delFee} છે.`
            : `Our estimated home delivery time is ${estTime}. Enjoy free delivery on orders above ${currency}${freeAbove}! Standard delivery fee is ${currency}${delFee} with a minimum order of ${currency}${minOrd}.`;

        setTurns(prev => [
          ...prev,
          { id: `b-${Date.now() + 1}`, role: 'assistant', text: replyText, timestamp: formatISTTime() },
        ]);
        speakText(replyText, currentLang);
        return;
      }

      const customQAs = (data.chatbotSettings?.customQAs || []).filter(q => q.isActive);
      for (const qa of customQAs) {
        const kwList = qa.keywords
          .split(',')
          .map(k => k.trim().toLowerCase())
          .filter(Boolean);
        if (kwList.some(k => lower.includes(k) || phonetic.includes(toIndianPhoneticKey(k)))) {
          const ans =
            currentLang === 'hi-IN'
              ? qa.answerHi || qa.answerEn
              : currentLang === 'gu-IN'
              ? qa.answerGu || qa.answerEn
              : qa.answerEn;
          setTurns(prev => [
            ...prev,
            { id: `b-${Date.now() + 1}`, role: 'assistant', text: ans, timestamp: formatISTTime() },
          ]);
          speakText(ans, currentLang);
          return;
        }
      }

      for (const faq of data.faqs || []) {
        if (
          lower.includes(faq.question.toLowerCase().slice(0, 12)) ||
          faq.question
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 4)
            .some(w => lower.includes(w))
        ) {
          setTurns(prev => [
            ...prev,
            { id: `b-${Date.now() + 1}`, role: 'assistant', text: faq.answer, timestamp: formatISTTime() },
          ]);
          speakText(faq.answer, currentLang);
          return;
        }
      }

      const topSuggestions = availableDishes
        .filter(i => i.isBestseller && i.stockStatus === 'available')
        .slice(0, 3);
      const fallbackReply =
        currentLang === 'hi-IN'
          ? `मैं ${data.profile.name} की वॉयस असिस्टेंट हूँ! आप मुझसे किसी भी डिश का नाम (जैसे पनीर तूफानी, डबल स्मैश बर्गर, या मार्गेरिटा पिज़्ज़ा), आज के ऑफर्स, टाइमिंग, या होम डिलीवरी के बारे में पूछ सकते हैं। मैंने नीचे कुछ खास पकवान दिखाए हैं:`
          : currentLang === 'gu-IN'
          ? `હું ${data.profile.name} ની વોઇસ આસિસ્ટન્ટ છું! આપ મને કોઈપણ વાનગીનું નામ (જેમ કે પનીર તુફાની કે બર્ગર), આજના ઓફર્સ, કે ડિલિવરી વિશે પૂછી શકો છો. નીચે અમારી ખાસ વાનગીઓ જુઓ:`
          : `I am your live voice assistant for ${data.profile.name}! You can ask me about any dish like Paneer Toofani or Double Smash Burger, today's offers, opening hours, or delivery. Here are some of our signature dishes:`;

      setTurns(prev => [
        ...prev,
        {
          id: `b-${Date.now() + 1}`,
          role: 'assistant',
          text: fallbackReply,
          timestamp: formatISTTime(),
          matchedDishes: topSuggestions,
        },
      ]);
      speakText(fallbackReply, currentLang);
    },
    [
      hasSelectedLanguage,
      settings.greetingAfterLanguageHi,
      settings.greetingAfterLanguageGu,
      settings.greetingAfterLanguageEn,
      settings.autoListenAfterGreeting,
      settings.enableDirectVoiceCartAdd,
      cart,
      cartCount,
      subtotal,
      findMatchingDishes,
      handleAddDishToCart,
      currency,
      speakText,
      activeCategories,
      availableDishes,
      data.offers,
      data.openingHours,
      data.profile,
      data.orderSettings,
      data.chatbotSettings,
      data.faqs,
    ]
  );

  const startListening = useCallback(
    (langOverride?: VoiceLang, openStudioDrawer = true) => {
      if (typeof window === 'undefined') return;

      window.dispatchEvent(new CustomEvent('sarab:stop-welcome-audio'));
      if (openStudioDrawer) {
        setIsSpeakStudioOpen(true);
      }
      setMicStatusMessage(null);

      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRec) {
        setMicStatusMessage(
          activeLang === 'hi-IN'
            ? 'आपके ब्राउज़र में माइक उपलब्ध नहीं है — नीचे दिए गए स्मार्ट वॉयस बटन दबाकर 1-Click में बोलें!'
            : 'Browser microphone unavailable — tap any Smart Voice button below to speak instantly!'
        );
        return;
      }

      stopSpeaking();
      stopListening();
      latestTranscriptRef.current = '';
      setInterimTranscript('');

      setTimeout(() => {
        try {
          const recognition = new SpeechRec();
          recognitionRef.current = recognition;
          const listenLang = langOverride || activeLang || 'hi-IN';
          recognition.lang = listenLang;
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.maxAlternatives = 3;

          let finalCaptured = '';

          recognition.onstart = () => {
            setIsListening(true);
            setMicStatusMessage(null);
          };

          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcriptPiece = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalCaptured += transcriptPiece + ' ';
              } else {
                interim += transcriptPiece;
              }
            }
            const combined = (finalCaptured + interim).trim();
            latestTranscriptRef.current = combined;
            setInterimTranscript(combined);
          };

          recognition.onerror = (event: any) => {
            setIsListening(false);
            const errCode = event?.error || '';
            if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
              setMicStatusMessage(
                activeLang === 'hi-IN'
                  ? 'ब्राउज़र या प्रीव्यू विंडो में माइक परमिशन बंद है — नीचे "Allow Mic" दबाएं या सीधे स्मार्ट वॉयस बटन चुनें!'
                  : 'Microphone permission is blocked in this window — tap "Allow Mic" or use the 1-Tap Smart Voice Pad below!'
              );
            } else if (errCode === 'no-speech') {
              setMicStatusMessage(
                activeLang === 'hi-IN'
                  ? 'कोई आवाज़ सुनाई नहीं दी — दोबारा माइक दबाकर बोलें या नीचे से डिश चुनें।'
                  : 'No speech detected — tap the mic again or tap any dish below.'
              );
            }
          };

          recognition.onend = () => {
            setIsListening(false);
            const captured = (finalCaptured || latestTranscriptRef.current).trim();
            if (captured) {
              latestTranscriptRef.current = '';
              setInterimTranscript('');
              processVoiceQuery(captured, listenLang);
            }
          };

          recognition.start();
        } catch {
          setIsListening(false);
          setMicStatusMessage(
            activeLang === 'hi-IN'
              ? 'माइक शुरू करने के लिए नीचे "Start Mic" दबाएं या स्मार्ट वॉयस बटन चुनें।'
              : 'Tap "Start Mic" below or choose any Smart Voice command.'
          );
        }
      }, 120);
    },
    [activeLang, stopSpeaking, stopListening, processVoiceQuery]
  );

  const handleRequestMicPermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
      setMicStatusMessage(null);
      startListening(activeLang, true);
    } catch {
      setMicStatusMessage(
        activeLang === 'hi-IN'
          ? 'प्रीव्यू Iframe में माइक ब्लॉक है — आप नीचे दिए गए स्मार्ट वॉयस पैड से बिना बोले 1-Click में हर डिश और सवाल पूछ सकते हैं!'
          : 'Microphone is restricted by preview iframe — use the Smart Voice Pad below to speak any dish or question in 1 tap!'
      );
    }
  };

  const handleOpenVoiceModal = () => {
    window.dispatchEvent(new CustomEvent('sarab:stop-welcome-audio'));
    setIsOpen(true);

    if (!hasGreetedSessionRef.current) {
      hasGreetedSessionRef.current = true;
      if (settings.askLanguageFirst) {
        setHasSelectedLanguage(false);
        const promptText =
          settings.languagePromptSpeechHi ||
          `नमस्ते! ${data.profile.name} में आपका स्वागत है। आप कौन सी भाषा में बात करना पसंद करेंगे — हिंदी, गुजराती, या इंग्लिश?`;

        setTurns([
          {
            id: 'lang-prompt-turn',
            role: 'assistant',
            text: promptText,
            timestamp: formatISTTime(),
            showLanguagePicker: true,
          },
        ]);

        speakText(promptText, 'hi-IN', () => {
          if (settings.autoListenAfterGreeting) {
            startListening('hi-IN', false);
          }
        });
      } else {
        setHasSelectedLanguage(true);
        const greet =
          settings.defaultLanguage === 'gu-IN'
            ? settings.greetingAfterLanguageGu
            : settings.defaultLanguage === 'en-IN'
            ? settings.greetingAfterLanguageEn
            : settings.greetingAfterLanguageHi;
        setTurns([
          {
            id: 'init-greet-turn',
            role: 'assistant',
            text: greet,
            timestamp: formatISTTime(),
          },
        ]);
        speakText(greet, settings.defaultLanguage || 'hi-IN', () => {
          if (settings.autoListenAfterGreeting) {
            startListening(settings.defaultLanguage || 'hi-IN', false);
          }
        });
      }
    }
  };

  const handleCloseVoiceModal = () => {
    stopSpeaking();
    stopListening();
    setIsSpeakStudioOpen(false);
    setIsOpen(false);
  };

  const handleSelectLanguage = (chosenLang: VoiceLang) => {
    setActiveLang(chosenLang);
    setHasSelectedLanguage(true);

    const userLabel =
      chosenLang === 'hi-IN'
        ? '🇮🇳 हिंदी (Hindi)'
        : chosenLang === 'gu-IN'
        ? '🇮🇳 ગુજરાતી (Gujarati)'
        : '🇬🇧 English';

    const confirmText =
      chosenLang === 'hi-IN'
        ? settings.greetingAfterLanguageHi ||
          'धन्यवाद! अब मैं आपसे हिंदी में बात करूँगी। आप किसी भी डिश का नाम बोल सकते हैं जैसे पनीर तूफानी, या नीचे स्मार्ट वॉयस पैड से चुन सकते हैं!'
        : chosenLang === 'gu-IN'
        ? settings.greetingAfterLanguageGu ||
          'આભાર! હવે હું આપની સાથે ગુજરાતીમાં વાત કરીશ. આપ કોઈપણ વાનગીનું નામ બોલી શકો છો જેમ કે પનીર તુફાની, અથવા નીચેના સ્માર્ટ વોઇસ પેડથી પસંદ કરી શકો છો!'
        : settings.greetingAfterLanguageEn ||
          'Thank you! I will now assist you in English. You can say any dish name like Paneer Toofani, or tap any dish in our Smart Voice Pad below!';

    setTurns(prev => [
      ...prev,
      { id: `u-lang-${Date.now()}`, role: 'user', text: userLabel, timestamp: formatISTTime() },
      { id: `b-lang-${Date.now() + 1}`, role: 'assistant', text: confirmText, timestamp: formatISTTime() },
    ]);

    speakText(confirmText, chosenLang, () => {
      if (settings.autoListenAfterGreeting) {
        startListening(chosenLang, false);
      }
    });
  };

  const handleResetConversation = () => {
    stopSpeaking();
    stopListening();
    setIsSpeakStudioOpen(false);
    hasGreetedSessionRef.current = false;
    setTurns([]);
    setTimeout(() => {
      handleOpenVoiceModal();
    }, 60);
  };

  if (!settings.enabled) return null;

  const buttonPositionClass =
    settings.position === 'bottom_center'
      ? 'left-1/2 -translate-x-1/2 bottom-5'
      : settings.position === 'bottom_left'
      ? 'left-4 sm:left-6 bottom-32'
      : 'right-4 sm:right-6 bottom-24 sm:bottom-24';

  return (
    <>
      {!isOpen && (
        <div
          data-voice-assistant="true"
          className={`fixed ${buttonPositionClass} z-40 animate-fadeIn`}
        >
          <button
            type="button"
            onClick={handleOpenVoiceModal}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full text-white shadow-[0_12px_35px_rgba(232,40,26,0.45)] border-2 border-white/25 transition-all hover:scale-105 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #1a1a1a 100%)`,
            }}
            title="Talk to Live Voice Assistant (Hindi / Gujarati / English)"
          >
            <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#f6a623] text-[#1a1a1a] shadow-inner">
              <Mic className="w-4 h-4 stroke-[2.5]" />
              <span className="absolute inset-0 rounded-full bg-[#f6a623] animate-ping opacity-35" />
            </span>
            <div className="text-left pr-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#f6a623] leading-none">
                100% Voice Order
              </div>
              <div className="text-xs font-extrabold text-white leading-tight mt-0.5">
                {settings.assistantName || '🎙️ Voice Waiter'}
              </div>
            </div>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          data-voice-assistant="true"
          className="fixed inset-x-2.5 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 sm:w-[440px] max-w-[calc(100vw-1.25rem)] max-h-[88vh] flex flex-col bg-[#161616] text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.75)] border border-white/15 overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div
            className="p-3.5 sm:p-4 flex items-center justify-between gap-2 border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #1f1f1f 100%)`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#f6a623] text-[#1a1a1a] flex items-center justify-center shrink-0 shadow-md relative">
                <Mic className="w-5 h-5 stroke-[2.5]" />
                {(isListening || isSpeaking) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#161616] animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <h3
                  className="font-bold text-sm sm:text-base text-white truncate"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {settings.assistantName || 'Sarab Voice Waiter'}
                </h3>
                <p className="text-[11px] text-white/80 truncate">
                  {isListening
                    ? '🎙️ माइक चालू है... अब बोलें (Listening)'
                    : isSpeaking
                    ? '🔊 बोलकर जवाब दिया जा रहा है...'
                    : settings.assistantTitle || 'Speak dish name or use Smart Voice Pad'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleResetConversation}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Restart & Choose Language Again"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextMute = !isVoiceMuted;
                  setIsVoiceMuted(nextMute);
                  if (nextMute) stopSpeaking();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isVoiceMuted ? 'Unmute Voice' : 'Mute Voice'}
              >
                {isVoiceMuted ? (
                  <VolumeX className="w-4 h-4 text-red-300" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={handleCloseVoiceModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Voice Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Language Bar + Cart Summary Bar */}
          <div className="px-3.5 py-2 bg-[#222222] border-b border-white/10 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#f6a623]" />
              <span className="text-white/60">Language:</span>
              {(
                [
                  { code: 'hi-IN', label: 'हिंदी' },
                  { code: 'gu-IN', label: 'ગુજરાતી' },
                  { code: 'en-IN', label: 'EN' },
                ] as const
              ).map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelectLanguage(l.code)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    hasSelectedLanguage && activeLang === l.code
                      ? 'bg-[#f6a623] text-[#1a1a1a]'
                      : 'bg-white/10 text-white/75 hover:bg-white/20'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {cartCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCartOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold flex items-center gap-1 shadow-xs hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-3 h-3" />
                <span>
                  {cartCount} ({currency}
                  {subtotal})
                </span>
              </button>
            )}
          </div>

          {/* Conversation & Interactive Cards Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 max-h-[46vh]">
            {turns.map(turn => (
              <div
                key={turn.id}
                className={`flex flex-col ${
                  turn.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    turn.role === 'user'
                      ? 'bg-[#e8281a] text-white rounded-br-xs font-medium'
                      : 'bg-[#262626] text-white/95 border border-white/10 rounded-bl-xs'
                  }`}
                >
                  <p>{turn.text}</p>
                  {turn.autoAddedDishName && (
                    <div className="mt-2 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Added {turn.autoAddedDishName} to Cart!</span>
                    </div>
                  )}
                </div>

                {turn.showLanguagePicker && !hasSelectedLanguage && (
                  <div className="w-full mt-2.5 grid grid-cols-3 gap-2">
                    {[
                      { code: 'hi-IN' as const, flag: '🇮🇳', title: 'हिंदी', sub: 'Hindi' },
                      { code: 'gu-IN' as const, flag: '🇮🇳', title: 'ગુજરાતી', sub: 'Gujarati' },
                      { code: 'en-IN' as const, flag: '🇬🇧', title: 'English', sub: 'English' },
                    ].map(langOpt => (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => handleSelectLanguage(langOpt.code)}
                        className="p-3 rounded-2xl bg-[#262626] hover:bg-[#f6a623] text-white hover:text-[#1a1a1a] border border-white/15 transition-all text-center cursor-pointer group shadow-md"
                      >
                        <div className="text-lg mb-0.5">{langOpt.flag}</div>
                        <div className="font-bold text-xs">{langOpt.title}</div>
                        <div className="text-[10px] opacity-70">{langOpt.sub}</div>
                      </button>
                    ))}
                  </div>
                )}

                {turn.showCartCard && cart.length > 0 && (
                  <div className="w-full mt-2.5 p-3 rounded-2xl bg-[#222222] border border-emerald-500/40 space-y-2">
                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                      <span>🛒 Your Active Cart ({cartCount} items)</span>
                      <span>
                        {currency}
                        {subtotal}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Open Cart & Place Order</span>
                    </button>
                  </div>
                )}

                {turn.matchedDishes && turn.matchedDishes.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2.5">
                    {turn.matchedDishes.map(dish => {
                      const dishVariants = (data.variants || []).filter(
                        v => v.menuItemId === dish.id && v.isAvailable !== false
                      );
                      const allAddonGroups = data.addonGroups || [];
                      const isCustomizing = customizingDishId === dish.id;
                      const isJustAdded = addedDishFeedback[dish.id];

                      return (
                        <div
                          key={dish.id}
                          className="p-3 rounded-2xl bg-[#222222] border border-white/15 space-y-2.5 shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            {dish.imageUrl && (
                              <img
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2.5 h-2.5 rounded-xs border flex items-center justify-center shrink-0 ${
                                    dish.isVeg
                                      ? 'border-emerald-500 bg-emerald-500/20'
                                      : 'border-red-500 bg-red-500/20'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      dish.isVeg ? 'bg-emerald-400' : 'bg-red-400'
                                    }`}
                                  />
                                </span>
                                <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                                  {dish.name}
                                </h4>
                              </div>
                              <p className="text-[11px] text-white/65 line-clamp-2 mt-0.5">
                                {dish.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-extrabold text-xs sm:text-sm text-[#f6a623]">
                                  {currency}
                                  {dish.price}
                                </span>
                                {dish.oldPrice && (
                                  <span className="text-[10px] text-white/40 line-through">
                                    {currency}
                                    {dish.oldPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
                            {settings.enableDishLinkNavigation !== false && (
                              <button
                                type="button"
                                onClick={() => handleOpenDishInMenu(dish)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3 text-[#f6a623]" />
                                <span>Open Dish Link</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setCustomizingDishId(isCustomizing ? null : dish.id)
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                isCustomizing
                                  ? 'bg-[#f6a623] text-[#1a1a1a]'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>⚙️ Options</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAddDishToCart(dish, 1)}
                              className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                isJustAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#e8281a] hover:bg-[#c01e12] text-white'
                              }`}
                            >
                              {isJustAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added to Cart</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>+ Add to Cart</span>
                                </>
                              )}
                            </button>
                          </div>

                          {isCustomizing && (
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5 text-[11px]">
                              {dishVariants.length > 0 && (
                                <div>
                                  <div className="font-bold text-white/80 mb-1">
                                    Select Portion / Size:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {dishVariants.map(v => {
                                      const sel =
                                        (selectedVariantByDish[dish.id] ||
                                          dishVariants[0]?.id) === v.id;
                                      return (
                                        <button
                                          key={v.id}
                                          type="button"
                                          onClick={() =>
                                            setSelectedVariantByDish(prev => ({
                                              ...prev,
                                              [dish.id]: v.id,
                                            }))
                                          }
                                          className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                                            sel
                                              ? 'bg-[#f6a623] text-[#1a1a1a]'
                                              : 'bg-white/10 text-white/80'
                                          }`}
                                        >
                                          {v.name} ({currency}
                                          {v.price})
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {allAddonGroups.length > 0 && (
                                <div>
                                  <div className="font-bold text-white/80 mb-1">
                                    Extra Add-ons / Toppings:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {allAddonGroups
                                      .flatMap(g => g.options || [])
                                      .filter(o => o.isAvailable !== false)
                                      .slice(0, 6)
                                      .map(opt => {
                                        const cur = selectedAddonsByDish[dish.id] || [];
                                        const checked = cur.includes(opt.id);
                                        return (
                                          <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                              const next = checked
                                                ? cur.filter(id => id !== opt.id)
                                                : [...cur, opt.id];
                                              setSelectedAddonsByDish(prev => ({
                                                ...prev,
                                                [dish.id]: next,
                                              }));
                                            }}
                                            className={`px-2 py-1 rounded-lg font-medium cursor-pointer ${
                                              checked
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-white/10 text-white/80'
                                            }`}
                                          >
                                            {checked ? '✓ ' : '+ '}
                                            {opt.name} (+{currency}
                                            {opt.price})
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}

                              <div>
                                <input
                                  type="text"
                                  value={customNoteByDish[dish.id] || ''}
                                  onChange={e =>
                                    setCustomNoteByDish(prev => ({
                                      ...prev,
                                      [dish.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Cooking note (e.g. Less spicy, Jain, Extra crispy)"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 text-[11px]"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  handleAddDishToCart(dish, 1);
                                  setCustomizingDishId(null);
                                }}
                                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                + Add Customized Dish to Cart
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {turn.matchedOffers && turn.matchedOffers.length > 0 && (
                  <div className="w-full mt-2 space-y-2">
                    {turn.matchedOffers.map(offer => (
                      <div
                        key={offer.id}
                        className="p-3 rounded-2xl bg-[#222222] border border-[#f6a623]/40 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-[#f6a623] uppercase">
                            {offer.discountBadge} • Code: {offer.code}
                          </div>
                          <div className="font-bold text-xs text-white truncate">
                            {offer.title}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent('sarab:apply-coupon', { detail: offer.code })
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#f6a623] text-[#1a1a1a] text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                        >
                          <TicketPercent className="w-3.5 h-3.5" />
                          <span>Apply {offer.code}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {turn.showLocationCard && (
                  <div className="w-full mt-2 p-3 rounded-2xl bg-[#222222] border border-white/15 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-white/90">
                      <MapPin className="w-4 h-4 text-[#f6a623] shrink-0 mt-0.5" />
                      <span>
                        {data.profile.address}, {data.profile.city}
                      </span>
                    </div>
                    <a
                      href={
                        data.profile.googleMapsUrl ||
                        `https://maps.google.com/?q=${encodeURIComponent(
                          `${data.profile.address}, ${data.profile.city}`
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 rounded-xl bg-[#f6a623] text-[#1a1a1a] font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Open Google Maps Directions</span>
                    </a>
                  </div>
                )}
              </div>
            ))}

            {interimTranscript && (
              <div className="flex justify-end">
                <div className="px-3.5 py-2 rounded-2xl bg-[#e8281a] text-white text-xs font-semibold border border-white/30 shadow-md flex items-center gap-2">
                  <span>🎙️ &ldquo;{interimTranscript}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => {
                      const textToSend = interimTranscript.trim();
                      stopListening();
                      if (textToSend) processVoiceQuery(textToSend, activeLang);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white text-[#1a1a1a] font-bold text-[10px] cursor-pointer"
                  >
                    Send ✓
                  </button>
                </div>
              </div>
            )}

            <div ref={turnsEndRef} />
          </div>

          {/* SMART VOICE & SPEAK STUDIO DRAWER */}
          {isSpeakStudioOpen && (
            <div className="bg-[#1b1b1b] border-t-2 border-[#f6a623] p-3 space-y-2.5 max-h-[42vh] overflow-y-auto animate-fadeIn">
              <div className="p-2.5 rounded-2xl bg-[#252525] border border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        startListening(activeLang, true);
                      }
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                        : 'bg-[#f6a623] text-[#1a1a1a]'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <span>
                        {isListening
                          ? activeLang === 'hi-IN'
                            ? '🎙️ अब बोलिए... (जैसे: "पनीर तूफानी")'
                            : activeLang === 'gu-IN'
                            ? '🎙️ હવે બોલો... (દા.ત. "પનીર તુફાની")'
                            : '🎙️ Speak Now... (e.g. "Paneer Toofani")'
                          : activeLang === 'hi-IN'
                          ? '🎙️ माइक या नीचे स्मार्ट वॉयस बटन चुनें'
                          : '🎙️ Tap Mic or Choose Smart Voice Button'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/65 truncate">
                      {interimTranscript
                        ? `सुना गया: "${interimTranscript}"`
                        : activeLang === 'hi-IN'
                        ? 'बिना बोले भी नीचे किसी भी डिश पर टैप करके तुरंत बात करें!'
                        : 'Tap any dish or voice command below to speak in 1 click!'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {interimTranscript && (
                    <button
                      type="button"
                      onClick={() => {
                        const q = interimTranscript.trim();
                        stopListening();
                        if (q) processVoiceQuery(q, activeLang);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Send ✓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      stopListening();
                      setIsSpeakStudioOpen(false);
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs cursor-pointer"
                    title="Close Speak Studio"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {micStatusMessage && (
                <div className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-between gap-2 text-[11px] text-amber-200">
                  <span>{micStatusMessage}</span>
                  <button
                    type="button"
                    onClick={handleRequestMicPermission}
                    className="px-2.5 py-1 rounded-lg bg-[#f6a623] text-[#1a1a1a] font-bold shrink-0 cursor-pointer"
                  >
                    Allow Mic
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5 bg-[#121212] p-1 rounded-xl border border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSmartPadTab('dishes')}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    smartPadTab === 'dishes'
                      ? 'bg-[#f6a623] text-[#1a1a1a]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <UtensilsCrossed className="w-3 h-3" />
                  <span>🍲 बोलें: डिश</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSmartPadTab('categories')}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    smartPadTab === 'categories'
                      ? 'bg-[#f6a623] text-[#1a1a1a]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>📂 कैटेगरी</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSmartPadTab('commands')}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    smartPadTab === 'commands'
                      ? 'bg-[#f6a623] text-[#1a1a1a]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>⚡ स्मार्ट सवाल</span>
                </button>
              </div>

              {smartPadTab === 'dishes' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={dishSearchFilter}
                      onChange={e => setDishSearchFilter(e.target.value)}
                      placeholder="डिश खोजें और 1-Click में बोलें (e.g. Paneer Tufani, Burger)..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] text-white placeholder-white/45 focus:outline-none focus:border-[#f6a623]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {filteredSmartDishes.map(dish => (
                      <div
                        key={dish.id}
                        className="p-2 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-between gap-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => processVoiceQuery(dish.name, activeLang)}
                          className="flex-1 text-left min-w-0 cursor-pointer group"
                          title={`Ask Voice Waiter about ${dish.name}`}
                        >
                          <div className="text-[11px] font-bold text-white group-hover:text-[#f6a623] truncate flex items-center gap-1">
                            <span>🎙️ {dish.name}</span>
                          </div>
                          <div className="text-[10px] text-[#f6a623] font-semibold">
                            {currency}
                            {dish.price} • Tap to Speak
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            processVoiceQuery(`1 ${dish.name} cart mein add karo`, activeLang)
                          }
                          className="px-2 py-1 rounded-lg bg-[#e8281a] hover:bg-[#c41e12] text-white text-[10px] font-bold shrink-0 cursor-pointer"
                          title={`Voice Add ${dish.name} to Cart`}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {smartPadTab === 'categories' && (
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                  {activeCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => processVoiceQuery(`${cat.name} menu dikhao`, activeLang)}
                      className="p-2.5 rounded-xl bg-[#252525] hover:bg-[#f6a623] text-white hover:text-[#1a1a1a] border border-white/10 text-left text-xs font-bold transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">🎙️ {cat.name}</span>
                      <span className="text-[10px] opacity-75">Speak →</span>
                    </button>
                  ))}
                </div>
              )}

              {smartPadTab === 'commands' && (
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                  {[
                    { label: '🛒 मेरा कार्ट और बिल बताओ', query: 'Mera cart batao' },
                    { label: '🎁 आज का बेस्ट ऑफर क्या है?', query: 'Today special offers' },
                    { label: '🌿 Pure Veg में क्या है?', query: 'Pure Veg Menu' },
                    { label: '⭐ सबसे फेमस डिश बताओ', query: 'Bestseller dishes batao' },
                    { label: '🕒 रेस्टोरेंट कब खुलता है?', query: 'Restaurant opening timing' },
                    { label: '📍 पता और गूगल मैप दिखाओ', query: 'Restaurant address and location' },
                    { label: '🛵 डिलीवरी चार्ज कितना है?', query: 'Home delivery charges' },
                    { label: '🍲 पनीर तूफानी कार्ट में जोड़ें', query: '1 Paneer Toofani cart mein add karo' },
                  ].map(cmd => (
                    <button
                      key={cmd.query}
                      type="button"
                      onClick={() => processVoiceQuery(cmd.query, activeLang)}
                      className="p-2 rounded-xl bg-[#252525] hover:bg-[#f6a623] text-white hover:text-[#1a1a1a] border border-white/10 text-left text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggested Quick Voice Prompts Bar */}
          <div className="px-3 py-2 bg-[#1c1c1c] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              {
                label:
                  activeLang === 'hi-IN'
                    ? '🍲 पनीर तूफानी'
                    : activeLang === 'gu-IN'
                    ? '🍲 પનીર તુફાની'
                    : '🍲 Paneer Toofani',
                query: 'Paneer Toofani',
              },
              {
                label:
                  activeLang === 'hi-IN'
                    ? '🍔 डबल स्मैश बर्गर'
                    : activeLang === 'gu-IN'
                    ? '🍔 સ્મેશ બર્ગર'
                    : '🍔 Smash Burger',
                query: 'Double Smash Burger',
              },
              {
                label:
                  activeLang === 'hi-IN'
                    ? '🎁 आज के ऑफर्स'
                    : activeLang === 'gu-IN'
                    ? '🎁 આજના ઓફર્સ'
                    : '🎁 Today Offers',
                query: 'Today special offers',
              },
              {
                label:
                  activeLang === 'hi-IN'
                    ? '🛒 मेरा कार्ट'
                    : activeLang === 'gu-IN'
                    ? '🛒 મારું કાર્ટ'
                    : '🛒 My Cart',
                query: 'Mera cart batao',
              },
              {
                label:
                  activeLang === 'hi-IN'
                    ? '🌿 Pure Veg'
                    : activeLang === 'gu-IN'
                    ? '🌿 પ્યોર વેજ'
                    : '🌿 Pure Veg',
                query: 'Pure Veg Menu',
              },
            ].map(chip => (
              <button
                key={chip.query}
                type="button"
                onClick={() => processVoiceQuery(chip.query, activeLang)}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#f6a623] text-white hover:text-[#1a1a1a] text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Live Dish Autocomplete Bar */}
          {liveInputDishMatches.length > 0 && (
            <div className="px-3 py-1.5 bg-[#222222] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[#f6a623] font-bold shrink-0">⚡ Match:</span>
              {liveInputDishMatches.map(dish => (
                <div
                  key={dish.id}
                  className="flex items-center gap-1 bg-white/10 rounded-full pl-2.5 pr-1 py-0.5 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setManualInput('');
                      processVoiceQuery(dish.name, activeLang);
                    }}
                    className="text-[11px] font-bold text-white hover:text-[#f6a623] cursor-pointer"
                  >
                    🎙️ {dish.name} ({currency}
                    {dish.price})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualInput('');
                      processVoiceQuery(`1 ${dish.name} cart mein add karo`, activeLang);
                    }}
                    className="px-1.5 py-0.5 rounded-full bg-[#e8281a] text-white text-[10px] font-bold cursor-pointer"
                  >
                    +Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="p-3 bg-[#121212] border-t border-white/10 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    const captured = (
                      interimTranscript || latestTranscriptRef.current
                    ).trim();
                    stopListening();
                    if (captured) {
                      processVoiceQuery(captured, activeLang);
                    }
                  } else {
                    startListening(activeLang, true);
                  }
                }}
                className={`flex-1 py-3 px-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-[#f6a623] hover:bg-[#ffba42] text-[#1a1a1a]'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>🎙️ सुन रहा हूँ... (Tap to Send/Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {activeLang === 'hi-IN'
                        ? '🎙️ बोलने के लिए दबाएं (Speak)'
                        : activeLang === 'gu-IN'
                        ? '🎙️ બોલવા માટે દબાવો (Speak)'
                        : '🎙️ Tap & Speak Now'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSpeakStudioOpen(prev => !prev)}
                className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                  isSpeakStudioOpen
                    ? 'bg-[#e8281a] text-white border-[#e8281a]'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                }`}
                title="Open 1-Tap Smart Voice Pad"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f6a623]" />
                <span>Smart Pad</span>
              </button>

              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="py-3 px-3 rounded-2xl bg-white/15 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Stop Voice Output"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!manualInput.trim()) return;
                const q = manualInput.trim();
                setManualInput('');
                processVoiceQuery(q, activeLang);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder={
                  activeLang === 'hi-IN'
                    ? 'या यहाँ डिश का नाम लिखें (जैसे: Paneer Tufani)...'
                    : activeLang === 'gu-IN'
                    ? 'અથવા અહીં વાનગીનું નામ લખો (દા.ત. Paneer Tufani)...'
                    : 'Or type dish name (e.g. Paneer Tufani)...'
                }
                className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#f6a623]"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-[#e8281a] hover:bg-[#c41e12] text-white transition-colors cursor-pointer"
                aria-label="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
