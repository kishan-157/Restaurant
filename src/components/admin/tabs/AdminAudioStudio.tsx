import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Upload,
  Mic,
  Square,
  Play,
  Trash2,
  CheckCircle2,
  Sparkles,
  Music,
  Sliders,
  Plus,
  Radio,
  Save,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../../data/defaultRestaurantData';
import { AudioSettings, AudioTrackItem } from '../../../types';
import {
  resolvePlayableAudioUrl,
  VOICE_PERSONA_PRESETS,
  VOICE_SCRIPT_TEMPLATES,
  normalizeSpeechTextForClarity,
  splitIntoSpeechSentences,
  selectBestSpeechVoice,
} from '../../../utils/pleasantAudioGenerator';

interface AdminAudioStudioProps {
  showToast?: (msg: string) => void;
}

export const AdminAudioStudio: React.FC<AdminAudioStudioProps> = ({ showToast }) => {
  const { data, updateAudioSettings } = useRestaurant();

  const [draft, setDraft] = useState<AudioSettings>(() =>
    JSON.parse(
      JSON.stringify(data.audioSettings || DEFAULT_RESTAURANT_DATA.audioSettings!)
    )
  );
  const [isDirty, setIsDirty] = useState(false);

  // Admin Preview Player State
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAbortTokenRef = useRef<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Upload & New Track Form State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackSubtitle, setNewTrackSubtitle] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');

  // Live Microphone Voice Recorder State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedDataUrl, setRecordedDataUrl] = useState<string | null>(null);
  const [recordedTitle, setRecordedTitle] = useState('Manager Welcome Voice');

  useEffect(() => {
    if (!isDirty && data.audioSettings) {
      setDraft(JSON.parse(JSON.stringify(data.audioSettings)));
    }
  }, [data.audioSettings, isDirty]);

  // Load browser SpeechSynthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      try {
        const list = window.speechSynthesis.getVoices() || [];
        setAvailableVoices(list);
      } catch {
        // ignore
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const updateField = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSaveAll = (customDraft?: AudioSettings) => {
    const toSave = customDraft || draft;
    updateAudioSettings(toSave);
    setIsDirty(false);
    if (showToast) {
      showToast('Website Audio & Voice settings saved and live!');
    }
  };

  // --- 1. Handle Direct Audio File Upload (.mp3, .wav, .ogg, .m4a) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|webm)$/i)) {
      setUploadError('Please select a valid audio file (.mp3, .wav, .ogg, .m4a).');
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      setUploadError(
        'Audio file is larger than 4.5 MB. Please upload a shorter/compressed MP3 (under 4.5 MB) or paste a direct audio link.'
      );
      return;
    }

    setUploadStatus('Reading & encoding audio file...');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const trackId = `upload-${Date.now()}`;

      const newTrack: AudioTrackItem = {
        id: trackId,
        title: newTrackTitle.trim() || cleanName,
        subtitle: newTrackSubtitle.trim() || `Uploaded Audio (${(file.size / 1024).toFixed(0)} KB)`,
        audioUrl: dataUrl,
        durationLabel: 'Uploaded',
        category: 'welcome_voice',
        isActive: true,
      };

      const nextTracks = [
        newTrack,
        ...(draft.tracks || []).map(t => ({ ...t, isActive: false })),
      ];

      const nextDraft: AudioSettings = {
        ...draft,
        activeAudioUrl: dataUrl,
        activeTrackTitle: newTrack.title,
        activeTrackSubtitle: newTrack.subtitle || '',
        tracks: nextTracks,
      };

      setDraft(nextDraft);
      handleSaveAll(nextDraft);
      setNewTrackTitle('');
      setNewTrackSubtitle('');
      setUploadStatus(`✅ "${newTrack.title}" uploaded & set as active Website Audio!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setUploadError('Failed to read audio file. Please try again.');
      setUploadStatus(null);
    };
    reader.readAsDataURL(file);
  };

  // --- 2. Handle Direct Audio URL Add ---
  const handleAddUrlTrack = () => {
    if (!newTrackUrl.trim()) return;
    const newTrack: AudioTrackItem = {
      id: `url-${Date.now()}`,
      title: newTrackTitle.trim() || 'Custom Audio Track',
      subtitle: newTrackSubtitle.trim() || 'External Audio URL',
      audioUrl: newTrackUrl.trim(),
      durationLabel: 'Audio Link',
      category: 'promo_offer',
      isActive: true,
    };

    const nextTracks = [
      newTrack,
      ...(draft.tracks || []).map(t => ({ ...t, isActive: false })),
    ];

    const nextDraft: AudioSettings = {
      ...draft,
      activeAudioUrl: newTrack.audioUrl,
      activeTrackTitle: newTrack.title,
      activeTrackSubtitle: newTrack.subtitle || '',
      tracks: nextTracks,
    };

    setDraft(nextDraft);
    handleSaveAll(nextDraft);
    setNewTrackTitle('');
    setNewTrackSubtitle('');
    setNewTrackUrl('');
  };

  // --- 3. Live Microphone Voice Recording in Admin ---
  const startMicRecording = async () => {
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);
      setRecordedDataUrl(null);
      setIsRecording(true);
      recorder.start();
    } catch {
      setUploadError(
        'Microphone permission denied or unavailable. Please allow microphone access in your browser.'
      );
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecordedVoiceAsActive = () => {
    if (!recordedDataUrl) return;
    const newTrack: AudioTrackItem = {
      id: `mic-${Date.now()}`,
      title: recordedTitle.trim() || 'Recorded Welcome Voice',
      subtitle: `Recorded in Admin (${recordingSeconds}s)`,
      audioUrl: recordedDataUrl,
      durationLabel: `${recordingSeconds}s`,
      category: 'welcome_voice',
      isActive: true,
    };

    const nextTracks = [
      newTrack,
      ...(draft.tracks || []).map(t => ({ ...t, isActive: false })),
    ];

    const nextDraft: AudioSettings = {
      ...draft,
      activeAudioUrl: recordedDataUrl,
      activeTrackTitle: newTrack.title,
      activeTrackSubtitle: newTrack.subtitle || '',
      tracks: nextTracks,
    };

    setDraft(nextDraft);
    handleSaveAll(nextDraft);
    setRecordedDataUrl(null);
  };

  // --- 4. Select or Delete Track from Playlist ---
  const handleSelectTrack = (track: AudioTrackItem) => {
    const nextTracks = (draft.tracks || []).map(t => ({
      ...t,
      isActive: t.id === track.id,
    }));
    const nextDraft: AudioSettings = {
      ...draft,
      activeAudioUrl: track.audioUrl,
      activeTrackTitle: track.title,
      activeTrackSubtitle: track.subtitle || '',
      tracks: nextTracks,
    };
    setDraft(nextDraft);
    handleSaveAll(nextDraft);
  };

  const handleDeleteTrack = (id: string) => {
    const nextTracks = (draft.tracks || []).filter(t => t.id !== id);
    const nextDraft: AudioSettings = {
      ...draft,
      tracks: nextTracks,
    };
    setDraft(nextDraft);
    handleSaveAll(nextDraft);
  };

  // --- 5. Stop Preview / Speak Specific Language or Full Preview in Admin ---
  const stopAdminPreview = () => {
    previewAbortTokenRef.current += 1;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPreviewPlaying(false);
  };

  const speakAdminPreviewVoice = (
    langOverride?: 'hi-IN' | 'gu-IN' | 'en-IN',
    customDraft?: AudioSettings,
    voiceOnly = false
  ) => {
    const cfg = customDraft || draft;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const token = ++previewAbortTokenRef.current;
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const targetLang = langOverride || cfg.voiceLanguage || 'hi-IN';
    const rawText =
      targetLang === 'hi-IN'
        ? cfg.voiceTextHi
        : targetLang === 'gu-IN'
        ? cfg.voiceTextGu
        : cfg.voiceTextEn;

    if (!rawText || !rawText.trim()) return;

    const cleanText = normalizeSpeechTextForClarity(rawText, targetLang, true);
    const sentences = splitIntoSpeechSentences(cleanText);
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

    const matchedVoice = selectBestSpeechVoice(
      voices,
      targetLang,
      effectiveGender,
      cfg.selectedVoiceURI || availableVoices[0]?.voiceURI
    );

    const speakIndex = (idx: number) => {
      if (previewAbortTokenRef.current !== token) return;
      if (idx >= sentences.length) {
        if (voiceOnly || cfg.sourceMode === 'voice_tts') {
          setIsPreviewPlaying(false);
        } else if (previewAudioRef.current) {
          previewAudioRef.current.volume = Math.max(0.22, (cfg.volume ?? 0.85) * 0.55);
        }
        return;
      }

      const u = new SpeechSynthesisUtterance(sentences[idx]);
      u.lang = targetLang;
      u.rate = Math.min(1.25, Math.max(0.75, effectiveRate));
      u.pitch = Math.min(1.25, Math.max(0.75, effectivePitch));
      u.volume = cfg.volume ?? 0.85;
      if (matchedVoice) u.voice = matchedVoice;

      u.onend = () => {
        if (previewAbortTokenRef.current !== token) return;
        if (idx + 1 < sentences.length) {
          setTimeout(() => speakIndex(idx + 1), 130);
        } else {
          speakIndex(idx + 1);
        }
      };
      u.onerror = () => {
        if (previewAbortTokenRef.current !== token) return;
        setIsPreviewPlaying(false);
      };

      setIsPreviewPlaying(true);
      window.speechSynthesis.speak(u);
    };

    speakIndex(0);
  };

  const handleTestAudioPreview = () => {
    const speechActive =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.speaking;

    if (isPreviewPlaying || speechActive) {
      stopAdminPreview();
      return;
    }

    if (draft.sourceMode === 'voice_tts' || draft.sourceMode === 'both') {
      speakAdminPreviewVoice(draft.voiceLanguage, draft, false);
    }

    if (draft.sourceMode === 'file_or_url' || draft.sourceMode === 'both') {
      if (previewAudioRef.current) {
        previewAudioRef.current.src = resolvePlayableAudioUrl(draft.activeAudioUrl);
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.volume =
          draft.sourceMode === 'both'
            ? Math.min(draft.volume ?? 0.85, 0.16)
            : draft.volume ?? 0.85;
        previewAudioRef.current
          .play()
          .then(() => setIsPreviewPlaying(true))
          .catch(() => {});
      }
    }
  };

  // --- 6. Auto-Generate Fresh Script from Live Restaurant Data ---
  const handleAutoGenerateFromLiveData = () => {
    const restName = data.profile.name || 'Sarab Fast Food & Dining';
    const activeOffer = data.offers?.find(o => o.isActive) || data.offers?.[0];
    const bestsellers = (data.items || [])
      .filter(i => i.isBestseller && i.stockStatus === 'available')
      .slice(0, 2)
      .map(i => i.name);

    const dishMentionEn =
      bestsellers.length > 0 ? bestsellers.join(' and ') : 'our signature Burgers and Pizzas';
    const offerTextHi = activeOffer
      ? `आज कूपन कोड ${activeOffer.code} के साथ ${activeOffer.discountBadge} का विशेष लाभ उठाएं।`
      : 'आज हमारे स्पेशल कॉम्बो और बेस्टसेलर पकवानों पर शानदार ऑफर्स उपलब्ध हैं।';
    const offerTextGu = activeOffer
      ? `આજે કૂપન કોડ ${activeOffer.code} સાથે ${activeOffer.discountBadge} નો ખાસ લાભ લો.`
      : 'આજે અમારા સ્પેશિયલ કોમ્બો અને બેસ્ટસેલર વાનગીઓ પર શાનદાર ઓફર્સ ઉપલબ્ધ છે.';
    const offerTextEn = activeOffer
      ? `Use promo code ${activeOffer.code} today to enjoy ${activeOffer.discountBadge}!`
      : 'Enjoy special discounts on our freshly prepared combo meals today!';

    const nextDraft: AudioSettings = {
      ...draft,
      voiceTextHi: `नमस्ते! ${restName} में आपका हार्दिक स्वागत है। हमारे ताज़ा ${dishMentionEn} अभी गरमा-गरम तैयार हो रहे हैं। ${offerTextHi} आप नीचे मेन्यू या चैटबॉट से तुरंत ऑर्डर कर सकते हैं!`,
      voiceTextGu: `નમસ્તે! ${restName} માં આપનું હાર્દિક સ્વાગત છે. અમારા તાજા ${dishMentionEn} અત્યારે ગરમાગરમ બની રહ્યા છે। ${offerTextGu} આપ વેબસાઇટ અથવા ચેટબોટ પરથી તરત ઓર્ડર કરી શકો છો!`,
      voiceTextEn: `Welcome to ${restName}! Craving ${dishMentionEn}? Everything is prepared fresh to order. ${offerTextEn} Browse our menu below or order directly in our smart chatbot!`,
      ctaButtonText: activeOffer
        ? `🔥 Apply ${activeOffer.code} (${activeOffer.discountBadge})`
        : '🔥 Grab Special Offer',
    };

    setDraft(nextDraft);
    setIsDirty(true);
    if (showToast) {
      showToast('✨ Fresh Hindi, Gujarati & English scripts generated from live restaurant data!');
    }
  };

  const playablePreviewSrc = resolvePlayableAudioUrl(draft.activeAudioUrl);

  return (
    <div className="space-y-6">
      {/* Hidden Preview Audio Element */}
      <audio
        ref={previewAudioRef}
        src={playablePreviewSrc || undefined}
        onEnded={() => setIsPreviewPlaying(false)}
        onPause={() => setIsPreviewPlaying(false)}
      />

      {/* Top Sticky Master Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8281a] text-white flex items-center justify-center shrink-0 shadow-md">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-xl font-black text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Website Welcome Audio & Voice Studio
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  draft.enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {draft.enabled ? '● LIVE ON WEBSITE' : '○ DISABLED'}
              </span>
            </div>
            <p className="text-xs text-[#7a6e65] mt-0.5">
              Select announcement language (Hindi, Gujarati, or English), customize voice tone, or upload your own MP3 audio.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTestAudioPreview}
            className="px-4 py-2.5 rounded-xl bg-[#fff8f0] hover:bg-[#f3e9dc] text-[#1a1a1a] border border-[#e0d6c8] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            {isPreviewPlaying ? (
              <Square className="w-3.5 h-3.5 text-[#e8281a] fill-current" />
            ) : (
              <Play className="w-4 h-4 text-[#e8281a]" />
            )}
            <span>{isPreviewPlaying ? 'Stop Test' : 'Test Audio Now'}</span>
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
              ? 'Audio Enabled (Click to Turn Off)'
              : 'Audio Disabled (Click to Turn On)'}
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

      {/* Section 1: Audio Mode Selector */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-4">
        <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#e8281a]" />
          <span>1. Choose What Plays When a Customer Opens the Website</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[
            {
              id: 'file_or_url' as const,
              title: '🎵 Uploaded Audio File / MP3 Only',
              desc: 'Plays your uploaded MP3 song, jingle, or recorded voice audio file.',
            },
            {
              id: 'voice_tts' as const,
              title: '🗣️ Auto-Voice Announcement Only',
              desc: 'Clearly speaks your selected Hindi, Gujarati, or English welcome message.',
            },
            {
              id: 'both' as const,
              title: '✨ Both (Soft Music + Clear Voice)',
              desc: 'Plays soft background music while speaking your welcome announcement!',
            },
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateField('sourceMode', opt.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                draft.sourceMode === opt.id
                  ? 'border-[#e8281a] bg-[#fff8f0]'
                  : 'border-[#e0d6c8] bg-white hover:border-[#e8281a]/40'
              }`}
            >
              <div className="font-bold text-sm text-[#1a1a1a] mb-1">{opt.title}</div>
              <p className="text-xs text-[#7a6e65] leading-relaxed">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Restaurant Owner Voice Announcement Studio */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#e0d6c8] pb-4">
          <div>
            <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e8281a]" />
              <span>2. Auto-Voice Announcement Language & Tone (Selected by Restaurant Owner)</span>
            </h3>
            <p className="text-xs text-[#7a6e65] mt-0.5">
              Select which language (`Hindi`, `Gujarati`, or `English`) will play for customers on the website.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoGenerateFromLiveData}
              className="px-3.5 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#e8281a] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#f6a623]" />
              <span>Auto-Write from Live Menu & Offers</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isPreviewPlaying) {
                  stopAdminPreview();
                } else {
                  speakAdminPreviewVoice(draft.voiceLanguage, draft, true);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-[#e8281a] hover:bg-[#c01e12] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isPreviewPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Voice</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Selected Voice</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Owner Language Selection + Voice Tone + Speed/Pitch */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8]">
          {/* 1. Owner Announcement Language */}
          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] mb-2">
              Select Website Announcement Language:
            </label>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  { code: 'hi-IN', label: '🇮🇳 Hindi Announcement (हिंदी)' },
                  { code: 'gu-IN', label: '🇮🇳 Gujarati Announcement (ગુજરાતી)' },
                  { code: 'en-IN', label: '🇬🇧 English Announcement' },
                ] as const
              ).map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    const next = { ...draft, voiceLanguage: l.code };
                    setDraft(next);
                    handleSaveAll(next);
                    speakAdminPreviewVoice(l.code, next, true);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                    draft.voiceLanguage === l.code
                      ? 'bg-[#e8281a] text-white shadow-xs'
                      : 'bg-white text-[#5a524c] border border-[#e0d6c8] hover:border-[#e8281a]/50'
                  }`}
                >
                  <span>{l.label}</span>
                  {draft.voiceLanguage === l.code && (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                      ● Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Voice Style / Tone Preset */}
          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] mb-2">
              Select Voice Style / Tone:
            </label>
            <div className="flex flex-col gap-1.5">
              {VOICE_PERSONA_PRESETS.slice(0, 4).map(persona => {
                const isSelected = (draft.voicePersona || 'warm_hostess') === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => {
                      const next: AudioSettings = {
                        ...draft,
                        voicePersona: persona.id,
                        voiceGender: persona.gender,
                        voiceRate: persona.rate,
                        voicePitch: persona.pitch,
                      };
                      setDraft(next);
                      setIsDirty(true);
                      speakAdminPreviewVoice(next.voiceLanguage, next, true);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1a1a1a] text-white'
                        : 'bg-white text-[#5a524c] border border-[#e0d6c8]'
                    }`}
                  >
                    <span>{persona.title}</span>
                    <span className="text-[10px] opacity-75">{persona.rate}x</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Voice Speed & Pitch Sliders */}
          <div className="flex flex-col justify-between">
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
              <div className="flex justify-between text-[10px] text-[#7a6e65] mb-3">
                <span>Slow & Clear</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1a1a] mb-1">
                Voice Pitch / Clear Tone: {(draft.voicePitch ?? 1.04).toFixed(2)}
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
          </div>
        </div>

        {/* 1-Click Ready-to-Use Restaurant Announcement Templates */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#1a1a1a]">
            ⚡ Ready-Made Announcement Templates (Click any template to fill scripts):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {VOICE_SCRIPT_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  const next: AudioSettings = {
                    ...draft,
                    voiceTextHi: tpl.hi,
                    voiceTextGu: tpl.gu,
                    voiceTextEn: tpl.en,
                    ctaButtonText: tpl.suggestedCtaText,
                    ctaTargetSection: tpl.suggestedCtaTarget,
                  };
                  setDraft(next);
                  setIsDirty(true);
                  speakAdminPreviewVoice(next.voiceLanguage, next, true);
                }}
                className="p-3 rounded-2xl border border-[#e0d6c8] bg-[#fff8f0]/60 hover:bg-[#fff8f0] hover:border-[#e8281a] text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-xs text-[#1a1a1a] group-hover:text-[#e8281a] transition-colors mb-1">
                  {tpl.title}
                </div>
                <p className="text-[11px] text-[#7a6e65] line-clamp-2">{tpl.hi}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Language Voice Scripts with Individual 1-Click Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1a1a1a]">
                🇮🇳 Hindi Script {draft.voiceLanguage === 'hi-IN' && '(Active)'}
              </label>
              <button
                type="button"
                onClick={() => speakAdminPreviewVoice('hi-IN', draft, true)}
                className="px-2.5 py-1 rounded-lg bg-[#e8281a]/10 hover:bg-[#e8281a] text-[#e8281a] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Listen Hindi</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={draft.voiceTextHi}
              onChange={e => updateField('voiceTextHi', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a] leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1a1a1a]">
                🇮🇳 Gujarati Script {draft.voiceLanguage === 'gu-IN' && '(Active)'}
              </label>
              <button
                type="button"
                onClick={() => speakAdminPreviewVoice('gu-IN', draft, true)}
                className="px-2.5 py-1 rounded-lg bg-[#e8281a]/10 hover:bg-[#e8281a] text-[#e8281a] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Listen Gujarati</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={draft.voiceTextGu}
              onChange={e => updateField('voiceTextGu', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a] leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1a1a1a]">
                🇬🇧 English Script {draft.voiceLanguage === 'en-IN' && '(Active)'}
              </label>
              <button
                type="button"
                onClick={() => speakAdminPreviewVoice('en-IN', draft, true)}
                className="px-2.5 py-1 rounded-lg bg-[#e8281a]/10 hover:bg-[#e8281a] text-[#e8281a] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Listen English</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={draft.voiceTextEn}
              onChange={e => updateField('voiceTextEn', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a] leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Upload Audio File / Record Microphone Voice / Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload MP3 File or Record Live Voice */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#e8281a]" />
              <span>3. Upload Custom Audio File or Record Your Voice</span>
            </h3>
            <p className="text-xs text-[#7a6e65] mt-0.5">
              Upload any MP3/WAV/OGG from your phone or computer, or record directly using your microphone.
            </p>
          </div>

          {/* Track Title & Subtitle Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Audio Title (Optional)
              </label>
              <input
                type="text"
                value={newTrackTitle}
                onChange={e => setNewTrackTitle(e.target.value)}
                placeholder="e.g., Diwali Special Offer Audio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5a524c] mb-1">
                Subtitle / Offer Note
              </label>
              <input
                type="text"
                value={newTrackSubtitle}
                onChange={e => setNewTrackSubtitle(e.target.value)}
                placeholder="e.g., Flat 30% Off on Combos"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
            </div>
          </div>

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-[#e8281a]/40 rounded-2xl p-5 text-center bg-[#fff8f0]/60 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm"
              onChange={handleFileUpload}
              className="hidden"
              id="admin-audio-upload-input"
            />
            <div className="w-11 h-11 rounded-2xl bg-[#e8281a]/10 text-[#e8281a] flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <label
                htmlFor="admin-audio-upload-input"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8281a] hover:bg-[#c01e12] text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Audio File (.MP3 / .WAV / .M4A)</span>
              </label>
              <p className="text-[11px] text-[#7a6e65] mt-2">
                Supports MP3, WAV, M4A, OGG (up to 4.5 MB)
              </p>
            </div>
          </div>

          {uploadStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Live Microphone Recorder Box */}
          <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#e0d6c8] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#e8281a]" />
                <span className="font-bold text-xs text-[#1a1a1a]">
                  Or Record Your Own Voice Directly (Mic Recorder)
                </span>
              </div>
              {isRecording && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                  ● REC {recordingSeconds}s
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startMicRecording}
                  className="px-4 py-2 rounded-xl bg-[#1a1a1a] hover:bg-[#e8281a] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Voice Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopMicRecording}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Recording ({recordingSeconds}s)</span>
                </button>
              )}

              {recordedDataUrl && (
                <div className="w-full pt-2 space-y-2 border-t border-[#e0d6c8]">
                  <audio src={recordedDataUrl} controls className="w-full h-9" />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={recordedTitle}
                      onChange={e => setRecordedTitle(e.target.value)}
                      placeholder="Recording Title"
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#e0d6c8] text-xs"
                    />
                    <button
                      type="button"
                      onClick={saveRecordedVoiceAsActive}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Use This Recording Live
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Or Paste Direct Audio Link */}
          <div className="pt-2 border-t border-[#e0d6c8] space-y-2">
            <label className="block text-xs font-semibold text-[#5a524c]">
              Or Paste Direct Audio MP3 URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newTrackUrl}
                onChange={e => setNewTrackUrl(e.target.value)}
                placeholder="https://example.com/welcome-audio.mp3"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
              />
              <button
                type="button"
                onClick={handleAddUrlTrack}
                className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#e8281a] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add URL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Audio Track & Saved Playlist */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
                <Music className="w-4 h-4 text-[#e8281a]" />
                <span>Saved Audio Tracks & Built-in Ambience ({draft.tracks?.length || 0})</span>
              </h3>
              <p className="text-xs text-[#7a6e65] mt-0.5">
                Click &ldquo;Set Active&rdquo; on any uploaded file or built-in instrumental track.
              </p>
            </div>

            {/* Currently Active Audio Preview Box */}
            <div className="p-4 rounded-2xl bg-[#1a1a1a] text-white space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f6a623]">
                  Currently Selected Background / Audio Track
                </span>
                <span className="text-[11px] text-white/60">
                  Volume: {Math.round((draft.volume ?? 0.85) * 100)}%
                </span>
              </div>
              <div className="font-bold text-sm truncate">
                {draft.activeTrackTitle || 'Default Track'}
              </div>
              <audio
                src={playablePreviewSrc || undefined}
                controls
                className="w-full h-9 rounded-lg"
              />
            </div>

            {/* Track List */}
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {(draft.tracks || []).map(track => {
                const isCurrent = draft.activeAudioUrl === track.audioUrl;
                return (
                  <div
                    key={track.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isCurrent
                        ? 'bg-[#fff8f0] border-[#e8281a]'
                        : 'bg-white border-[#e0d6c8] hover:bg-[#fff8f0]/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#1a1a1a] truncate">
                          {track.title}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-[#e8281a] text-white text-[10px] font-bold shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7a6e65] truncate mt-0.5">
                        {track.subtitle || track.durationLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleSelectTrack(track)}
                          className="px-3 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#e8281a] text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(track.id)}
                        className="p-2 rounded-xl text-[#7a6e65] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Essential Visitor Player Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-5">
        <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#e8281a]" />
          <span>4. Visitor Audio Card Text & Essential Playback Settings</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Welcome Card Title
            </label>
            <input
              type="text"
              value={draft.welcomeTitle}
              onChange={e => updateField('welcomeTitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Welcome Card Subtitle
            </label>
            <input
              type="text"
              value={draft.welcomeSubtitle}
              onChange={e => updateField('welcomeSubtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Play Button Label
            </label>
            <input
              type="text"
              value={draft.listenButtonText}
              onChange={e => updateField('listenButtonText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Skip Button Label
            </label>
            <input
              type="text"
              value={draft.skipButtonText}
              onChange={e => updateField('skipButtonText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              How Often Should It Play?
            </label>
            <select
              value={draft.playFrequency}
              onChange={e =>
                updateField('playFrequency', e.target.value as AudioSettings['playFrequency'])
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            >
              <option value="every_visit">Every Time Website Opens</option>
              <option value="once_per_session">Once Per Browser Session</option>
              <option value="once_per_day">Once Per Day Per Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Player Display Style
            </label>
            <select
              value={draft.playerStyle}
              onChange={e =>
                updateField('playerStyle', e.target.value as AudioSettings['playerStyle'])
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            >
              <option value="welcome_card_and_mini">Welcome Card + Floating Mini Pill</option>
              <option value="floating_pill_only">Compact Floating Pill Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Audio & Voice Volume ({Math.round((draft.volume ?? 0.85) * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={draft.volume ?? 0.85}
              onChange={e => updateField('volume', parseFloat(e.target.value))}
              className="w-full accent-[#e8281a] mt-2"
            />
          </div>
        </div>

        {/* Essential Checkboxes Only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {[
            {
              key: 'autoPlayOnLoad' as const,
              label: 'Auto-Play When Website Opens',
              defaultVal: true,
            },
            {
              key: 'unlockOnFirstTap' as const,
              label: 'Start Audio on First Screen Tap (Mobile Fix)',
              defaultVal: true,
            },
            {
              key: 'showSkipButton' as const,
              label: 'Show "Skip" Button to Visitors',
              defaultVal: true,
            },
            {
              key: 'enableCtaButton' as const,
              label: 'Show Offer Button Inside Audio Card',
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
      </div>
    </div>
  );
};
