// 100% Browser-Native Pleasant Instrumental WAV Audio Generator & HD Voice Clarity Engine
// Generates real playable WAV audio URLs in-memory and provides intelligent Indian TTS voice
// ranking, text normalization, sentence pacing, and ready-made restaurant voice templates.

const cachedBlobUrls: Record<string, string> = {};

export type BuiltinTrackPreset =
  | 'warm-bossa-lounge'
  | 'upbeat-bistro-groove'
  | 'evening-acoustic-vibe'
  | 'royal-indian-santoor';

export interface VoicePersonaConfig {
  id: 'warm_hostess' | 'royal_concierge' | 'energetic_promo' | 'calm_storyteller' | 'custom';
  title: string;
  badge: string;
  desc: string;
  gender: 'female' | 'male' | 'auto';
  rate: number;
  pitch: number;
}

export const VOICE_PERSONA_PRESETS: VoicePersonaConfig[] = [
  {
    id: 'warm_hostess',
    title: '👩 Warm Female Hostess',
    badge: 'Recommended • Crystal Clear',
    desc: 'Polite, welcoming Indian receptionist tone with clear pronunciation & natural warmth.',
    gender: 'female',
    rate: 0.95,
    pitch: 1.05,
  },
  {
    id: 'royal_concierge',
    title: '👨 Royal Male Concierge',
    badge: 'Deep & Hospitable',
    desc: 'Rich, composed male dining host voice ideal for family dining & fine hospitality.',
    gender: 'male',
    rate: 0.93,
    pitch: 0.92,
  },
  {
    id: 'energetic_promo',
    title: '⚡ Energetic Offer Announcer',
    badge: 'Best for Deals & Combos',
    desc: 'Upbeat, lively delivery that highlights discounts, promo codes, and festival deals.',
    gender: 'female',
    rate: 1.03,
    pitch: 1.08,
  },
  {
    id: 'calm_storyteller',
    title: '✨ Calm Lounge Guide',
    badge: 'Slow & Ultra-Clear',
    desc: 'Extra-clear, unhurried pace so every word and offer code is effortless to understand.',
    gender: 'auto',
    rate: 0.88,
    pitch: 1.0,
  },
  {
    id: 'custom',
    title: '🎛️ Custom Voice Studio',
    badge: 'Full Manual Control',
    desc: 'Manually fine-tune speed, pitch, gender preference, and specific system voice.',
    gender: 'auto',
    rate: 1.0,
    pitch: 1.0,
  },
];

export interface VoiceScriptTemplate {
  id: string;
  title: string;
  badge: string;
  hi: string;
  gu: string;
  en: string;
  suggestedCtaText: string;
  suggestedCtaTarget: string;
}

export const VOICE_SCRIPT_TEMPLATES: VoiceScriptTemplate[] = [
  {
    id: 'welcome-combo-offer',
    title: '🙏 Royal Welcome + 30% Combo Discount',
    badge: 'Most Popular',
    hi: 'नमस्ते! सराब फास्ट फूड एंड डाइनिंग में आपका हार्दिक स्वागत है। आज हमारे स्पेशल बर्गर और पिज़्ज़ा कॉम्बो पर 30 प्रतिशत की विशेष छूट चल रही है। आप नीचे दिए गए मेन्यू से या लाइव चैटबॉट से तुरंत अपना ऑर्डर कन्फर्म कर सकते हैं!',
    gu: 'નમસ્તે! સરાબ ફાસ્ટ ફૂડ એન્ડ ડાઇનિંગમાં આપનું હાર્દિક સ્વાગત છે. આજે અમારા સ્પેશિયલ બર્ગર અને પિઝા કોમ્બો પર 30 ટકા ડિસ્કાઉન્ટ ચાલી રહ્યું છે. આપ વેબસાઇટ અથવા લાઇવ ચેટબોટ પરથી તરત ઓર્ડર કરી શકો છો!',
    en: 'Welcome to Sarab Fast Food and Dining! Enjoy a flat 30 percent discount on our Special Burger and Pizza Combo today. Explore our fresh menu below or place your order instantly through our live chatbot!',
    suggestedCtaText: '🔥 Grab 30% Off Combo',
    suggestedCtaTarget: '#offers',
  },
  {
    id: 'bestseller-specials',
    title: '🍔 Chef’s Bestsellers & Hot Fresh Pizzas',
    badge: 'Menu Highlight',
    hi: 'नमस्ते! गरमा-गरम स्मैश बर्गर, चीज़ बर्स्ट पिज़्ज़ा और मसालेदार पेरी-पेरी फ्राइज़ अभी ताज़ा तैयार हो रहे हैं। अपने पसंदीदा पकवान चुनें, कस्टमाइज़ करें और घर बैठे तेज़ डिलीवरी पाएं!',
    gu: 'નમસ્તે! ગરમાગરમ સ્મેશ બર્ગર, ચીઝ બર્સ્ટ પિઝા અને મસાલેદાર પેરી પેરી ફ્રાયઝ અત્યારે તાજા બની રહ્યા છે. આપની પસંદગીની વાનગી પસંદ કરો અને ઘરે બેઠા ઝડપી ડિલિવરી મેળવો!',
    en: 'Craving something delicious? Our signature Smash Burgers, wood-fired Pizzas, and crispy Peri-Peri Fries are being prepared fresh right now. Customize your dish and order in seconds!',
    suggestedCtaText: '🍔 View Bestseller Dishes',
    suggestedCtaTarget: '#menu',
  },
  {
    id: 'free-home-delivery',
    title: '🛵 Fast Home Delivery & Free Delivery Offer',
    badge: 'Delivery Promo',
    hi: 'स्वागत है! क्या आप घर बैठे लज़ीज़ खाने का आनंद लेना चाहते हैं? ₹499 से अधिक के सभी ऑर्डर पर होम डिलीवरी बिल्कुल मुफ्त है। कूपन कोड FREEDEL499 का उपयोग करें और अभी ऑर्डर करें!',
    gu: 'સ્વાગત છે! શું આપ ઘરે બેઠા સ્વાદિષ્ટ ભોજન માણવા માંગો છો? ₹499 થી વધુના તમામ ઓર્ડર પર હોમ ડિલિવરી બિલકુલ ફ્રી છે. કૂપન કોડ FREEDEL499 વાપરો અને અત્યારે જ ઓર્ડર કરો!',
    en: 'Ordering from home? Enjoy 100 percent free home delivery on all orders above 499 Rupees! Apply coupon code FREEDEL499 at checkout or inside our smart chatbot.',
    suggestedCtaText: '🛵 Claim Free Delivery',
    suggestedCtaTarget: '#offers',
  },
  {
    id: 'family-table-booking',
    title: '📅 Family Dinner & Instant Table Booking',
    badge: 'Dine-In Invite',
    hi: 'नमस्ते! अपने परिवार और दोस्तों के साथ एक शानदार डाइनिंग अनुभव के लिए सराब रेस्टोरेंट पधारें। आप बिना किसी इंतज़ार के वेबसाइट या चैटबॉट से अपनी वीआईपी टेबल तुरंत बुक कर सकते हैं!',
    gu: 'નમસ્તે! આપના પરિવાર અને મિત્રો સાથે શાનદાર ડિનર માટે સરાબ રેસ્ટોરન્ટમાં પધારો. આપ વેબસાઇટ અથવા ચેટબોટ પરથી આપનું ટેબલ તરત જ બુક કરી શકો છો!',
    en: 'Planning a family dinner or celebration? Visit Sarab Fast Food and Dining for warm hospitality and unforgettable flavors. Reserve your VIP table online in just one click!',
    suggestedCtaText: '📅 Reserve a Table Now',
    suggestedCtaTarget: '#reservation',
  },
  {
    id: 'chatbot-instant-order',
    title: '🤖 Smart Chatbot & WhatsApp Quick Order',
    badge: 'Interactive Guide',
    hi: 'नमस्ते! अब ऑर्डर करना और भी आसान है। स्क्रीन के नीचे दिए गए चैटबॉट बटन को दबाएं, मेन्यू कैटेगरी चुनें, अपने हिसाब से स्पाइस और टॉपिंग्स जोड़ें, और सीधे किचन या व्हाट्सऐप पर ऑर्डर भेजें!',
    gu: 'નમસ્તે! હવે ઓર્ડર કરવું ખૂબ જ સરળ છે. સ્ક્રીનની નીચે આપેલા ચેટબોટ બટન પર ક્લિક કરો, મેનુમાંથી વાનગી પસંદ કરો અને સીધો કિચન અથવા વોટ્સએપ પર ઓર્ડર મોકલો!',
    en: 'Need help choosing a dish? Tap our live assistant button at the bottom corner to browse categories, customize toppings, apply discount coupons, and confirm your order in seconds!',
    suggestedCtaText: '💬 Open Smart Chatbot',
    suggestedCtaTarget: '#chatbot',
  },
  {
    id: 'pure-veg-hygiene',
    title: '🌿 100% Fresh Ingredients & Pure Veg Options',
    badge: 'Trust & Quality',
    hi: 'नमस्ते! सराब रेस्टोरेंट में हर पकवान ऑर्डर मिलने पर ही ताज़ा सामग्री और उच्चतम हाइजीन के साथ तैयार किया जाता है। हमारे पास शुद्ध शाकाहारी और जैन-फ्रेंडली विकल्पों की भी विशाल रेंज उपलब्ध है!',
    gu: 'નમસ્તે! સરાબ રેસ્ટોરન્ટમાં દરેક વાનગી ઓર્ડર મળ્યા પછી જ તાજી સામગ્રી અને શ્રેષ્ઠ હાઈજીન સાથે બનાવવામાં આવે છે. અમારી પાસે પ્યોર વેજ વાનગીઓની પણ વિશાળ શ્રેણી ઉપલબ્ધ છે!',
    en: 'At Sarab Fast Food and Dining, every single dish is crafted fresh to order using farm-fresh ingredients and strict kitchen hygiene. Explore our wide range of Pure Veg and signature specialties today!',
    suggestedCtaText: '🌿 Explore Pure Veg Menu',
    suggestedCtaTarget: '#menu',
  },
];

/**
 * Cleans emojis and converts symbols (₹, %, &, /) into natural words so TTS engines
 * pronounce every number and currency clearly without reading out emoji names.
 */
export function normalizeSpeechTextForClarity(
  rawText: string,
  lang: 'hi-IN' | 'gu-IN' | 'en-IN',
  enableEnhancer = true
): string {
  if (!rawText) return '';
  let text = rawText.trim();
  if (!enableEnhancer) return text;

  // Strip emojis & pictographs so TTS never says "fire", "speaker", "party popper"
  text = text.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu,
    ' '
  );

  if (lang === 'hi-IN') {
    // ₹499 -> 499 रुपये
    text = text.replace(/₹\s*(\d+)/g, '$1 रुपये');
    text = text.replace(/₹/g, ' रुपये ');
    text = text.replace(/(\d+)\s*%/g, '$1 प्रतिशत');
    text = text.replace(/&/g, ' और ');
  } else if (lang === 'gu-IN') {
    // ₹499 -> 499 રૂપિયા
    text = text.replace(/₹\s*(\d+)/g, '$1 રૂપિયા');
    text = text.replace(/₹/g, ' રૂપિયા ');
    text = text.replace(/(\d+)\s*%/g, '$1 ટકા');
    text = text.replace(/&/g, ' અને ');
  } else {
    // ₹499 -> 499 Rupees
    text = text.replace(/₹\s*(\d+)/g, '$1 Rupees');
    text = text.replace(/₹/g, ' Rupees ');
    text = text.replace(/(\d+)\s*%/g, '$1 percent');
    text = text.replace(/&/g, ' and ');
  }

  // Collapse multiple spaces and clean bullet characters
  text = text
    .replace(/[•·▪►]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Splits a normalized announcement into natural sentences so browsers speak with
 * clear human pauses and never truncate long announcements.
 */
export function splitIntoSpeechSentences(text: string): string[] {
  if (!text.trim()) return [];
  const parts = text
    .split(/(?<=[।.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()];
}

/**
 * Intelligently selects the clearest, most natural browser voice for the requested
 * language, gender preference, and optional admin-chosen voiceURI.
 */
export function selectBestSpeechVoice(
  voices: SpeechSynthesisVoice[],
  lang: 'hi-IN' | 'gu-IN' | 'en-IN',
  gender: 'auto' | 'female' | 'male' = 'auto',
  selectedVoiceURI?: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. If admin explicitly chose a voice URI that exists on this device, use it
  if (selectedVoiceURI && selectedVoiceURI.trim()) {
    const exactUriMatch = voices.find(
      v => v.voiceURI === selectedVoiceURI || v.name === selectedVoiceURI
    );
    if (exactUriMatch) return exactUriMatch;
  }

  const targetLang = (lang || 'hi-IN').toLowerCase().replace('_', '-');
  const langPrefix = targetLang.split('-')[0]; // 'hi', 'gu', 'en'

  const femaleKeywords = [
    'female',
    'swara',
    'dhwani',
    'neerja',
    'kalpana',
    'heera',
    'lekha',
    'kiyara',
    'veena',
    'samantha',
    'zira',
    'aria',
    'jenny',
    'sonia',
    'google हिन्दी',
    'google ગુજરાતી',
  ];
  const maleKeywords = [
    'male',
    'madhur',
    'niranjan',
    'prabhat',
    'hemant',
    'rishi',
    'ravi',
    'david',
    'guy',
    'ryan',
    'daniel',
  ];

  // Filter voices that can actually speak the target language/script
  const candidates = voices.filter(v => {
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');
    if (langPrefix === 'hi') {
      return vLang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी');
    }
    if (langPrefix === 'gu') {
      return (
        vLang.startsWith('gu') ||
        v.name.toLowerCase().includes('gujarati') ||
        v.name.includes('ગુજરાતી') ||
        vLang.startsWith('hi')
      );
    }
    return vLang.startsWith('en');
  });

  const pool = candidates.length > 0 ? candidates : voices;

  let bestVoice = pool[0];
  let bestScore = -999;

  for (const v of pool) {
    let score = 0;
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');
    const vName = (v.name || '').toLowerCase();

    // Language accuracy
    if (vLang === targetLang) score += 60;
    else if (vLang.startsWith(langPrefix) && vLang.includes('in')) score += 50;
    else if (vLang.startsWith(langPrefix)) score += 35;
    else if (vLang.includes('in')) score += 15;

    // High-definition / Neural / Natural engine quality bonus
    if (vName.includes('natural') || vName.includes('neural')) score += 35;
    if (vName.includes('online')) score += 25;
    if (vName.includes('google')) score += 28;
    if (vName.includes('microsoft')) score += 20;
    if (vName.includes('premium') || vName.includes('enhanced') || vName.includes('siri')) {
      score += 25;
    }

    // Gender preference matching
    if (gender === 'female') {
      if (femaleKeywords.some(k => vName.includes(k))) score += 30;
      if (maleKeywords.some(k => vName.includes(k))) score -= 25;
    } else if (gender === 'male') {
      if (maleKeywords.some(k => vName.includes(k))) score += 30;
      if (femaleKeywords.some(k => vName.includes(k))) score -= 25;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = v;
    }
  }

  return bestVoice || null;
}

/**
 * Checks if a URL is one of our legacy Mixkit preview URLs (which frequently 403/block hotlinking)
 * or a builtin preset identifier.
 */
export function resolvePlayableAudioUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) {
    return getBuiltinTrackWavUrl('warm-bossa-lounge');
  }
  const trimmed = rawUrl.trim();

  if (trimmed.startsWith('builtin:')) {
    const preset = trimmed.replace('builtin:', '') as BuiltinTrackPreset;
    return getBuiltinTrackWavUrl(preset);
  }

  // Replace known unreliable hotlink-blocked mixkit URLs with our 100% reliable built-in studio tracks
  if (trimmed.includes('assets.mixkit.co')) {
    if (trimmed.includes('164')) {
      return getBuiltinTrackWavUrl('upbeat-bistro-groove');
    }
    if (trimmed.includes('443')) {
      return getBuiltinTrackWavUrl('evening-acoustic-vibe');
    }
    return getBuiltinTrackWavUrl('warm-bossa-lounge');
  }

  return trimmed;
}

/**
 * Generates a warm, pleasant multi-chord 16-bit PCM WAV Blob URL
 * that plays in any standard HTML5 <audio> element on Android, iOS, and Desktop.
 */
export function getBuiltinTrackWavUrl(preset: BuiltinTrackPreset = 'warm-bossa-lounge'): string {
  if (cachedBlobUrls[preset]) {
    return cachedBlobUrls[preset];
  }

  const sampleRate = 22050;
  const durationSeconds = 12;
  const numSamples = sampleRate * durationSeconds;
  const samples = new Float32Array(numSamples);

  // Musical chord progressions (frequencies in Hz)
  const chordSets: Record<BuiltinTrackPreset, number[][]> = {
    'warm-bossa-lounge': [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [349.23, 440.0, 523.25, 659.25], // Fmaj7
      [392.0, 493.88, 587.33, 698.46], // G7
    ],
    'upbeat-bistro-groove': [
      [293.66, 369.99, 440.0, 554.37], // Dmaj7
      [246.94, 293.66, 369.99, 440.0], // Bm7
      [329.63, 392.0, 493.88, 587.33], // Em7
      [220.0, 277.18, 329.63, 392.0], // A7
    ],
    'evening-acoustic-vibe': [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [196.0, 246.94, 293.66, 392.0], // Gadd9
    ],
    'royal-indian-santoor': [
      [261.63, 329.63, 392.0, 523.25], // Sa Ga Pa Sa (Raag Hamsadhwani / Yaman vibe)
      [293.66, 369.99, 440.0, 587.33],
      [329.63, 392.0, 493.88, 659.25],
      [261.63, 329.63, 392.0, 523.25],
    ],
  };

  const chords = chordSets[preset] || chordSets['warm-bossa-lounge'];
  const chordDuration = durationSeconds / chords.length; // 3 seconds per chord

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.min(chords.length - 1, Math.floor(t / chordDuration));
    const localT = t - chordIdx * chordDuration;
    const chord = chords[chordIdx];

    // Smooth pad envelope for each chord
    const padAttack = Math.min(1, localT / 0.35);
    const padRelease = Math.min(1, (chordDuration - localT) / 0.45);
    const padEnv = padAttack * padRelease * 0.16;

    let signal = 0;

    // Warm electric piano / lounge pad harmonics
    for (let n = 0; n < chord.length; n++) {
      const freq = chord[n];
      signal += Math.sin(2 * Math.PI * freq * t) * padEnv;
      signal += Math.sin(2 * Math.PI * freq * 2 * t) * (padEnv * 0.25);
    }

    // Gentle arpeggiated bell/santoor pluck
    const stepDuration = preset === 'royal-indian-santoor' ? 0.25 : 0.375;
    const stepIdx = Math.floor(localT / stepDuration);
    const stepLocalT = localT - stepIdx * stepDuration;
    const noteFreq =
      chord[stepIdx % chord.length] *
      (preset === 'upbeat-bistro-groove' || preset === 'royal-indian-santoor' ? 2 : 1.5);
    const pluckEnv = Math.exp(-stepLocalT * 7.5) * Math.min(1, stepLocalT / 0.015) * 0.14;
    signal += Math.sin(2 * Math.PI * noteFreq * t) * pluckEnv;

    // Soft clamp
    samples[i] = Math.max(-0.95, Math.min(0.95, signal));
  }

  const wavBuffer = encodeWAV(samples, sampleRate);
  try {
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    cachedBlobUrls[preset] = url;
    return url;
  } catch {
    return '';
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
