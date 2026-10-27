import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  Square,
  Play,
  Save,
  Sparkles,
  Sliders,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../../data/defaultRestaurantData';
import { VoiceAssistantSettings } from '../../../types';
import {
  VOICE_PERSONA_PRESETS,
  normalizeSpeechTextForClarity,
  splitIntoSpeechSentences,
  selectBestSpeechVoice,
} from '../../../utils/pleasantAudioGenerator';

interface AdminVoiceAssistantProps {
  showToast?: (msg: string) => void;
}

export const AdminVoiceAssistant: React.FC<AdminVoiceAssistantProps> = ({ showToast }) => {
  const { data, updateVoiceAssistantSettings } = useRestaurant();

  const [draft, setDraft] = useState<VoiceAssistantSettings>(() =>
    JSON.parse(
      JSON.stringify(
        data.voiceAssistantSettings || DEFAULT_RESTAURANT_DATA.voiceAssistantSettings!
      )
    )
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSpeakingPreview, setIsSpeakingPreview] = useState(false);
  const previewTokenRef = useRef<number>(0);

  useEffect(() => {
    if (!isDirty && data.voiceAssistantSettings) {
      setDraft(JSON.parse(JSON.stringify(data.voiceAssistantSettings)));
    }
  }, [data.voiceAssistantSettings, isDirty]);

  const updateField = <K extends keyof VoiceAssistantSettings>(
    key: K,
    value: VoiceAssistantSettings[K]
  ) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSaveAll = (customDraft?: VoiceAssistantSettings) => {
    const toSave = customDraft || draft;
    updateVoiceAssistantSettings(toSave);
    setIsDirty(false);
    if (showToast) {
      showToast('Voice Assistant settings saved and live on website!');
    }
  };

  const stopPreviewVoice = () => {
    previewTokenRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingPreview(false);
  };

  const speakPreviewText = (
    text: string,
    lang: 'hi-IN' | 'gu-IN' | 'en-IN',
    customCfg?: VoiceAssistantSettings
  ) => {
    const cfg = customCfg || draft;
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
      return;
    }

    const token = ++previewTokenRef.current;
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const clean = normalizeSpeechTextForClarity(text, lang, true);
    const sentences = splitIntoSpeechSentences(clean);
    if (sentences.length === 0) return;

    const voices = window.speechSynthesis.getVoices();
    const personaObj = VOICE_PERSONA_PRESETS.find(
      p => p.id === (cfg.voicePersona || 'warm_hostess')
    );
    const effectiveGender = cfg.voiceGender || personaObj?.gender || 'female';
    const effectiveRate =
      cfg.voicePersona && cfg.voicePersona !== 'custom' && personaObj
        ? personaObj.rate
        : cfg.voiceRate || 0.96;
    const effectivePitch =
      cfg.voicePersona && cfg.voicePersona !== 'custom' && personaObj
        ? personaObj.pitch
        : cfg.voicePitch || 1.04;

    const matchedVoice = selectBestSpeechVoice(voices, lang, effectiveGender);

    const speakIdx = (idx: number) => {
      if (previewTokenRef.current !== token) return;
      if (idx >= sentences.length) {
        setIsSpeakingPreview(false);
        return;
      }

      const u = new SpeechSynthesisUtterance(sentences[idx]);
      u.lang = lang;
      u.rate = Math.min(1.2, Math.max(0.8, effectiveRate));
      u.pitch = Math.min(1.2, Math.max(0.8, effectivePitch));
      u.volume = cfg.volume ?? 0.9;
      if (matchedVoice) u.voice = matchedVoice;

      u.onend = () => {
        if (previewTokenRef.current !== token) return;
        if (idx + 1 < sentences.length) {
          setTimeout(() => speakIdx(idx + 1), 120);
        } else {
          setIsSpeakingPreview(false);
        }
      };
      u.onerror = () => {
        if (previewTokenRef.current !== token) return;
        setIsSpeakingPreview(false);
      };

      setIsSpeakingPreview(true);
      window.speechSynthesis.speak(u);
    };

    speakIdx(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Master Bar: ON / OFF Toggle + Test + Save */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8281a] text-white flex items-center justify-center shrink-0 shadow-md">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-xl font-black text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                100% Free Lifetime AI Voice Assistant (Voice Waiter)
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  draft.enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {draft.enabled ? '● LIVE ON WEBSITE' : '○ TURNED OFF'}
              </span>
            </div>
            <p className="text-xs text-[#7a6e65] mt-0.5">
              Separate from Chatbot & Welcome Audio Player — asks customer&apos;s preferred language first, understands spoken dish names (e.g. &ldquo;Paneer Tufani&rdquo;), shows direct dish links, and answers from live website data!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (isSpeakingPreview) {
                stopPreviewVoice();
              } else {
                speakPreviewText(draft.languagePromptSpeechHi, 'hi-IN', draft);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-[#fff8f0] hover:bg-[#f3e9dc] text-[#1a1a1a] border border-[#e0d6c8] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            {isSpeakingPreview ? (
              <Square className="w-3.5 h-3.5 text-[#e8281a] fill-current" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#e8281a]" />
            )}
            <span>{isSpeakingPreview ? 'Stop Voice' : 'Test Voice Greeting'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = { ...draft, enabled: !draft.enabled };
              setDraft(next);
              handleSaveAll(next);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              draft.enabled
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
            }`}
          >
            {draft.enabled
              ? 'Voice Assistant ON (Click to Turn Off)'
              : 'Voice Assistant OFF (Click to Turn On)'}
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01e12] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Section 1: Voice Quality, Persona & Speed Tuning */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-5">
        <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#e8281a]" />
          <span>1. Natural Non-Robotic Voice Tone & Speed Settings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {VOICE_PERSONA_PRESETS.slice(0, 4).map(persona => {
            const isSelected = (draft.voicePersona || 'warm_hostess') === persona.id;
            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => {
                  const next: VoiceAssistantSettings = {
                    ...draft,
                    voicePersona: persona.id,
                    voiceGender: persona.gender,
                    voiceRate: persona.rate,
                    voicePitch: persona.pitch,
                  };
                  setDraft(next);
                  setIsDirty(true);
                  speakPreviewText(next.greetingAfterLanguageHi, 'hi-IN', next);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#e8281a] bg-[#fff8f0]'
                    : 'border-[#e0d6c8] bg-white hover:border-[#e8281a]/40'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-[#1a1a1a] mb-1">
                  {persona.title}
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full bg-[#f6a623]/20 text-[#b56c00] text-[10px] font-bold mb-1.5">
                  {persona.badge}
                </span>
                <p className="text-[11px] text-[#7a6e65] leading-snug">{persona.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8]">
          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] mb-1">
              Voice Speed: {(draft.voiceRate ?? 0.96).toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.02"
              value={draft.voiceRate ?? 0.96}
              onChange={e => {
                updateField('voicePersona', 'custom');
                updateField('voiceRate', parseFloat(e.target.value));
              }}
              className="w-full accent-[#e8281a]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] mb-1">
              Voice Pitch / Warmth: {(draft.voicePitch ?? 1.04).toFixed(2)}
            </label>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.02"
              value={draft.voicePitch ?? 1.04}
              onChange={e => {
                updateField('voicePersona', 'custom');
                updateField('voicePitch', parseFloat(e.target.value));
              }}
              className="w-full accent-[#e8281a]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] mb-1">
              Voice Volume: {Math.round((draft.volume ?? 0.9) * 100)}%
            </label>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={draft.volume ?? 0.9}
              onChange={e => updateField('volume', parseFloat(e.target.value))}
              className="w-full accent-[#e8281a]"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Step-1 Language Selection & Multi-Language Greetings */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-4">
        <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#e8281a]" />
          <span>2. Language Selection Prompt & Multi-Language Voice Greetings</span>
        </h3>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#1a1a1a]">
              Step 1: What the Voice Agent Asks First (To Let Customer Pick Language)
            </label>
            <button
              type="button"
              onClick={() => speakPreviewText(draft.languagePromptSpeechHi, 'hi-IN', draft)}
              className="px-2.5 py-1 rounded-lg bg-[#e8281a]/10 hover:bg-[#e8281a] text-[#e8281a] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Listen Prompt</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={draft.languagePromptSpeechHi}
            onChange={e => updateField('languagePromptSpeechHi', e.target.value)}
            className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1a1a1a]">
                🇮🇳 Greeting After Choosing Hindi
              </label>
              <button
                type="button"
                onClick={() =>
                  speakPreviewText(draft.greetingAfterLanguageHi, 'hi-IN', draft)
                }
                className="px-2.5 py-1 rounded-lg bg-[#e8281a]/10 hover:bg-[#e8281a] text-[#e8281a] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Listen Hindi</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={draft.greetingAfterLanguageHi}
              onChange={e => updateField('greetingAfterLanguageHi', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1a1a1a]">
                🇮🇳 Greeting After Choosing Gujarati
              </label>
              <button
                type="button"
                onClick={() =>
                  speakPreviewText(draft.greetingAfterLanguageGu, 'gu-IN', draft)
                }
                className="px-2.5 py-1 rounded-lg bg-[#e8281a]/10 hover:bg-[#e8281a] text-[#e8281a] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Listen Gujarati</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={draft.greetingAfterLanguageGu}
              onChange={e => updateField('greetingAfterLanguageGu', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1a1a1a]">
                🇬🇧 Greeting After Choosing English
              </label>
              <button
                type="button"
                onClick={() =>
                  speakPreviewText(draft.greetingAfterLanguageEn, 'en-IN', draft)
                }
                className="px-2.5 py-1 rounded-lg bg-[#e8281a]/10 hover:bg-[#e8281a] text-[#e8281a] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Listen English</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={draft.greetingAfterLanguageEn}
              onChange={e => updateField('greetingAfterLanguageEn', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Widget Button Name, Position & Smart Capabilities */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-5">
        <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#e8281a]" />
          <span>3. Button Appearance, Position & Smart Voice Ordering Controls</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Voice Assistant Button Name
            </label>
            <input
              type="text"
              value={draft.assistantName}
              onChange={e => updateField('assistantName', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Voice Assistant Subtitle
            </label>
            <input
              type="text"
              value={draft.assistantTitle}
              onChange={e => updateField('assistantTitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Button Position on Website
            </label>
            <select
              value={draft.position}
              onChange={e =>
                updateField(
                  'position',
                  e.target.value as VoiceAssistantSettings['position']
                )
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            >
              <option value="bottom_right_above_chat">
                Bottom Right (Above Chatbot Button)
              </option>
              <option value="bottom_center">Bottom Center Floating Button</option>
              <option value="bottom_left">Bottom Left</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {[
            {
              key: 'askLanguageFirst' as const,
              label: 'Ask Customer Preferred Language First (Hindi / Gujarati / EN)',
              defaultVal: true,
            },
            {
              key: 'autoListenAfterGreeting' as const,
              label: 'Auto-Start Microphone After Greeting',
              defaultVal: true,
            },
            {
              key: 'enableDirectVoiceCartAdd' as const,
              label: 'Allow Voice Cart Add (e.g. "Paneer Tufani add karo")',
              defaultVal: true,
            },
            {
              key: 'enableDishLinkNavigation' as const,
              label: 'Show Direct Dish Menu Link Card on Match',
              defaultVal: true,
            },
          ].map(item => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={
                  draft[item.key] === undefined ? item.defaultVal : Boolean(draft[item.key])
                }
                onChange={e => updateField(item.key, e.target.checked)}
                className="w-4 h-4 accent-[#e8281a] rounded shrink-0"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">
              100% Free Lifetime & Automatically Synced with Website Content
            </div>
            <p className="text-emerald-800/90 leading-relaxed">
              Your Voice Assistant automatically reads all live Menu Categories, Dishes (with phonetic matching like &ldquo;Paneer Tufani&rdquo; &harr; &ldquo;Paneer Toofani&rdquo;), Prices, Variants/Add-ons, Special Offers, Opening Hours, Location, Delivery Rules, and Chatbot Q&amp;As — with zero API cost forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
