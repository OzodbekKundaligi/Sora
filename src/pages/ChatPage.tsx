import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  History,
  Languages,
  Loader2,
  Mic,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslateText } from '../lib/i18n';
import {
  addUserMessage,
  getUserMessages,
  saveUserMessages,
  updateMessageFeedback,
  type StoredMessage,
} from '../lib/localData';
import {
  checkGrammar,
  generateTutorReply,
  playPronunciation,
  translateToUzbek,
} from '../services/sora-ai';

type FilterMode = 'all' | 'positive' | 'negative';

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ');
}

function filterInteractions(messages: StoredMessage[], filter: FilterMode) {
  if (filter === 'all') {
    return messages;
  }

  const targetRating = filter === 'positive' ? 'up' : 'down';
  const selectedIds = new Set<string>();
  const result: StoredMessage[] = [];

  messages.forEach((message, index) => {
    if (message.role !== 'ai' || message.rating !== targetRating) {
      return;
    }

    const previous = messages[index - 1];
    if (previous?.role === 'user' && !selectedIds.has(previous.id)) {
      selectedIds.add(previous.id);
      result.push(previous);
    }

    if (!selectedIds.has(message.id)) {
      selectedIds.add(message.id);
      result.push(message);
    }
  });

  return result;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, settings } = useAuth();
  const t = useTranslateText();
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [input, setInput] = useState('');
  const [voiceDraft, setVoiceDraft] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [grammarError, setGrammarError] = useState<ReturnType<typeof checkGrammar> | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const voiceTranscriptRef = useRef('');

  useEffect(() => {
    if (!user) {
      return;
    }

    setMessages(getUserMessages(user.id));
  }, [user]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return undefined;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join('');
      voiceTranscriptRef.current = transcript;
      setVoiceDraft(transcript);
    };
    recognitionRef.current.onend = () => {
      if (isRecording) {
        recognitionRef.current.start();
      }
    };
    recognitionRef.current.onerror = () => setIsRecording(false);

    return () => {
      recognitionRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [isRecording]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, filter, isLoading]);

  const filteredMessages = useMemo(() => filterInteractions(messages, filter), [messages, filter]);
  const positiveCount = messages.filter((message) => message.rating === 'up').length;
  const negativeCount = messages.filter((message) => message.rating === 'down').length;

  if (!user) {
    return null;
  }

  const persistMessages = (nextMessages: StoredMessage[]) => {
    setMessages(nextMessages);
    saveUserMessages(user.id, nextMessages);
  };

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Audio conversion failed.'));
      reader.readAsDataURL(blob);
    });

  const handleSend = async (text: string, audioUrl?: string | null) => {
    const trimmed = text.trim();
    if (!trimmed && !audioUrl) {
      return;
    }

    const userMessage = addUserMessage(user.id, {
      role: 'user',
      text: trimmed || 'Voice note',
      audioUrl: audioUrl || null,
    });

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setVoiceDraft('');
    voiceTranscriptRef.current = '';
    setGrammarError(null);
    setIsLoading(true);

    window.setTimeout(() => {
      const reply = generateTutorReply(
        trimmed || 'I sent a voice note. Please help me improve it in English.',
        nextMessages.map((message) => ({ role: message.role, text: message.text })),
        user.name,
      );

      const aiMessage = addUserMessage(user.id, {
        role: 'ai',
        text: reply,
      });

      setMessages((current) => [...current, aiMessage]);
      setIsLoading(false);
    }, 550);
  };

  const handleGrammarCheck = async () => {
    if (!input.trim()) {
      return;
    }

    const result = checkGrammar(input, user.id);
    if (result.hasError) {
      setGrammarError(result);
      return;
    }

    await handleSend(input);
  };

  const startVoiceNoteRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      window.alert('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      voiceTranscriptRef.current = '';
      setVoiceDraft('');

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (audioBlob.size > 0) {
          const audioUrl = await blobToDataUrl(audioBlob);
          await handleSend(voiceTranscriptRef.current, audioUrl);
        }
      };

      recorder.start();
      recognitionRef.current?.start();
      setIsRecording(true);
    } catch {
      window.alert('Microphone access was denied.');
      setIsRecording(false);
    }
  };

  const stopVoiceNoteRecording = () => {
    setIsRecording(false);
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
  };

  const handleTranslate = async (messageId: string, text: string) => {
    const translation = await translateToUzbek(text);
    const updated = messages.map((message) =>
      message.id === messageId ? { ...message, translation } : message,
    );
    persistMessages(updated);
  };

  const handleVoice = async (messageId: string, text: string) => {
    if (playingId === messageId) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    setPlayingId(messageId);
    await playPronunciation(text, settings.preferredVoice);
    setPlayingId(null);
  };

  const handleRating = (messageId: string, rating: 'up' | 'down') => {
    const updated = updateMessageFeedback(user.id, messageId, rating);
    setMessages(updated);
  };

  const saveHistory = () => {
    const content = messages
      .map((message) => `[${message.timestamp}] ${message.role.toUpperCase()}: ${message.text}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sora-chat-history-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <header className="bg-background sticky top-0 z-50 glass-nav">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => (input.trim() ? setShowConfirmDiscard(true) : navigate('/dashboard'))} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-on-surface" />
            </button>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-primary-fixed text-[10px] font-bold text-on-primary-fixed-variant uppercase tracking-wider">
                SORA AI
              </span>
              <h1 className="font-headline font-bold text-lg text-on-surface">
                {t({ uz: 'Jonli muloqot', en: 'Live Chat', ru: 'Живой чат' })}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveHistory} title={t({ uz: 'Tarixni saqlash', en: 'Save history', ru: 'Сохранить историю' })} className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-primary">
              <Save className="w-5 h-5" />
            </button>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-surface shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-surface shadow-sm">
                {user.name[0] || 'U'}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
          <FilterChip label={t({ uz: 'Hammasi', en: 'All', ru: 'Все' })} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label={`${t({ uz: 'Ijobiy', en: 'Thumbs up', ru: 'Положительные' })} (${positiveCount})`} active={filter === 'positive'} onClick={() => setFilter('positive')} />
          <FilterChip label={`${t({ uz: 'Salbiy', en: 'Thumbs down', ru: 'Отрицательные' })} (${negativeCount})`} active={filter === 'negative'} onClick={() => setFilter('negative')} />
          <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            {t({
              uz: `Default voice: ${settings.preferredVoice}`,
              en: `Default voice: ${settings.preferredVoice}`,
              ru: `Голос по умолчанию: ${settings.preferredVoice}`,
            })}
          </span>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 pt-4 pb-60 space-y-8 no-scrollbar">
        {filteredMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60 py-20">
            <History className="w-16 h-16 text-outline" />
            <p className="text-on-surface-variant font-medium">
              {filter === 'all'
                ? t({ uz: "Hali xabarlar yo'q. Birinchi muloqotni boshlang.", en: 'No messages yet. Start your first conversation.', ru: 'Сообщений пока нет. Начните первый разговор.' })
                : t({ uz: "Bu filter bo'yicha hali feedback yo'q.", en: 'No messages match this feedback filter yet.', ru: 'Для этого фильтра пока нет сообщений.' })}
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {filteredMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                'flex flex-col gap-2 max-w-[88%] md:max-w-[70%]',
                message.role === 'user' ? 'ml-auto items-end' : 'items-start',
              )}
            >
              <div
                className={cn(
                  'p-5 shadow-sm relative overflow-hidden rounded-3xl',
                  message.role === 'ai'
                    ? 'bg-surface-container-lowest border-l-4 border-primary'
                    : 'bg-primary text-white shadow-lg',
                )}
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  {message.role === 'ai' ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-headline font-bold text-xs text-primary">Sora AI Coach</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                      {t({ uz: 'Siz', en: 'You', ru: 'Вы' })}
                    </span>
                  )}
                  <span className={cn('text-[10px] font-bold', message.role === 'ai' ? 'text-on-surface-variant' : 'text-white/70')}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className={cn('text-base leading-relaxed whitespace-pre-wrap', message.role === 'ai' ? 'text-on-surface' : 'text-white')}>
                  {message.text}
                </p>

                {message.audioUrl && (
                  <div className="mt-4">
                    <audio controls src={message.audioUrl} className="w-full max-w-xs" />
                  </div>
                )}

                {message.translation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-outline-variant/20">
                    <p className="text-sm italic text-on-surface-variant bg-surface-container-low p-3 rounded-xl">
                      {message.translation}
                    </p>
                  </motion.div>
                )}

                {message.role === 'ai' && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleVoice(message.id, message.text)}
                        className={cn(
                          'flex items-center gap-2 py-2 px-3 rounded-full transition-all text-[11px] font-bold',
                          playingId === message.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20',
                        )}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {playingId === message.id
                          ? t({ uz: 'Gapirmoqda...', en: 'Speaking...', ru: 'Озвучивание...' })
                          : t({ uz: 'Ovozli eshitish', en: 'Play voice', ru: 'Прослушать' })}
                      </button>
                      <button
                        onClick={() => handleTranslate(message.id, message.text)}
                        className="flex items-center gap-2 py-2 px-3 rounded-full bg-secondary-container/10 text-secondary-container text-[11px] font-bold hover:bg-secondary-container/20 transition-all"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        {t({ uz: 'Tarjima', en: 'Translate', ru: 'Перевести' })}
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRating(message.id, 'up')}
                        className={cn('p-2 rounded-full transition-colors', message.rating === 'up' ? 'bg-green-100 text-green-600' : 'hover:bg-surface-container text-outline')}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRating(message.id, 'down')}
                        className={cn('p-2 rounded-full transition-colors', message.rating === 'down' ? 'bg-red-100 text-red-600' : 'hover:bg-surface-container text-outline')}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex flex-col items-start gap-2 max-w-[85%] md:max-w-[70%]">
            <div className="bg-surface-container-lowest p-5 rounded-3xlow-sm border border-outline-variant/10">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                  {t({ uz: "Sora javob tayyorlamoqda...", en: 'Sora is preparing a reply...', ru: 'Sora готовит ответ...' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-10 left-0 w-full flex flex-col items-center px-6 gap-4">
        <AnimatePresence>
          {grammarError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-error/10 border border-error/15 p-5 rounded-[1.75rem] shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-error/15 flex items-center justify-center shrink-0">
                  <AlertCircle className="text-error w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-error uppercase tracking-widest">
                      {t({ uz: 'Grammatik tahlil', en: 'Grammar review', ru: 'Грамматический разбор' })}
                    </p>
                    <button onClick={() => setGrammarError(null)} className="text-error hover:opacity-75">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-on-surface font-bold mb-2 leading-relaxed">{grammarError.explanation}</p>

                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-error/10 mb-3">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase mb-1">
                      {t({ uz: 'Batafsil', en: 'Details', ru: 'Детали' })}
                    </p>
                    <p className="text-xs text-on-surface-variant leading-relaxed italic">{grammarError.detailedExplanation}</p>
                  </div>

                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-error/10 mb-4">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase mb-1">
                      {t({ uz: 'Tuzatilgan shakl', en: 'Corrected version', ru: 'Исправленный вариант' })}
                    </p>
                    <p className="text-base font-black text-green-600">{grammarError.correctedText}</p>
                  </div>

                  {grammarError.tips.length > 0 && (
                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mb-4">
                      <p className="text-[10px] text-primary font-black uppercase mb-2 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {t({ uz: 'Maslahatlar', en: 'Tips', ru: 'Советы' })}
                      </p>
                      <ul className="space-y-1">
                        {grammarError.tips.map((tip, index) => (
                          <li key={index} className="text-[11px] text-on-surface-variant flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setInput(grammarError.correctedText);
                        setGrammarError(null);
                      }}
                      className="bg-green-600 text-white px-5 py-2 rounded-full text-xs font-bold"
                    >
                      {t({ uz: "Tuzatishni qo'llash", en: 'Use correction', ru: 'Применить исправление' })}
                    </button>
                    <button onClick={() => handleSend(input)} className="bg-on-surface/10 text-on-surface px-5 py-2 rounded-full text-xs font-bold">
                      {t({ uz: 'Baribir yuborish', en: 'Send anyway', ru: 'Отправить всё равно' })}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isRecording && (
          <div className="w-full max-w-xl rounded-3xl bg-secondary-container/10 border border-secondary-container/20 px-4 py-3 text-sm text-on-surface">
            <span className="font-bold text-secondary-container">Voice note recording...</span>{' '}
            {voiceDraft || 'Listening to your speech...'}
          </div>
        )}

        <div className="bg-surface-container-lowest/95 backdrop-blur-2xl p-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-2 border border-outline-variant/10 w-full max-w-xl">
          <button onClick={() => { setInput(''); setVoiceDraft(''); }} className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleGrammarCheck()}
              placeholder={isRecording ? t({ uz: 'Eshitilmoqda...', en: 'Listening...', ru: 'Слушаю...' }) : t({ uz: 'Xabar yozing...', en: 'Write a message...', ru: 'Введите сообщение...' })}
              className="w-full bg-surface-container-low border-none rounded-full py-3.5 px-6 text-on-surface focus:ring-2 focus:ring-primary transition-all text-sm font-medium outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (isRecording) stopVoiceNoteRecording();
              else void startVoiceNoteRecording();
            }}
            className={cn(
              'w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all',
              isRecording ? 'bg-red-500 scale-110 text-white' : 'bg-secondary-container text-white hover:scale-105 active:scale-95',
            )}
            title={isRecording ? 'Stop and send voice note' : 'Record voice note'}
          >
            <Mic className={cn('w-5 h-5', isRecording && 'animate-pulse')} />
          </button>

          <button
            onClick={handleGrammarCheck}
            disabled={!input.trim() || isLoading}
            className={cn(
              'w-12 h-12 flex items-center justify-center rounded-full transition-all',
              input.trim() ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-high text-outline',
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmDiscard && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface-container-lowest rounded-4xl p-8 max-w-md shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-black text-on-surface">
                {t({ uz: "Yuborilmagan xabar o'chirilsinmi?", en: 'Discard unsent message?', ru: 'Удалить неотправленное сообщение?' })}
              </h3>
              <p className="text-on-surface-variant leading-relaxed font-medium">
                {t({
                  uz: "Yozilgan matn saqlanmaydi. Chiqishni tasdiqlaysizmi?",
                  en: 'Your current draft will not be saved. Do you want to leave?',
                  ru: 'Текущий черновик не сохранится. Выйти?',
                })}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmDiscard(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold">
                  {t({ uz: "Yo'q", en: 'Stay', ru: 'Остаться' })}
                </button>
                <button
                  onClick={() => {
                    setInput('');
                    setShowConfirmDiscard(false);
                    navigate('/dashboard');
                  }}
                  className="flex-1 py-4 bg-error text-white rounded-xl font-bold"
                >
                  {t({ uz: 'Chiqish', en: 'Leave', ru: 'Выйти' })}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-[11px] font-bold transition-all',
        active ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant',
      )}
    >
      {label}
    </button>
  );
}
