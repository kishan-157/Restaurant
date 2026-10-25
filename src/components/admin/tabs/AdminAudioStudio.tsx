import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Upload,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  Sparkles,
  Music,
  Sliders,
  Plus,
  Radio,
  SkipForward,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../../data/defaultRestaurantData';
import { AudioSettings, AudioTrackItem } from '../../../types';
import { playWebAudioChime } from '../../common/WebsiteAudioPlayer';
import { resolvePlayableAudioUrl } from '../../../utils/pleasantAudioGenerator';

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
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

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

    // Warn if file is larger than 4.5MB (to keep browser LocalStorage + Supabase JSON fast)
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

  // --- 5. Admin Test / Preview Playback ---
  const handleTestAudioPreview = () => {
    const speechActive =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.speaking;

    if (isPreviewPlaying || speechActive) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPreviewPlaying(false);
      return;
    }

    if (draft.enableWelcomeChime) {
      playWebAudioChime('welcome', draft.volume);
    }

    if (draft.sourceMode === 'voice_tts' || draft.sourceMode === 'both') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const text =
          draft.voiceLanguage === 'hi-IN'
            ? draft.voiceTextHi
            : draft.voiceLanguage === 'gu-IN'
            ? draft.voiceTextGu
            : draft.voiceTextEn;
        if (text && text.trim()) {
          const u = new SpeechSynthesisUtterance(text.trim());
          u.lang = draft.voiceLanguage;
          u.rate = draft.voiceRate || 1.0;
          u.pitch = draft.voicePitch || 1.0;
          u.volume = draft.volume ?? 0.85;
          u.onend = () => {
            if (draft.sourceMode === 'voice_tts') setIsPreviewPlaying(false);
          };
          setIsPreviewPlaying(true);
          window.speechSynthesis.speak(u);
        }
      }
    }

    if (draft.sourceMode === 'file_or_url' || draft.sourceMode === 'both') {
      if (previewAudioRef.current) {
        previewAudioRef.current.src = resolvePlayableAudioUrl(draft.activeAudioUrl);
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.volume =
          draft.sourceMode === 'both'
            ? Math.max(0.18, (draft.volume ?? 0.85) * 0.45)
            : draft.volume ?? 0.85;
        previewAudioRef.current
          .play()
          .then(() => setIsPreviewPlaying(true))
          .catch(() => {});
      }
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
              Upload MP3 files, record your own voice, or set automatic Hindi/Gujarati/English voice announcements with a visitor Skip & Listen card.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTestAudioPreview}
            className="px-4 py-2.5 rounded-xl bg-[#fff8f0] hover:bg-[#f3e9dc] text-[#1a1a1a] border border-[#e0d6c8] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            {isPreviewPlaying ? <Pause className="w-4 h-4 text-[#e8281a]" /> : <Play className="w-4 h-4 text-[#e8281a]" />}
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
            {draft.enabled ? 'Audio Enabled (Click to Turn Off)' : 'Audio Disabled (Click to Turn On)'}
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

      {/* Section 1: Audio Mode Selector (MP3 Upload vs Smart Voice TTS vs Both) */}
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
              title: '🗣️ Smart Voice Announcer Only',
              desc: 'Automatically speaks your written Hindi, Gujarati, or English welcome message.',
            },
            {
              id: 'both' as const,
              title: '✨ Both (Background Music + Voice)',
              desc: 'Plays soft background music while speaking your welcome offer announcement!',
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

      {/* Section 2: Upload Audio File / Record Microphone Voice / Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload MP3 File or Record Live Voice */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#e8281a]" />
              <span>2. Upload Audio File or Record Your Voice</span>
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
                Supports MP3, WAV, M4A, OGG (up to 4.5 MB for instant cloud & mobile loading)
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
                <span>Saved Audio Tracks & Playlist ({draft.tracks?.length || 0})</span>
              </h3>
              <p className="text-xs text-[#7a6e65] mt-0.5">
                Click &ldquo;Set Active&rdquo; on any uploaded file or preset track to play it on your website.
              </p>
            </div>

            {/* Currently Active Audio Preview Box */}
            <div className="p-4 rounded-2xl bg-[#1a1a1a] text-white space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f6a623]">
                  Currently Selected Website Audio
                </span>
                <span className="text-[11px] text-white/60">Volume: {Math.round((draft.volume ?? 0.85) * 100)}%</span>
              </div>
              <div className="font-bold text-sm truncate">{draft.activeTrackTitle || 'Default Track'}</div>
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

      {/* Section 3: Smart Multi-Language Voice Announcer (Hindi / Gujarati / English TTS) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f6a623]" />
              <span>3. Smart Auto-Voice Announcement (Hindi / Gujarati / English)</span>
            </h3>
            <p className="text-xs text-[#7a6e65] mt-0.5">
              Type any welcome message or daily offer below — the website will automatically speak it aloud to your visitors!
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['hi-IN', 'gu-IN', 'en-IN'] as const).map(langCode => (
              <button
                key={langCode}
                type="button"
                onClick={() => updateField('voiceLanguage', langCode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  draft.voiceLanguage === langCode
                    ? 'bg-[#e8281a] text-white shadow-xs'
                    : 'bg-[#fff8f0] text-[#5a524c] border border-[#e0d6c8]'
                }`}
              >
                {langCode === 'hi-IN' ? '🇮🇳 Hindi Voice' : langCode === 'gu-IN' ? '🇮🇳 Gujarati Voice' : '🇬🇧 English Voice'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1.5">
              Hindi Welcome Script (हिंदी अनाउंसमेंट)
            </label>
            <textarea
              rows={3}
              value={draft.voiceTextHi}
              onChange={e => updateField('voiceTextHi', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1.5">
              Gujarati Welcome Script (ગુજરાતી અનાઉન્સમેન્ટ)
            </label>
            <textarea
              rows={3}
              value={draft.voiceTextGu}
              onChange={e => updateField('voiceTextGu', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1.5">
              English Welcome Script
            </label>
            <textarea
              rows={3}
              value={draft.voiceTextEn}
              onChange={e => updateField('voiceTextEn', e.target.value)}
              className="w-full p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Visitor Card, Skip Button, Offer CTA & Playback Rules */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e0d6c8] shadow-xs space-y-5">
        <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#e8281a]" />
          <span>4. Visitor Skip Button, Welcome Card Text & Playback Controls</span>
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
              Listen / Play Button Label
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
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
              Audio Volume ({Math.round((draft.volume ?? 0.85) * 100)}%)
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

          <div>
            <label className="block text-xs font-semibold text-[#5a524c] mb-1">
              Offer Action Button Text
            </label>
            <input
              type="text"
              value={draft.ctaButtonText}
              onChange={e => updateField('ctaButtonText', e.target.value)}
              placeholder="🔥 Grab 30% Off Combo"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs text-[#1a1a1a]"
            />
          </div>
        </div>

        {/* Checkboxes Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {[
            {
              key: 'autoPlayOnLoad' as const,
              label: 'Auto-Play When Website Opens',
            },
            {
              key: 'unlockOnFirstTap' as const,
              label: 'Start Audio on First Screen Tap (Mobile Autoplay Fix)',
            },
            {
              key: 'showSkipButton' as const,
              label: 'Show "Skip Audio" Button to Visitors',
            },
            {
              key: 'loopAudio' as const,
              label: 'Loop Audio Continuously',
            },
            {
              key: 'enableWelcomeChime' as const,
              label: 'Play Royal Welcome Chime Before Audio',
            },
            {
              key: 'enableCtaButton' as const,
              label: 'Show Offer CTA Button Inside Audio Card',
            },
          ].map(item => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[#fff8f0] border border-[#e0d6c8] text-xs font-semibold text-[#1a1a1a] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(draft[item.key])}
                onChange={e => updateField(item.key, e.target.checked)}
                className="w-4 h-4 accent-[#e8281a] rounded"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
