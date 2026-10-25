import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  X,
  Sparkles,
  Music,
  Mic,
  RotateCcw,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DEFAULT_RESTAURANT_DATA } from '../../data/defaultRestaurantData';
import {
  resolvePlayableAudioUrl,
  getBuiltinTrackWavUrl,
} from '../../utils/pleasantAudioGenerator';

const SESSION_PLAYED_KEY = 'sarab_welcome_audio_played_session_v1';
const DAILY_PLAYED_KEY = 'sarab_welcome_audio_played_day_v1';

// Shared AudioContext singleton so repeated Play clicks never hit browser max-AudioContext limits
let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Pleasant Web-Audio Royal Welcome Chime (Zero external asset dependency)
export function playWebAudioChime(
  type: 'welcome' | 'cart' | 'order' = 'welcome',
  volume = 0.5
) {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const notes =
      type === 'welcome'
        ? [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
        : type === 'order'
        ? [587.33, 739.99, 880, 1174.66] // D5, F#5, A5, D6
        : [659.25, 880]; // E5, A5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);

      const maxGain = Math.min(0.35, Math.max(0.05, volume * 0.3));
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(maxGain, ctx.currentTime + idx * 0.11 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.11 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.11);
      osc.stop(ctx.currentTime + idx * 0.11 + 0.48);
    });
  } catch {
    // Ignore WebAudio restrictions
  }
}

export const WebsiteAudioPlayer: React.FC = () => {
  const { data } = useRestaurant();
  const settings = data.audioSettings || DEFAULT_RESTAURANT_DATA.audioSettings!;
  const primaryColor = data.profile.primaryColor || '#e8281a';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasAttemptedAutoRef = useRef(false);
  const isSkippedRef = useRef(false);
  const lastStartTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resolvedAudioSrc, setResolvedAudioSrc] = useState<string>(() =>
    resolvePlayableAudioUrl(settings.activeAudioUrl)
  );

  // Keep resolvedAudioSrc updated whenever admin changes activeAudioUrl
  useEffect(() => {
    setResolvedAudioSrc(resolvePlayableAudioUrl(settings.activeAudioUrl));
  }, [settings.activeAudioUrl]);

  // Preload browser TTS voices on mount so Hindi/Gujarati/English voices are ready on first click
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener?.('voiceschanged', handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener?.('voiceschanged', handleVoicesChanged);
      };
    } catch {
      // ignore
    }
  }, []);

  // Periodic watchdog to ensure isSpeaking / isPlaying never stay stuck if browser finishes silently
  useEffect(() => {
    if (!isSpeaking && !isPlaying) return;
    const interval = setInterval(() => {
      if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          setIsSpeaking(false);
        }
      }
      if (isPlaying && audioRef.current) {
        if (audioRef.current.paused || audioRef.current.ended) {
          setIsPlaying(false);
        }
      }
    }, 600);
    return () => clearInterval(interval);
  }, [isSpeaking, isPlaying]);

  // Determine if frequency rules allow automatic prompt/playback
  const shouldTriggerForVisitor = useCallback((): boolean => {
    if (!settings.enabled) return false;
    try {
      if (settings.playFrequency === 'once_per_session') {
        if (sessionStorage.getItem(SESSION_PLAYED_KEY) === 'true') return false;
      } else if (settings.playFrequency === 'once_per_day') {
        const lastDate = localStorage.getItem(DAILY_PLAYED_KEY);
        const today = new Date().toISOString().slice(0, 10);
        if (lastDate === today) return false;
      }
    } catch {
      // ignore storage errors
    }
    return true;
  }, [settings.enabled, settings.playFrequency]);

  const markVisitorPlayed = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_PLAYED_KEY, 'true');
      localStorage.setItem(DAILY_PLAYED_KEY, new Date().toISOString().slice(0, 10));
    } catch {
      // ignore
    }
  }, []);

  // Speak TTS announcement reliably across Android, iOS, and Desktop
  const speakVoiceAnnouncement = useCallback(
    (forceUnmute = false) => {
      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        (settings.sourceMode !== 'voice_tts' && settings.sourceMode !== 'both')
      ) {
        return false;
      }

      try {
        const script =
          settings.voiceLanguage === 'hi-IN'
            ? settings.voiceTextHi
            : settings.voiceLanguage === 'gu-IN'
            ? settings.voiceTextGu
            : settings.voiceTextEn;

        const fallbackScript =
          script?.trim() ||
          settings.voiceTextHi?.trim() ||
          settings.voiceTextEn?.trim() ||
          `Welcome to ${data.profile.name}!`;

        if (!fallbackScript) return false;

        // Cancel any previous speech and resume in case Chrome paused speechSynthesis
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(fallbackScript);
        utteranceRef.current = utterance; // Prevent browser GC bug mid-utterance

        utterance.lang = settings.voiceLanguage || 'hi-IN';
        utterance.rate = settings.voiceRate || 1.0;
        utterance.pitch = settings.voicePitch || 1.0;
        utterance.volume =
          isMuted && !forceUnmute ? 0 : Math.min(1, Math.max(0.15, settings.volume ?? 0.85));

        const voices = window.speechSynthesis.getVoices();
        const targetLang = (settings.voiceLanguage || 'hi-IN').toLowerCase();
        const langPrefix = targetLang.split('-')[0];
        const matchedVoice =
          voices.find(v => v.lang.toLowerCase() === targetLang) ||
          voices.find(v => v.lang.toLowerCase().replace('_', '-').includes(targetLang)) ||
          voices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) ||
          voices.find(v => v.lang.toLowerCase().includes('in'));

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          setNeedsUserGesture(false);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          if (settings.sourceMode === 'voice_tts' && settings.autoHideOnEnd) {
            setShowWelcomeCard(false);
            setIsMinimized(true);
          }
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
        };

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        return true;
      } catch {
        setIsSpeaking(false);
        return false;
      }
    },
    [
      settings.sourceMode,
      settings.voiceLanguage,
      settings.voiceTextHi,
      settings.voiceTextGu,
      settings.voiceTextEn,
      settings.voiceRate,
      settings.voicePitch,
      settings.volume,
      settings.autoHideOnEnd,
      data.profile.name,
      isMuted,
    ]
  );

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      try {
        audioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsPlaying(false);
    setIsSpeaking(false);
  }, []);

  // Main function to start or restart playing audio + voice
  const startPlayback = useCallback(
    async (isManualClick = false, restartFromBeginning = false) => {
      if (isSkippedRef.current && !isManualClick) return;

      if (isManualClick) {
        isSkippedRef.current = false;
        lastStartTimeRef.current = Date.now();
        if (isMuted) {
          setIsMuted(false);
          if (audioRef.current) audioRef.current.muted = false;
        }
      }

      if (settings.enableWelcomeChime) {
        playWebAudioChime('welcome', settings.volume ?? 0.8);
      }

      const wantsFileAudio =
        settings.sourceMode === 'file_or_url' || settings.sourceMode === 'both';

      const wantsVoice =
        settings.sourceMode === 'voice_tts' || settings.sourceMode === 'both';

      // IMPORTANT: Trigger speechSynthesis synchronously BEFORE awaiting network audio
      // so mobile browsers (iOS Safari / Android Chrome) preserve the user-gesture token!
      let voiceStarted = false;
      if (wantsVoice) {
        voiceStarted = speakVoiceAnnouncement(isManualClick);
      }

      if (wantsFileAudio && audioRef.current) {
        const audioEl = audioRef.current;
        try {
          const baseVol = Math.min(1, Math.max(0.05, settings.volume ?? 0.85));
          audioEl.muted = isManualClick ? false : isMuted;
          audioEl.volume =
            isMuted && !isManualClick
              ? 0
              : settings.sourceMode === 'both'
              ? Math.max(0.18, baseVol * 0.45)
              : baseVol;
          audioEl.loop = Boolean(settings.loopAudio);

          // Ensure a valid src is loaded
          const targetSrc = resolvePlayableAudioUrl(settings.activeAudioUrl);
          if (!audioEl.src || audioEl.src === window.location.href) {
            audioEl.src = targetSrc;
          }

          // If audio already ended or user requested a fresh replay, rewind to 0
          if (
            restartFromBeginning ||
            audioEl.ended ||
            (audioEl.duration > 0 && audioEl.currentTime >= audioEl.duration - 0.15)
          ) {
            audioEl.currentTime = 0;
          }

          await audioEl.play();
          setIsPlaying(true);
          setNeedsUserGesture(false);
          markVisitorPlayed();
        } catch (err) {
          // Check if it failed because of a broken external URL vs autoplay block
          const errName = err instanceof Error ? err.name : '';
          if (errName === 'NotAllowedError') {
            // Browser blocked automatic playback before user interaction
            if (!voiceStarted) {
              setNeedsUserGesture(true);
            }
          } else {
            // Broken/unsupported external URL -> fallback to built-in studio track immediately!
            try {
              const fallbackWav = getBuiltinTrackWavUrl('warm-bossa-lounge');
              if (fallbackWav && audioEl.src !== fallbackWav) {
                setResolvedAudioSrc(fallbackWav);
                audioEl.src = fallbackWav;
                audioEl.currentTime = 0;
                await audioEl.play();
                setIsPlaying(true);
                setNeedsUserGesture(false);
                markVisitorPlayed();
              }
            } catch {
              if (!voiceStarted) {
                setNeedsUserGesture(true);
              }
            }
          }
        }
      } else if (voiceStarted) {
        setNeedsUserGesture(false);
        markVisitorPlayed();
      }
    },
    [
      settings.enableWelcomeChime,
      settings.volume,
      settings.sourceMode,
      settings.activeAudioUrl,
      settings.loopAudio,
      isMuted,
      markVisitorPlayed,
      speakVoiceAnnouncement,
    ]
  );

  // Trigger on initial website load
  useEffect(() => {
    if (!settings.enabled) {
      stopAllAudio();
      setShowWelcomeCard(false);
      return;
    }

    if (hasAttemptedAutoRef.current) return;
    if (!shouldTriggerForVisitor()) {
      setIsMinimized(true);
      return;
    }

    const delayMs = Math.max(0, (settings.delaySeconds ?? 1) * 1000);
    const timer = setTimeout(() => {
      hasAttemptedAutoRef.current = true;
      if (settings.playerStyle === 'welcome_card_and_mini') {
        setShowWelcomeCard(true);
        setIsMinimized(false);
      } else {
        setShowWelcomeCard(false);
        setIsMinimized(true);
      }

      if (settings.autoPlayOnLoad) {
        startPlayback(false, true);
      } else {
        setNeedsUserGesture(true);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [
    settings.enabled,
    settings.delaySeconds,
    settings.playerStyle,
    settings.autoPlayOnLoad,
    shouldTriggerForVisitor,
    startPlayback,
    stopAllAudio,
  ]);

  // Unlock audio automatically on first visitor tap/click outside the audio controls
  useEffect(() => {
    if (!settings.enabled || !settings.unlockOnFirstTap || !needsUserGesture) return;

    const handleFirstInteraction = (e: Event) => {
      if (isSkippedRef.current) return;
      const target = e.target as HTMLElement | null;
      // Ignore taps inside the audio player buttons so we never race with their own onClick!
      if (
        target &&
        (target.closest('[data-audio-skip="true"]') ||
          target.closest('[data-audio-control="true"]'))
      ) {
        return;
      }
      startPlayback(true, true);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };
  }, [settings.enabled, settings.unlockOnFirstTap, needsUserGesture, startPlayback]);

  // Sync volume & mute changes dynamically
  useEffect(() => {
    if (audioRef.current) {
      const baseVol = Math.min(1, Math.max(0.05, settings.volume ?? 0.85));
      audioRef.current.volume = isMuted
        ? 0
        : settings.sourceMode === 'both'
        ? Math.max(0.18, baseVol * 0.45)
        : baseVol;
      audioRef.current.loop = Boolean(settings.loopAudio);
    }
  }, [settings.volume, settings.sourceMode, settings.loopAudio, isMuted]);

  const handleTogglePlayPause = () => {
    isSkippedRef.current = false;

    // Guard against immediate double-trigger if pointerdown just started playback <350ms ago
    if (Date.now() - lastStartTimeRef.current < 350) {
      return;
    }

    // Check actual live DOM/browser state so stale state never blocks Play!
    const audioActuallyPlaying = Boolean(
      audioRef.current && !audioRef.current.paused && !audioRef.current.ended
    );
    const speechActuallySpeaking = Boolean(
      typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.speaking
    );
    const currentlyActive =
      (isPlaying && audioActuallyPlaying) || (isSpeaking && speechActuallySpeaking);

    if (currentlyActive) {
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setIsSpeaking(false);
    } else {
      startPlayback(true, false);
    }
  };

  const handleReplayFromStart = () => {
    isSkippedRef.current = false;
    stopAllAudio();
    // Small micro-delay ensures clean reset when customer clicks Play/Replay repeatedly
    setTimeout(() => {
      startPlayback(true, true);
    }, 40);
  };

  const handleSkipAudio = () => {
    isSkippedRef.current = true;
    setNeedsUserGesture(false);
    stopAllAudio();
    markVisitorPlayed();
    setShowWelcomeCard(false);
    setIsMinimized(true);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
    if (nextMute && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || !Number.isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!settings.enabled) return null;

  const isAudioActive = isPlaying || isSpeaking;

  return (
    <>
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={resolvedAudioSrc || undefined}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onError={() => {
          // Automatic fallback to built-in studio WAV if an external URL fails to load
          const fallback = getBuiltinTrackWavUrl('warm-bossa-lounge');
          if (fallback && resolvedAudioSrc !== fallback) {
            setResolvedAudioSrc(fallback);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (settings.autoHideOnEnd) {
            setShowWelcomeCard(false);
            setIsMinimized(true);
          }
        }}
      />

      {/* 1. Welcome Audio Banner / Card (Mobile & Desktop Optimized) */}
      {showWelcomeCard && !isMinimized && (
        <div
          data-audio-control="true"
          className="fixed inset-x-3 bottom-20 sm:inset-x-auto sm:left-6 sm:bottom-22 z-40 sm:w-[390px] max-w-[calc(100vw-1.5rem)] animate-fadeIn"
        >
          <div className="bg-[#1a1a1a]/95 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-white/15 relative overflow-hidden">
            {/* Subtle Ambient Glow */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-25 pointer-events-none blur-2xl"
              style={{ backgroundColor: primaryColor }}
            />

            {/* Top Row: Badge + Minimize / Mute */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f6a623]/20 border border-[#f6a623]/40 text-[#f6a623] text-[10px] font-bold uppercase tracking-wider">
                {settings.sourceMode === 'voice_tts' ? (
                  <Mic className="w-3 h-3" />
                ) : (
                  <Music className="w-3 h-3" />
                )}
                <span>{settings.welcomeBadgeText || '🔊 Restaurant Welcome Audio'}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  data-audio-control="true"
                  onClick={handleReplayFromStart}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Replay Audio from Beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-audio-control="true"
                  onClick={handleToggleMute}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  data-audio-control="true"
                  onClick={() => {
                    setShowWelcomeCard(false);
                    setIsMinimized(true);
                  }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Minimize Player"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="flex items-start gap-3 mb-3">
              {/* Animated Equalizer Icon Circle */}
              <button
                type="button"
                data-audio-control="true"
                onClick={handleTogglePlayPause}
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
                aria-label={isAudioActive ? 'Pause Audio' : 'Play Audio'}
              >
                {isAudioActive ? (
                  <div className="flex items-end gap-0.5 h-4">
                    <span className="w-1 bg-white rounded-full animate-pulse h-4" />
                    <span className="w-1 bg-[#f6a623] rounded-full animate-bounce h-3" />
                    <span className="w-1 bg-white rounded-full animate-pulse h-2.5" />
                    <span className="w-1 bg-[#f6a623] rounded-full animate-bounce h-4" />
                  </div>
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <h4
                  className="font-bold text-sm sm:text-base text-white leading-snug truncate"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {settings.welcomeTitle || `Welcome to ${data.profile.name}!`}
                </h4>
                <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed line-clamp-2 mt-0.5">
                  {settings.welcomeSubtitle || settings.activeTrackSubtitle}
                </p>
              </div>
            </div>

            {/* Audio Progress Bar (When playing file/URL) */}
            {(settings.sourceMode === 'file_or_url' || settings.sourceMode === 'both') &&
              duration > 0 && (
                <div className="mb-3 space-y-1">
                  <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#e8281a] to-[#f6a623] transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((currentTime / duration) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span className="truncate max-w-[180px]">{settings.activeTrackTitle}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}

            {/* Action Buttons: Play/Listen + Replay + Skip Audio + Optional Offer CTA */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                data-audio-control="true"
                onClick={handleTogglePlayPause}
                className="flex-1 min-w-[120px] py-2.5 px-3.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md transition-all hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                {isAudioActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{settings.listenButtonText || '🔊 Play Audio'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-audio-control="true"
                onClick={handleReplayFromStart}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                title="Play Again from Start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              {settings.showSkipButton !== false && (
                <button
                  type="button"
                  data-audio-skip="true"
                  onClick={handleSkipAudio}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>{settings.skipButtonText || 'Skip'}</span>
                </button>
              )}

              {settings.enableCtaButton && settings.ctaButtonText && (
                <a
                  href={settings.ctaTargetSection || '#special'}
                  onClick={() => {
                    setShowWelcomeCard(false);
                    setIsMinimized(true);
                  }}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-[#f6a623] hover:bg-[#ffba42] text-[#1a1a1a] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{settings.ctaButtonText}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Compact Floating Audio Pill (When Minimized or Floating Pill Mode) */}
      {(isMinimized || !showWelcomeCard) && (
        <div
          data-audio-control="true"
          className="fixed left-3 sm:left-6 bottom-18 sm:bottom-20 z-30 flex items-center gap-1.5 animate-fadeIn"
        >
          <div className="bg-[#1a1a1a]/90 backdrop-blur-md text-white rounded-full p-1 pr-3 shadow-[0_8px_28px_rgba(0,0,0,0.3)] border border-white/15 flex items-center gap-2">
            <button
              type="button"
              data-audio-control="true"
              onClick={handleTogglePlayPause}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
              title={isAudioActive ? 'Pause Welcome Audio' : 'Play Welcome Audio'}
            >
              {isAudioActive ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              data-audio-control="true"
              onClick={() => {
                setIsMinimized(false);
                setShowWelcomeCard(true);
                if (!isAudioActive) {
                  startPlayback(true, false);
                }
              }}
              className="text-left cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-white group-hover:text-[#f6a623] transition-colors flex items-center gap-1.5">
                <span>{isAudioActive ? 'Playing Audio' : 'Play Audio'}</span>
                {isAudioActive && (
                  <span className="inline-flex items-end gap-0.5 h-2.5">
                    <span className="w-0.5 bg-[#f6a623] h-2.5 animate-pulse" />
                    <span className="w-0.5 bg-white h-1.5 animate-bounce" />
                    <span className="w-0.5 bg-[#f6a623] h-2 animate-pulse" />
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              data-audio-control="true"
              onClick={handleReplayFromStart}
              className="text-white/75 hover:text-[#f6a623] transition-colors cursor-pointer p-1"
              title="Play Again from Beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {isAudioActive && (
              <button
                type="button"
                data-audio-skip="true"
                onClick={handleSkipAudio}
                className="ml-0.5 px-2 py-0.5 rounded-full bg-white/15 hover:bg-[#e8281a] text-[10px] font-semibold text-white transition-colors cursor-pointer"
                title="Skip / Stop Audio"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
