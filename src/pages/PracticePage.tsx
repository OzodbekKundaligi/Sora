import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, Reorder } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Dumbbell,
  Home,
  Lightbulb,
  Loader2,
  Mic,
  RefreshCw,
  Sparkles,
  Target,
  User,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getGrammarTopic,
  getVocabularyByWord,
  readingPassages,
  vocabularyBank,
  writingPrompts,
} from '../lib/courseData';
import { useTranslateText } from '../lib/i18n';
import {
  addWritingSubmission,
  addListeningSubmission,
  addMockAttempt,
  addXp,
  completeDailyMissionItem,
  getUserData,
  updateUserData,
} from '../lib/localData';
import {
  analyzeSpeakingChallenge,
  continueRoleplayScenario,
  type Exercise,
  type PronunciationFeedback,
  type RoleplayScenario,
  type WritingEvaluation,
  evaluateWritingSubmission,
  generateExercise,
  generateGrammarExercise,
  getGrammarTopics,
  getPronunciationFeedback,
  getReadingPassageForLevel,
  getRoleplayScenarioForLevel,
  getRoleplayScenariosForLevel,
  getSuggestedGrammarTopic,
  getWritingPromptForLevel,
  playPronunciation,
} from '../services/sora-ai';
import {
  evaluateListeningAnswer,
  evaluateMockResults,
  getListeningLessonForLevel,
  getListeningLessonsForLevel,
  getMockExamForLevel,
} from '../services/academy';
import { srsService } from '../services/srsService';

type PracticeTab = 'vocabulary' | 'pronunciation' | 'grammar' | 'reading' | 'writing' | 'listening' | 'roleplay' | 'mock';
type QuizFormat = 'multiple-choice' | 'fill-in-the-blanks' | 'matching';

const grammarTopics = getGrammarTopics();
const levelStages = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'IELTS'];

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ');
}

function levelRank(level: string) {
  const index = levelStages.indexOf(level);
  return index === -1 ? 0 : index;
}

export default function PracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, settings, updateUser } = useAuth();
  const t = useTranslateText();
  const routeState = (location.state || {}) as {
    tab?: PracticeTab;
    word?: string;
    topicId?: string;
    passageId?: string;
    promptId?: string;
    lessonId?: string;
    roleplayId?: string;
  };
  const [tab, setTab] = useState<PracticeTab>(routeState.tab || 'vocabulary');
  const [quizFormat, setQuizFormat] = useState<QuizFormat>('multiple-choice');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentWord, setCurrentWord] = useState(routeState.word || '');
  const [selectedTopicId, setSelectedTopicId] = useState(routeState.topicId || grammarTopics[0].id);
  const [selected, setSelected] = useState<number | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [matchingSelection, setMatchingSelection] = useState<string | null>(null);
  const [scrambledOrder, setScrambledOrder] = useState<Array<{ id: string; text: string }>>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pronunciationTarget, setPronunciationTarget] = useState('');
  const [pronunciationTranscript, setPronunciationTranscript] = useState('');
  const [pronunciationFeedback, setPronunciationFeedback] = useState<PronunciationFeedback | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [selectedReadingId, setSelectedReadingId] = useState(routeState.passageId || '');
  const [readingAnswers, setReadingAnswers] = useState<Record<number, string>>({});
  const [readingChecked, setReadingChecked] = useState(false);
  const [readingScore, setReadingScore] = useState<number | null>(null);
  const [selectedWritingId, setSelectedWritingId] = useState(routeState.promptId || '');
  const [writingText, setWritingText] = useState('');
  const [writingEvaluation, setWritingEvaluation] = useState<WritingEvaluation | null>(null);
  const [isSubmittingWriting, setIsSubmittingWriting] = useState(false);
  const [selectedListeningId, setSelectedListeningId] = useState(routeState.lessonId as string || '');
  const [listeningSpeed, setListeningSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [listeningAnswer, setListeningAnswer] = useState('');
  const [listeningChecked, setListeningChecked] = useState(false);
  const [listeningResult, setListeningResult] = useState<{ correct: boolean; score: number; feedback: string } | null>(null);
  const [transcriptUnlocked, setTranscriptUnlocked] = useState(false);
  const [shadowingRepetitions, setShadowingRepetitions] = useState(0);
  const [selectedRoleplayId, setSelectedRoleplayId] = useState(routeState.roleplayId || '');
  const [roleplayMessages, setRoleplayMessages] = useState<Array<{ speaker: 'ai' | 'user' | 'coach'; text: string }>>([]);
  const [roleplayInput, setRoleplayInput] = useState('');
  const [roleplayTurn, setRoleplayTurn] = useState(0);
  const [roleplayResult, setRoleplayResult] = useState<{
    score: number;
    coachNote: string;
    nextTarget: string;
    correction?: string;
    finished: boolean;
  } | null>(null);
  const [mockListeningAnswer, setMockListeningAnswer] = useState('');
  const [mockReadingAnswers, setMockReadingAnswers] = useState<Record<number, string>>({});
  const [mockWritingText, setMockWritingText] = useState('');
  const [mockSpeakingText, setMockSpeakingText] = useState('');
  const [mockStarted, setMockStarted] = useState(false);
  const [mockTimeLeft, setMockTimeLeft] = useState(0);
  const [mockResult, setMockResult] = useState<{
    score: number;
    band: number;
    sectionScores: { listening: number; reading: number; writing: number; speaking: number };
  } | null>(null);
  const recognitionRef = useRef<any>(null);

  const stats = user
    ? (() => {
        const userData = getUserData(user.id);
        return {
          srs: srsService.getStats(user.id),
          suggestedTopic: getSuggestedGrammarTopic(userData.grammarErrors.map((entry) => entry.topic)),
          recentErrors: userData.grammarErrors.slice(0, 4),
          recentWriting: userData.writingSubmissions.slice(0, 3),
        };
      })()
    : null;

  const unlockedReadings = useMemo(() => {
    if (!user) return [];
    return readingPassages.filter((entry) => levelRank(entry.level) <= levelRank(user.level));
  }, [user]);

  const unlockedPrompts = useMemo(() => {
    if (!user) return [];
    return writingPrompts.filter((entry) => levelRank(entry.level) <= levelRank(user.level));
  }, [user]);

  const activeReading = useMemo(() => {
    if (!user) return null;
    return getReadingPassageForLevel(user.level, selectedReadingId);
  }, [selectedReadingId, user]);

  const activeWritingPrompt = useMemo(() => {
    if (!user) return null;
    return getWritingPromptForLevel(user.level, selectedWritingId);
  }, [selectedWritingId, user]);

  const activeListeningLesson = useMemo(() => {
    if (!user) return null;
    return getListeningLessonForLevel(user.level, selectedListeningId);
  }, [selectedListeningId, user]);

  const unlockedListeningLessons = useMemo(() => {
    if (!user) return [];
    return getListeningLessonsForLevel(user.level);
  }, [user]);

  const activeRoleplay = useMemo(() => {
    if (!user) return null;
    return getRoleplayScenarioForLevel(user.level, selectedRoleplayId);
  }, [selectedRoleplayId, user]);

  const unlockedRoleplays = useMemo(() => {
    if (!user) return [];
    return getRoleplayScenariosForLevel(user.level);
  }, [user]);

  const activeMock = useMemo(() => {
    if (!user) return null;
    return getMockExamForLevel(user.level);
  }, [user]);

  const activeMockReading = useMemo(() => {
    if (!activeMock) return null;
    return readingPassages.find((entry) => entry.id === activeMock.readingPassageId) || readingPassages[0];
  }, [activeMock]);

  const activeMockWritingPrompt = useMemo(() => {
    if (!activeMock) return null;
    return writingPrompts.find((entry) => entry.id === activeMock.writingPromptId) || writingPrompts[0];
  }, [activeMock]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = true;
    recognitionRef.current.onresult = async (event: any) => {
      const transcript = Array.from(event.results).map((result: any) => result[0]?.transcript || '').join(' ').trim();
      setPronunciationTranscript(transcript);
      if (pronunciationTarget) setPronunciationFeedback(await getPronunciationFeedback(transcript, pronunciationTarget));
    };
    recognitionRef.current.onerror = () => setIsRecording(false);
    recognitionRef.current.onend = () => setIsRecording(false);
  }, [pronunciationTarget]);

  useEffect(() => {
    if (!user || !stats) return;
    if (tab === 'vocabulary') void loadVocabularyExercise(routeState.word);
    if (tab === 'grammar') {
      const nextTopic = routeState.topicId || stats.suggestedTopic.id || grammarTopics[0].id;
      setSelectedTopicId(nextTopic);
      void loadGrammarExercise(nextTopic);
    }
    if (tab === 'pronunciation') {
      loadPronunciationTarget(routeState.word);
      setIsLoading(false);
    }
    if (tab === 'reading') {
      setSelectedReadingId((current) => current || routeState.passageId || getReadingPassageForLevel(user.level).id);
      resetReadingState();
      setIsLoading(false);
    }
    if (tab === 'writing') {
      setSelectedWritingId((current) => current || routeState.promptId || getWritingPromptForLevel(user.level).id);
      setIsLoading(false);
    }
    if (tab === 'listening') {
      setSelectedListeningId((current) => current || routeState.lessonId || getListeningLessonForLevel(user.level).id);
      setListeningAnswer('');
      setListeningChecked(false);
      setListeningResult(null);
      setTranscriptUnlocked(false);
      setShadowingRepetitions(0);
      setIsLoading(false);
    }
    if (tab === 'roleplay') {
      setSelectedRoleplayId((current) => current || routeState.roleplayId || getRoleplayScenarioForLevel(user.level).id);
      setRoleplayInput('');
      setRoleplayResult(null);
      setIsLoading(false);
    }
    if (tab === 'mock') {
      const mock = getMockExamForLevel(user.level);
      setMockStarted(false);
      setMockTimeLeft(mock.durationMinutes * 60);
      setMockListeningAnswer('');
      setMockReadingAnswers({});
      setMockWritingText('');
      setMockSpeakingText('');
      setMockResult(null);
      setIsLoading(false);
    }
  }, [
    quizFormat,
    routeState.lessonId,
    routeState.passageId,
    routeState.promptId,
    routeState.roleplayId,
    routeState.topicId,
    routeState.word,
    stats?.suggestedTopic.id,
    tab,
    user?.id,
    user?.level,
  ]);

  useEffect(() => {
    if (tab === 'grammar' && user) void loadGrammarExercise(selectedTopicId);
  }, [selectedTopicId, tab, user]);

  useEffect(() => {
    if (tab !== 'roleplay' || !activeRoleplay) return;
    setRoleplayMessages([{ speaker: 'ai', text: activeRoleplay.aiOpener }]);
    setRoleplayInput('');
    setRoleplayTurn(0);
    setRoleplayResult(null);
  }, [activeRoleplay, tab]);

  if (
    !user
    || !stats
    || !activeReading
    || !activeWritingPrompt
    || !activeListeningLesson
    || !activeRoleplay
    || !activeMock
    || !activeMockReading
    || !activeMockWritingPrompt
  ) return null;

  function resetExerciseState() {
    setSelected(null);
    setFillValue('');
    setMatchedPairs([]);
    setMatchingSelection(null);
    setScrambledOrder([]);
    setIsChecked(false);
    setIsCorrect(null);
  }

  function resetReadingState() {
    setReadingAnswers({});
    setReadingChecked(false);
    setReadingScore(null);
  }

  function grantXp(amount: number) {
    const nextUser = addXp(user.id, amount);
    if (nextUser) updateUser(nextUser);
  }

  async function loadVocabularyExercise(preferredWord?: string) {
    setIsLoading(true);
    resetExerciseState();
    const nextWord = preferredWord || srsService.getNextWord(user.id)?.word || vocabularyBank[0].word;
    const nextExercise = await generateExercise(user.level, nextWord, quizFormat);
    setCurrentWord(nextWord);
    setExercise(nextExercise);
    if (nextExercise?.scrambledWords) setScrambledOrder(nextExercise.scrambledWords.map((word, index) => ({ id: `${word}-${index}`, text: word })));
    loadPronunciationTarget(nextWord);
    setIsLoading(false);
  }

  async function loadGrammarExercise(topicId: string) {
    setIsLoading(true);
    resetExerciseState();
    const nextExercise = await generateGrammarExercise(user.level, topicId);
    setExercise(nextExercise);
    if (nextExercise?.scrambledWords) setScrambledOrder(nextExercise.scrambledWords.map((word, index) => ({ id: `${word}-${index}`, text: word })));
    loadPronunciationTarget(topicId);
    setIsLoading(false);
  }

  function loadPronunciationTarget(seed?: string) {
    const vocab = getVocabularyByWord(seed || currentWord);
    const topic = grammarTopics.find((entry) => entry.id === seed) || grammarTopics.find((entry) => entry.id === selectedTopicId);
    setPronunciationTarget(vocab?.example || topic?.example || 'I study English every day.');
    setPronunciationTranscript('');
    setPronunciationFeedback(null);
  }

  function updatePracticeMeta(word: string, correct: boolean) {
    srsService.updateWord(user.id, word, correct);
    updateUserData(user.id, (data) => {
      const struggled = new Set(data.struggledWords);
      if (correct) struggled.delete(word);
      else struggled.add(word);
      return { ...data, struggledWords: Array.from(struggled) };
    });
    grantXp(correct ? 22 : 8);
  }

  function finalizeResult(correct: boolean) {
    setIsCorrect(correct);
    setIsChecked(true);
    const referenceWord = exercise?.word || exercise?.correctWord || currentWord || selectedTopicId;
    updatePracticeMeta(referenceWord, correct);
    completeDailyMissionItem(user.id, exercise?.topicId ? 'daily-grammar' : 'daily-srs');
    loadPronunciationTarget(referenceWord);
  }

  function handleCheck() {
    if (!exercise) return;
    let correct = false;
    if (exercise.type === 'multiple-choice' || exercise.type === 'vocabulary-identification') correct = selected === exercise.correctAnswerId;
    else if (exercise.type === 'fill-in-the-blanks') correct = fillValue.trim().toLowerCase() === exercise.correctWord?.trim().toLowerCase();
    else if (exercise.type === 'matching') correct = matchedPairs.length === (exercise.pairs?.length || 0);
    else correct = scrambledOrder.map((entry) => entry.text).join(' ').trim().toLowerCase() === exercise.correctSentence?.trim().toLowerCase();
    finalizeResult(correct);
  }

  function startRecording() {
    if (!recognitionRef.current) return;
    setPronunciationTranscript('');
    setPronunciationFeedback(null);
    setIsRecording(true);
    recognitionRef.current.start();
  }

  function cycleItem<T extends { id: string }>(
    currentId: string,
    items: T[],
    setter: (id: string) => void,
    reset: () => void,
  ) {
    if (items.length === 0) return;
    const currentIndex = items.findIndex((item) => item.id === currentId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length;
    setter(items[nextIndex].id);
    reset();
  }

  function submitReadingAnswers() {
    if (readingChecked) return;
    const correctCount = activeReading.questions.filter(
      (question, index) => readingAnswers[index] === question.answer,
    ).length;
    setReadingScore(correctCount);
    setReadingChecked(true);
    grantXp(correctCount === activeReading.questions.length ? 40 : 16 + correctCount * 8);
  }

  function submitWriting() {
    if (!writingText.trim()) return;
    setIsSubmittingWriting(true);
    const evaluation = evaluateWritingSubmission(
      writingText,
      user.level,
      activeWritingPrompt.minimumWords,
    );
    setWritingEvaluation(evaluation);
    addWritingSubmission(user.id, {
      promptId: activeWritingPrompt.id,
      title: activeWritingPrompt.title[settings.language],
      level: activeWritingPrompt.level,
      text: writingText.trim(),
      score: evaluation.score,
      feedback: evaluation.feedback,
    });
    completeDailyMissionItem(user.id, 'daily-writing');
    grantXp(Math.max(18, Math.round(evaluation.score / 3)));
    setIsSubmittingWriting(false);
  }

  React.useEffect(() => {
    if (tab !== 'mock' || !mockStarted || mockTimeLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setMockTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mockStarted, mockTimeLeft, tab]);

  async function submitListening() {
    const result = evaluateListeningAnswer(activeListeningLesson, listeningAnswer);
    setListeningChecked(true);
    setListeningResult(result);
    setTranscriptUnlocked(true);
    addListeningSubmission(user.id, {
      lessonId: activeListeningLesson.id,
      title: activeListeningLesson.title[settings.language],
      level: activeListeningLesson.level,
      score: result.score,
    });
    completeDailyMissionItem(user.id, 'daily-listening');
    grantXp(result.correct ? 24 : 10);
  }

  async function submitRoleplayTurn() {
    if (!roleplayInput.trim()) return;
    const userReply = roleplayInput.trim();
    const result = await continueRoleplayScenario(activeRoleplay, userReply, roleplayTurn);

    setRoleplayMessages((current) => [
      ...current,
      { speaker: 'user', text: userReply },
      ...(result.correction ? [{ speaker: 'coach' as const, text: `Correction: ${result.correction}` }] : []),
      { speaker: 'ai', text: result.aiReply },
    ]);
    setRoleplayInput('');
    setRoleplayTurn((current) => current + 1);
    setRoleplayResult(result);
    if (result.finished) {
      completeDailyMissionItem(user.id, 'daily-roleplay');
    }
    grantXp(result.finished ? 28 : 14);
  }

  async function submitMockExam() {
    const listening = evaluateListeningAnswer(activeMock.listening, mockListeningAnswer);
    const readingCorrect = activeMockReading.questions.filter(
      (question, index) => mockReadingAnswers[index] === question.answer,
    ).length;
    const readingScore = Math.round((readingCorrect / activeMockReading.questions.length) * 100);
    const writingScore = evaluateWritingSubmission(
      mockWritingText,
      activeMock.level,
      activeMockWritingPrompt.minimumWords,
    ).score;
    const speakingScore = (await analyzeSpeakingChallenge(mockSpeakingText, activeMock.speakingPrompt.en)).score;
    const result = evaluateMockResults({
      listening: listening.score,
      reading: readingScore,
      writing: writingScore,
      speaking: speakingScore,
    });

    setMockResult(result);
    setMockStarted(false);
    addMockAttempt(user.id, {
      title: activeMock.title[settings.language],
      level: activeMock.level,
      kind: activeMock.kind,
      score: result.score,
      band: result.band,
    });
    completeDailyMissionItem(user.id, 'daily-mock');
    grantXp(Math.max(30, Math.round(result.score / 2)));
  }

  const canCheck =
    exercise?.type === 'multiple-choice' || exercise?.type === 'vocabulary-identification'
      ? selected !== null
      : exercise?.type === 'fill-in-the-blanks'
        ? fillValue.length > 0
        : exercise?.type === 'matching'
          ? matchedPairs.length > 0
          : scrambledOrder.length > 0;

  const listeningRate =
    listeningSpeed === 'slow' ? 0.78 : listeningSpeed === 'fast' ? 1.18 : 1;

  return (
    <div className="bg-background min-h-screen flex flex-col max-w-6xl mx-auto pb-36">
      <header className="bg-background sticky top-0 z-50 glass-nav">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-on-surface" />
            </button>
            <div>
              <div className="text-xl font-extrabold text-primary">Sora AI</div>
              <div className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">A0 to IELTS practice</div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <TabButton active={tab === 'vocabulary'} onClick={() => setTab('vocabulary')} label={t({ uz: "Lug'at", en: 'Vocabulary', ru: 'Словарь' })} />
            <TabButton active={tab === 'grammar'} onClick={() => setTab('grammar')} label="Grammar" />
            <TabButton active={tab === 'pronunciation'} onClick={() => setTab('pronunciation')} label="Speaking" />
            <TabButton active={tab === 'listening'} onClick={() => setTab('listening')} label="Listening" />
            <TabButton active={tab === 'roleplay'} onClick={() => setTab('roleplay')} label="Roleplay" />
            <TabButton active={tab === 'reading'} onClick={() => setTab('reading')} label="Reading" />
            <TabButton active={tab === 'writing'} onClick={() => setTab('writing')} label="Writing" />
            <TabButton active={tab === 'mock'} onClick={() => setTab('mock')} label="Mock" />
          </div>
        </div>
      </header>

      <main className="px-4 pt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr] flex-1 sm:px-6">
        <section className="space-y-6">
          {tab === 'vocabulary' && (
            <>
              <HeroCard
                title={t({ uz: "SRS lug'at quizlari", en: 'SRS vocabulary quizzes', ru: 'SRS словарные квизы' })}
                description={t({
                  uz: 'So‘zlar optimal vaqtda qayta ko‘rsatiladi. Formatni o‘zingiz tanlaysiz: matching, fill-in-the-blanks yoki multiple-choice.',
                  en: 'Words appear at the right review time. Choose matching, fill-in-the-blank, or multiple-choice.',
                  ru: 'Слова показываются в оптимальный момент. Выберите matching, fill-in-the-blank или multiple-choice.',
                })}
                stats={[
                  { label: 'Due', value: stats.srs.due },
                  { label: 'Mastered', value: stats.srs.mastered },
                  { label: 'Weak', value: stats.srs.weak },
                ]}
              />
              <div className="flex flex-wrap gap-2">
                {(['multiple-choice', 'fill-in-the-blanks', 'matching'] as QuizFormat[]).map((format) => (
                  <FormatChip
                    key={format}
                    active={quizFormat === format}
                    onClick={() => setQuizFormat(format)}
                    label={format === 'multiple-choice' ? 'Multiple choice' : format === 'fill-in-the-blanks' ? 'Fill in the blank' : 'Matching'}
                  />
                ))}
              </div>
              {isLoading || !exercise ? (
                <LoadingBlock text={t({ uz: 'Quiz tayyorlanmoqda...', en: 'Preparing quiz...', ru: 'Подготовка квиза...' })} />
              ) : (
                <>
                  <ExercisePanel
                    exercise={exercise}
                    selected={selected}
                    setSelected={setSelected}
                    fillValue={fillValue}
                    setFillValue={setFillValue}
                    matchedPairs={matchedPairs}
                    setMatchedPairs={setMatchedPairs}
                    matchingSelection={matchingSelection}
                    setMatchingSelection={setMatchingSelection}
                    scrambledOrder={scrambledOrder}
                    setScrambledOrder={setScrambledOrder}
                    isChecked={isChecked}
                    onPronounce={() => playPronunciation(currentWord || exercise.word || '', settings.preferredVoice)}
                  />
                  <ActionRow>
                    <button
                      disabled={!canCheck || isChecked}
                      onClick={handleCheck}
                      className={cn('px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg', !canCheck || isChecked ? 'bg-outline/50' : 'bg-secondary-container shadow-secondary-container/25')}
                    >
                      {isChecked ? (isCorrect ? t({ uz: "To'g'ri", en: 'Correct', ru: 'Верно' }) : t({ uz: 'Xato', en: 'Incorrect', ru: 'Ошибка' })) : t({ uz: 'Tekshirish', en: 'Check', ru: 'Проверить' })}
                    </button>
                    <button onClick={() => loadVocabularyExercise()} className="px-6 py-3.5 rounded-2xl font-bold bg-primary text-white flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      {t({ uz: 'Keyingi quiz', en: 'Next quiz', ru: 'Следующий квиз' })}
                    </button>
                  </ActionRow>
                </>
              )}
            </>
          )}

          {tab === 'grammar' && (
            <>
              <HeroCard
                title="Grammar drills"
                description={t({
                  uz: 'Sora AI aniqlagan keng tarqalgan xatolarga qarab mashqlar tavsiya qilinadi. Mavzuni qo‘lda ham tanlashingiz mumkin.',
                  en: 'Exercises are suggested from your common mistakes, or you can pick the topic yourself.',
                  ru: 'Упражнения предлагаются по вашим частым ошибкам, либо можно выбрать тему вручную.',
                })}
                stats={[
                  { label: 'Suggested', value: stats.suggestedTopic.label[settings.language] },
                  { label: 'Errors', value: stats.recentErrors.length },
                  { label: 'Topics', value: grammarTopics.length },
                ]}
              />
              <div className="bg-surface-container-lowest rounded-[1.75rem] p-4 border border-outline-variant/10">
                <div className="text-sm font-black uppercase tracking-widest text-primary">
                  {t({ uz: 'Mavzu tanlang yoki Sora tavsiyasini ishlating', en: 'Choose a topic or use Sora suggestion', ru: 'Выберите тему или используйте совет Sora' })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <FormatChip active={selectedTopicId === stats.suggestedTopic.id} onClick={() => setSelectedTopicId(stats.suggestedTopic.id)} label={`Sora: ${stats.suggestedTopic.label[settings.language]}`} />
                  {grammarTopics.map((topic) => (
                    <FormatChip key={topic.id} active={selectedTopicId === topic.id} onClick={() => setSelectedTopicId(topic.id)} label={topic.label[settings.language]} />
                  ))}
                </div>
              </div>
              {isLoading || !exercise ? (
                <LoadingBlock text={t({ uz: 'Grammar drill tayyorlanmoqda...', en: 'Preparing grammar drill...', ru: 'Подготовка упражнения...' })} />
              ) : (
                <>
                  <ExercisePanel
                    exercise={exercise}
                    selected={selected}
                    setSelected={setSelected}
                    fillValue={fillValue}
                    setFillValue={setFillValue}
                    matchedPairs={matchedPairs}
                    setMatchedPairs={setMatchedPairs}
                    matchingSelection={matchingSelection}
                    setMatchingSelection={setMatchingSelection}
                    scrambledOrder={scrambledOrder}
                    setScrambledOrder={setScrambledOrder}
                    isChecked={isChecked}
                    onPronounce={() => playPronunciation(exercise.correctSentence || exercise.correctWord || exercise.word || '', settings.preferredVoice)}
                  />
                  <div className="bg-surface-container-low rounded-[1.5rem] p-5 border-l-4 border-secondary-container">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-secondary-container mt-0.5" />
                      <div>
                        <div className="font-bold text-on-surface">{t({ uz: 'Tushuntirish', en: 'Explanation', ru: 'Пояснение' })}</div>
                        <div className="text-sm text-on-surface-variant mt-1">{getGrammarTopic(selectedTopicId).explanation[settings.language]}</div>
                      </div>
                    </div>
                  </div>
                  <ActionRow>
                    <button
                      disabled={!canCheck || isChecked}
                      onClick={handleCheck}
                      className={cn('px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg', !canCheck || isChecked ? 'bg-outline/50' : 'bg-secondary-container shadow-secondary-container/25')}
                    >
                      {isChecked ? (isCorrect ? t({ uz: "To'g'ri", en: 'Correct', ru: 'Верно' }) : t({ uz: 'Xato', en: 'Incorrect', ru: 'Ошибка' })) : t({ uz: 'Tekshirish', en: 'Check', ru: 'Проверить' })}
                    </button>
                    <button onClick={() => loadGrammarExercise(selectedTopicId)} className="px-6 py-3.5 rounded-2xl font-bold bg-primary text-white flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      {t({ uz: 'Yangi drill', en: 'New drill', ru: 'Новое упражнение' })}
                    </button>
                  </ActionRow>
                </>
              )}
            </>
          )}

          {tab === 'pronunciation' && (
            <>
              <HeroCard
                title="Pronunciation focus"
                description="Use the lab on the right to compare your speech with the target line. Sora will point to phonetic, rhythm, and intonation issues."
                stats={[
                  { label: 'Voice', value: settings.preferredVoice },
                  { label: 'Target', value: pronunciationTarget ? 'Ready' : '...' },
                  { label: 'Mode', value: 'Mic review' },
                ]}
              />
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-4">
                <div className="text-xs font-black uppercase tracking-widest text-primary">How to use it</div>
                <CoachPoint title="1. Listen" text="Play the reference line once or twice before you speak." />
                <CoachPoint title="2. Record" text="Say the same line naturally. Do not rush the last word." />
                <CoachPoint title="3. Repair" text="Look at the waveform map, then repeat only the weak words." />
              </div>
            </>
          )}

          {tab === 'listening' && (
            <>
              <HeroCard
                title="Listening lab"
                description="Use slow, normal, and fast playback. Start from simple audio and build toward real-speed understanding."
                stats={[
                  { label: 'Level', value: activeListeningLesson.level },
                  { label: 'Speed', value: listeningSpeed },
                  { label: 'Shadowing', value: `${shadowingRepetitions}/3 reps` },
                ]}
              />
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-5">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Listening target</div>
                  <h2 className="mt-2 text-2xl font-extrabold text-on-surface">
                    {activeListeningLesson.title[settings.language]}
                  </h2>
                  <p className="mt-2 text-on-surface-variant">
                    {activeListeningLesson.focus[settings.language]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeListeningLesson.speeds.map((speed) => (
                    <FormatChip
                      key={speed}
                      active={listeningSpeed === speed}
                      onClick={() => setListeningSpeed(speed)}
                      label={speed}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => playPronunciation(activeListeningLesson.transcript, settings.preferredVoice, listeningRate)}
                    className="px-5 py-3 rounded-2xl font-bold bg-primary text-white flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    Play audio
                  </button>
                  <button
                    onClick={() => {
                      cycleItem(
                        selectedListeningId || activeListeningLesson.id,
                        unlockedListeningLessons,
                        setSelectedListeningId,
                         () => {
                           setListeningAnswer('');
                           setListeningChecked(false);
                           setListeningResult(null);
                           setTranscriptUnlocked(false);
                           setShadowingRepetitions(0);
                         },
                       );
                    }}
                    className="px-5 py-3 rounded-2xl font-bold bg-surface-container-low text-on-surface flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Next listening
                  </button>
                  <button
                    onClick={() => {
                      setSelectedListeningId(activeListeningLesson.id);
                      setListeningAnswer('');
                      setListeningChecked(false);
                      setListeningResult(null);
                      setTranscriptUnlocked(false);
                      setShadowingRepetitions(0);
                    }}
                    className="px-5 py-3 rounded-2xl font-bold bg-surface-container-low text-on-surface flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
                <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                  <div className="font-bold text-on-surface">{activeListeningLesson.question}</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {activeListeningLesson.options.map((option) => (
                      <button
                        key={option}
                        disabled={listeningChecked}
                        onClick={() => setListeningAnswer(option)}
                        className={cn(
                          'rounded-2xl border-2 p-4 text-left font-semibold transition-all',
                          listeningAnswer === option
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface-container-lowest border-outline-variant/15',
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <ActionRow>
                  <button
                    disabled={!listeningAnswer || listeningChecked}
                    onClick={submitListening}
                    className={cn(
                      'px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg',
                      !listeningAnswer || listeningChecked ? 'bg-outline/50' : 'bg-secondary-container shadow-secondary-container/25',
                    )}
                  >
                    Check listening
                  </button>
                  <button
                    onClick={() => setTranscriptUnlocked(true)}
                    disabled={!listeningChecked && !listeningResult}
                    className={cn(
                      'px-6 py-3.5 rounded-2xl font-bold',
                      !listeningChecked && !listeningResult
                        ? 'bg-outline/30 text-white'
                        : 'bg-surface-container-low text-on-surface',
                    )}
                  >
                    Unlock transcript
                  </button>
                </ActionRow>
                {listeningResult && (
                  <div className={`rounded-[1.5rem] p-5 border ${listeningResult.correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    <div className="font-bold">{listeningResult.correct ? 'Correct listening answer.' : 'Listen once more and compare the key detail.'}</div>
                    <div className="mt-2 text-sm">{listeningResult.feedback}</div>
                  </div>
                )}
                {transcriptUnlocked && (
                  <div className="rounded-[1.5rem] bg-primary/5 p-5 border border-primary/10">
                    <div className="text-sm font-black uppercase tracking-widest text-primary">Transcript</div>
                    <div className="mt-2 text-on-surface leading-7">{activeListeningLesson.transcript}</div>
                  </div>
                )}
                <div className="rounded-[1.5rem] bg-surface-container-low p-5 border border-outline-variant/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-black uppercase tracking-widest text-primary">Shadowing mode</div>
                      <div className="mt-2 text-sm text-on-surface-variant leading-6">
                        1. Listen once. 2. Unlock transcript. 3. Repeat the line 3 times with the same rhythm.
                      </div>
                    </div>
                    <div className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm font-black text-on-surface">
                      {shadowingRepetitions}/3 reps
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className={`rounded-[1.25rem] p-4 border ${listeningChecked ? 'bg-green-50 border-green-200 text-green-700' : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant'}`}>
                      Check the listening answer first.
                    </div>
                    <div className={`rounded-[1.25rem] p-4 border ${transcriptUnlocked ? 'bg-green-50 border-green-200 text-green-700' : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant'}`}>
                      Unlock the transcript for line-by-line imitation.
                    </div>
                    <div className={`rounded-[1.25rem] p-4 border ${shadowingRepetitions >= 3 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant'}`}>
                      Repeat until you reach 3 shadowing reps.
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => playPronunciation(activeListeningLesson.transcript, settings.preferredVoice, listeningRate)}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-primary text-white font-bold inline-flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      Shadowing replay
                    </button>
                    <button
                      onClick={() => setShadowingRepetitions((current) => Math.min(current + 1, 3))}
                      disabled={!transcriptUnlocked}
                      className={cn(
                        'w-full sm:w-auto px-5 py-3 rounded-2xl font-bold inline-flex items-center justify-center gap-2',
                        !transcriptUnlocked
                          ? 'bg-outline/30 text-white'
                          : 'bg-secondary-container text-white',
                      )}
                    >
                      Mark one rep done
                    </button>
                    <button
                      onClick={() => setShadowingRepetitions(0)}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-surface-container-lowest text-on-surface font-bold border border-outline-variant/10"
                    >
                      Reset reps
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'roleplay' && (
            <>
              <HeroCard
                title="Speaking roleplay"
                description="Practice real conversations from A0 to IELTS. Sora gives the next line, a correction when needed, and a clear coaching target."
                stats={[
                  { label: 'Unlocked', value: unlockedRoleplays.length },
                  { label: 'Level', value: activeRoleplay.level },
                  { label: 'Skill', value: activeRoleplay.targetSkill[settings.language] },
                ]}
              />
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-primary">{activeRoleplay.level} scene</div>
                    <h2 className="mt-2 text-2xl font-extrabold text-on-surface">
                      {activeRoleplay.title[settings.language]}
                    </h2>
                    <p className="mt-2 text-on-surface-variant">{activeRoleplay.situation[settings.language]}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-primary/5 border border-primary/10 px-4 py-3 text-sm text-on-surface-variant max-w-xs">
                    <div className="font-black uppercase tracking-widest text-primary text-xs">Goal</div>
                    <div className="mt-2">{activeRoleplay.successHint[settings.language]}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => playPronunciation(roleplayMessages[roleplayMessages.length - 1]?.speaker === 'ai' ? roleplayMessages[roleplayMessages.length - 1].text : activeRoleplay.aiOpener, settings.preferredVoice)}
                    className="px-5 py-3 rounded-2xl font-bold bg-primary text-white flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    Play AI line
                  </button>
                  <button
                    onClick={() => {
                      setRoleplayMessages([{ speaker: 'ai', text: activeRoleplay.aiOpener }]);
                      setRoleplayInput('');
                      setRoleplayTurn(0);
                      setRoleplayResult(null);
                    }}
                    className="px-5 py-3 rounded-2xl font-bold bg-surface-container-low text-on-surface flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Restart scene
                  </button>
                  <button
                    onClick={() =>
                      cycleItem(
                        selectedRoleplayId || activeRoleplay.id,
                        unlockedRoleplays,
                        setSelectedRoleplayId,
                        () => {
                          setRoleplayMessages([]);
                          setRoleplayInput('');
                          setRoleplayTurn(0);
                          setRoleplayResult(null);
                        },
                      )
                    }
                    className="px-5 py-3 rounded-2xl font-bold bg-surface-container-low text-on-surface flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Next scene
                  </button>
                </div>
                <div className="rounded-[1.5rem] bg-surface-container-low p-5 space-y-3">
                  {roleplayMessages.map((message, index) => (
                    <div
                      key={`${message.speaker}-${index}`}
                      className={cn(
                        'rounded-[1.25rem] p-4',
                        message.speaker === 'ai' && 'bg-primary/10 text-on-surface',
                        message.speaker === 'user' && 'bg-secondary-container text-white',
                        message.speaker === 'coach' && 'bg-amber-50 text-amber-800 border border-amber-200',
                      )}
                    >
                      <div className="text-[11px] font-black uppercase tracking-widest opacity-70">
                        {message.speaker === 'ai' ? 'Sora AI' : message.speaker === 'user' ? 'You' : 'Coach'}
                      </div>
                      <div className="mt-2 leading-7">{message.text}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-surface-container-low rounded-[1.5rem] p-5 space-y-4">
                  <div className="text-sm font-black uppercase tracking-widest text-primary">Your reply</div>
                  <textarea
                    value={roleplayInput}
                    onChange={(event) => setRoleplayInput(event.target.value)}
                    placeholder="Reply in English. Start simple, then add one reason or useful detail."
                    className="w-full min-h-[160px] rounded-[1.5rem] bg-surface-container-lowest border border-outline-variant/10 px-5 py-4 text-on-surface outline-none focus:ring-2 focus:ring-primary resize-y"
                  />
                  <ActionRow>
                    <button
                      onClick={() => void submitRoleplayTurn()}
                      disabled={!roleplayInput.trim()}
                      className={cn(
                        'px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg',
                        !roleplayInput.trim() ? 'bg-outline/50' : 'bg-secondary-container shadow-secondary-container/25',
                      )}
                    >
                      Send reply
                    </button>
                  </ActionRow>
                </div>
                {roleplayResult && (
                  <div className="bg-primary/5 rounded-[1.5rem] p-5 border border-primary/10 space-y-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <MetricCard label="Roleplay score" value={`${roleplayResult.score}%`} />
                      <MetricCard label="Turn" value={`${roleplayTurn}`} />
                      <MetricCard label="Status" value={roleplayResult.finished ? 'Complete' : 'Continue'} />
                    </div>
                    <InsightCard title="Coach note" text={roleplayResult.coachNote} />
                    {roleplayResult.correction && (
                      <InsightCard title="Correction" text={roleplayResult.correction} />
                    )}
                    <InsightCard title="Next target" text={roleplayResult.nextTarget} />
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'reading' && (
            <>
              <HeroCard
                title="Reading path"
                description="Start with short A0 texts, then move into main-idea reading, detail search, and stronger comprehension."
                stats={[
                  { label: 'Unlocked', value: unlockedReadings.length },
                  { label: 'Level', value: activeReading.level },
                  { label: 'Questions', value: activeReading.questions.length },
                ]}
              />
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-primary">
                      {activeReading.level} reading
                    </div>
                    <h2 className="mt-2 text-2xl font-extrabold text-on-surface">
                      {activeReading.title[settings.language]}
                    </h2>
                  </div>
                  <button
                    onClick={() => cycleItem(selectedReadingId || activeReading.id, unlockedReadings, setSelectedReadingId, resetReadingState)}
                    className="px-5 py-3 rounded-2xl font-bold bg-primary text-white flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Next passage
                  </button>
                </div>
                <div className="mt-5 rounded-[1.5rem] bg-surface-container-low p-5 text-on-surface leading-8">
                  {activeReading.passage}
                </div>
              </div>
              <div className="space-y-4">
                {activeReading.questions.map((question, index) => (
                  <div
                    key={`${activeReading.id}-${index}`}
                    className="bg-surface-container-lowest rounded-[1.75rem] p-5 border border-outline-variant/10 shadow-sm"
                  >
                    <div className="font-bold text-on-surface">{index + 1}. {question.question}</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {question.options.map((option) => {
                        const chosen = readingAnswers[index] === option;
                        const correct = question.answer === option;
                        return (
                          <button
                            key={option}
                            disabled={readingChecked}
                            onClick={() => setReadingAnswers((current) => ({ ...current, [index]: option }))}
                            className={cn(
                              'rounded-2xl border-2 p-4 text-left font-semibold transition-all',
                              !readingChecked && chosen && 'bg-primary text-white border-primary',
                              !readingChecked && !chosen && 'bg-surface-container-low border-outline-variant/15',
                              readingChecked && correct && 'bg-green-50 border-green-500 text-green-700',
                              readingChecked && !correct && chosen && 'bg-red-50 border-red-400 text-red-700',
                              readingChecked && !correct && !chosen && 'bg-surface-container-low border-outline-variant/15 opacity-70',
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {readingChecked && (
                      <div className="mt-4 rounded-[1.25rem] bg-primary/5 p-4 border border-primary/10 text-sm text-on-surface-variant">
                        {question.explanation[settings.language]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <ActionRow>
                <button
                  disabled={Object.keys(readingAnswers).length !== activeReading.questions.length || readingChecked}
                  onClick={submitReadingAnswers}
                  className={cn(
                    'px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg',
                    Object.keys(readingAnswers).length !== activeReading.questions.length || readingChecked
                      ? 'bg-outline/50'
                      : 'bg-secondary-container shadow-secondary-container/25',
                  )}
                >
                  Check answers
                </button>
                <button
                  onClick={() => cycleItem(selectedReadingId || activeReading.id, unlockedReadings, setSelectedReadingId, resetReadingState)}
                  className="px-6 py-3.5 rounded-2xl font-bold bg-primary text-white flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  New reading
                </button>
              </ActionRow>
              {readingChecked && (
                <div className="bg-surface-container-lowest rounded-[1.75rem] p-5 border border-outline-variant/10 shadow-sm">
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Reading result</div>
                  <div className="mt-2 text-3xl font-black text-on-surface">
                    {readingScore}/{activeReading.questions.length}
                  </div>
                  <div className="mt-2 text-on-surface-variant">
                    {readingScore === activeReading.questions.length
                      ? 'Strong result. Move forward or try the next reading.'
                      : 'Review the explanations and try another passage at the same level before moving up.'}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'writing' && (
            <>
              <HeroCard
                title="Writing and essay lab"
                description="Begin with simple sentences, then move to paragraphs, opinion writing, and IELTS-style essays."
                stats={[
                  { label: 'Unlocked', value: unlockedPrompts.length },
                  { label: 'Level', value: activeWritingPrompt.level },
                  { label: 'Min words', value: activeWritingPrompt.minimumWords },
                ]}
              />
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-primary">
                      {activeWritingPrompt.level} writing
                    </div>
                    <h2 className="mt-2 text-2xl font-extrabold text-on-surface">
                      {activeWritingPrompt.title[settings.language]}
                    </h2>
                  </div>
                  <button
                    onClick={() =>
                      cycleItem(
                        selectedWritingId || activeWritingPrompt.id,
                        unlockedPrompts,
                        setSelectedWritingId,
                        () => {
                          setWritingText('');
                          setWritingEvaluation(null);
                        },
                      )
                    }
                    className="px-5 py-3 rounded-2xl font-bold bg-primary text-white flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New prompt
                  </button>
                </div>
                <p className="mt-4 text-on-surface-variant leading-7">
                  {activeWritingPrompt.instructions[settings.language]}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeWritingPrompt.outlineTips.map((tip) => (
                    <div key={tip} className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-black uppercase tracking-widest text-primary">Draft</div>
                  <div className="text-sm font-semibold text-on-surface-variant">
                    Words: {writingText.trim() ? writingText.trim().split(/\s+/).filter(Boolean).length : 0} / {activeWritingPrompt.minimumWords}
                  </div>
                </div>
                <textarea
                  value={writingText}
                  onChange={(event) => setWritingText(event.target.value)}
                  placeholder="Write here. Start simple, then add one reason, one detail, or one example."
                  className="w-full min-h-[260px] rounded-[1.5rem] bg-surface-container-low border border-outline-variant/10 px-5 py-4 text-on-surface outline-none focus:ring-2 focus:ring-primary resize-y"
                />
                <ActionRow>
                  <button
                    onClick={submitWriting}
                    disabled={!writingText.trim() || isSubmittingWriting}
                    className={cn(
                      'px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg',
                      !writingText.trim() || isSubmittingWriting
                        ? 'bg-outline/50'
                        : 'bg-secondary-container shadow-secondary-container/25',
                    )}
                  >
                    {isSubmittingWriting ? 'Checking...' : 'Check writing'}
                  </button>
                  <button
                    onClick={() => {
                      setWritingText('');
                      setWritingEvaluation(null);
                    }}
                    className="px-6 py-3.5 rounded-2xl font-bold bg-surface-container-low text-on-surface"
                  >
                    Clear draft
                  </button>
                </ActionRow>
              </div>
              {writingEvaluation && (
                <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-5">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <MetricCard label="Score" value={`${writingEvaluation.score}%`} />
                    <MetricCard label="Words" value={`${writingEvaluation.wordCount}`} />
                    <MetricCard label="Band" value={writingEvaluation.bandEstimate} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FeedbackList title="Strengths" items={writingEvaluation.strengths} accent="green" />
                    <FeedbackList title="What to fix" items={writingEvaluation.feedback} accent="amber" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-surface-container-low p-5 border border-outline-variant/10">
                      <div className="text-sm font-black uppercase tracking-widest text-primary">Corrected version</div>
                      <div className="mt-3 text-on-surface leading-7 whitespace-pre-wrap">
                        {writingEvaluation.correctedSample}
                      </div>
                    </div>
                    <div className="rounded-[1.5rem] bg-surface-container-low p-5 border border-outline-variant/10">
                      <div className="text-sm font-black uppercase tracking-widest text-primary">Stronger rewrite</div>
                      <div className="mt-3 text-on-surface leading-7 whitespace-pre-wrap">
                        {writingEvaluation.strongerRewrite}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] bg-primary/5 p-5 border border-primary/10">
                    <div className="text-sm font-black uppercase tracking-widest text-primary">Next task</div>
                    <div className="mt-2 text-on-surface">{writingEvaluation.nextTask}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'mock' && (
            <>
              <HeroCard
                title={activeMock.title[settings.language]}
                description="Timed mixed exam with listening, reading, writing, and speaking. The result gives a local readiness score and band prediction."
                stats={[
                  { label: 'Type', value: activeMock.kind },
                  { label: 'Level', value: activeMock.level },
                  { label: 'Time', value: `${Math.floor(mockTimeLeft / 60)}:${String(mockTimeLeft % 60).padStart(2, '0')}` },
                ]}
              />
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-6">
                <ActionRow>
                  <button
                    onClick={() => {
                      setMockStarted(true);
                      setMockTimeLeft(activeMock.durationMinutes * 60);
                    }}
                    className="px-6 py-3.5 rounded-2xl font-bold bg-primary text-white"
                  >
                    {mockStarted ? 'Mock is running' : 'Start mock'}
                  </button>
                  <div className="px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface font-bold">
                    {Math.floor(mockTimeLeft / 60)}:{String(mockTimeLeft % 60).padStart(2, '0')}
                  </div>
                </ActionRow>

                <div className="rounded-[1.5rem] bg-surface-container-low p-5 space-y-4">
                  <div className="font-black text-primary uppercase tracking-widest text-xs">Listening</div>
                  <div className="font-bold text-on-surface">{activeMock.listening.question}</div>
                  <button
                    onClick={() => playPronunciation(activeMock.listening.transcript, settings.preferredVoice, 1)}
                    className="px-4 py-2 rounded-xl bg-primary text-white font-bold inline-flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    Play
                  </button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeMock.listening.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setMockListeningAnswer(option)}
                        className={cn(
                          'rounded-2xl border-2 p-4 text-left font-semibold transition-all',
                          mockListeningAnswer === option
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface-container-lowest border-outline-variant/15',
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-surface-container-low p-5 space-y-4">
                  <div className="font-black text-primary uppercase tracking-widest text-xs">Reading</div>
                  <div className="text-on-surface-variant">{activeMockReading.passage}</div>
                  {activeMockReading.questions.map((question, index) => (
                    <div key={`${activeMockReading.id}-${index}`} className="space-y-3">
                      <div className="font-bold text-on-surface">{index + 1}. {question.question}</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {question.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => setMockReadingAnswers((current) => ({ ...current, [index]: option }))}
                            className={cn(
                              'rounded-2xl border-2 p-4 text-left font-semibold transition-all',
                              mockReadingAnswers[index] === option
                                ? 'bg-primary text-white border-primary'
                                : 'bg-surface-container-lowest border-outline-variant/15',
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.5rem] bg-surface-container-low p-5 space-y-4">
                  <div className="font-black text-primary uppercase tracking-widest text-xs">Writing</div>
                  <div className="font-bold text-on-surface">{activeMockWritingPrompt.title[settings.language]}</div>
                  <div className="text-on-surface-variant">{activeMockWritingPrompt.instructions[settings.language]}</div>
                  <textarea
                    value={mockWritingText}
                    onChange={(event) => setMockWritingText(event.target.value)}
                    className="w-full min-h-[180px] rounded-[1.5rem] bg-surface-container-lowest border border-outline-variant/10 px-5 py-4 text-on-surface outline-none focus:ring-2 focus:ring-primary resize-y"
                  />
                </div>

                <div className="rounded-[1.5rem] bg-surface-container-low p-5 space-y-4">
                  <div className="font-black text-primary uppercase tracking-widest text-xs">Speaking</div>
                  <div className="font-bold text-on-surface">{activeMock.speakingPrompt[settings.language]}</div>
                  <textarea
                    value={mockSpeakingText}
                    onChange={(event) => setMockSpeakingText(event.target.value)}
                    placeholder="Type what you would say in the speaking exam."
                    className="w-full min-h-[140px] rounded-[1.5rem] bg-surface-container-lowest border border-outline-variant/10 px-5 py-4 text-on-surface outline-none focus:ring-2 focus:ring-primary resize-y"
                  />
                </div>

                <ActionRow>
                  <button
                    onClick={() => void submitMockExam()}
                    disabled={!mockListeningAnswer || !mockWritingText.trim() || !mockSpeakingText.trim() || Object.keys(mockReadingAnswers).length !== activeMockReading.questions.length}
                    className={cn(
                      'px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg',
                      !mockListeningAnswer || !mockWritingText.trim() || !mockSpeakingText.trim() || Object.keys(mockReadingAnswers).length !== activeMockReading.questions.length
                        ? 'bg-outline/50'
                        : 'bg-secondary-container shadow-secondary-container/25',
                    )}
                  >
                    Finish mock
                  </button>
                </ActionRow>

                {mockResult && (
                  <div className="bg-primary/5 rounded-[1.5rem] p-5 border border-primary/10 space-y-4">
                    <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-3">
                      <MetricCard label="Score" value={`${mockResult.score}%`} />
                      <MetricCard label="Band" value={`${mockResult.band}`} />
                      <MetricCard label="Listening" value={`${mockResult.sectionScores.listening}%`} />
                      <MetricCard label="Reading" value={`${mockResult.sectionScores.reading}%`} />
                      <MetricCard label="Writing" value={`${mockResult.sectionScores.writing}%`} />
                      <MetricCard label="Speaking" value={`${mockResult.sectionScores.speaking}%`} />
                    </div>
                    <div className="text-on-surface-variant">
                      This is a local readiness estimate. Official IELTS band only comes from the real exam, but this gives the learner a practical target.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="space-y-6">
          <HeroCard
            title="Pronunciation lab"
            description={t({
              uz: 'Bu yerda faqat score emas: aniq fonetik xato, intonatsiya, ritm va waveform ustida xato xaritasi chiqadi.',
              en: 'You get more than a score: phonetic errors, intonation, rhythm, and a waveform mistake map.',
              ru: 'Здесь не только балл: фонетика, интонация, ритм и карта ошибок на waveform.',
            })}
            stats={[
              { label: 'Voice', value: settings.preferredVoice },
              { label: 'Target', value: pronunciationTarget ? 'Ready' : '...' },
              { label: 'Feedback', value: pronunciationFeedback ? 'Ready' : 'Wait' },
            ]}
          />
          <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm space-y-5">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-primary">Reference line</div>
              <p className="mt-2 text-xl font-bold text-on-surface">{pronunciationTarget}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  setIsPlayingReference(true);
                  await playPronunciation(pronunciationTarget, settings.preferredVoice);
                  setIsPlayingReference(false);
                }}
                className="px-5 py-3 rounded-2xl font-bold bg-primary/10 text-primary flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                {isPlayingReference ? t({ uz: 'Eshitilmoqda...', en: 'Playing...', ru: 'Воспроизведение...' }) : t({ uz: 'Reference ni tinglash', en: 'Play reference', ru: 'Прослушать эталон' })}
              </button>
              <button onClick={startRecording} disabled={isRecording} className={cn('px-5 py-3 rounded-2xl font-bold text-white flex items-center gap-2', isRecording ? 'bg-red-500 animate-pulse' : 'bg-secondary-container')}>
                <Mic className="w-4 h-4" />
                {isRecording ? t({ uz: 'Gapiring...', en: 'Speak now...', ru: 'Говорите...' }) : t({ uz: 'Mikrofonni boshlash', en: 'Start recording', ru: 'Начать запись' })}
              </button>
              <button onClick={() => loadPronunciationTarget(currentWord || selectedTopicId)} className="px-5 py-3 rounded-2xl font-bold bg-surface-container-low text-on-surface flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {t({ uz: 'Target ni yangilash', en: 'Refresh target', ru: 'Обновить цель' })}
              </button>
            </div>
            {pronunciationTranscript && (
              <div className="bg-surface-container-low rounded-[1.5rem] p-4">
                <div className="text-xs font-black uppercase tracking-widest text-on-surface-variant">{t({ uz: 'Sizning javobingiz', en: 'Your transcript', ru: 'Ваш текст' })}</div>
                <p className="mt-2 text-on-surface font-medium">{pronunciationTranscript}</p>
              </div>
            )}
            {pronunciationFeedback ? (
              <>
                <div className="grid sm:grid-cols-3 gap-4">
                  <MetricCard label="Overall score" value={`${pronunciationFeedback.score}%`} />
                  <MetricCard label="Intonation" value={`${pronunciationFeedback.intonation.score}%`} />
                  <MetricCard label="Rhythm" value={`${pronunciationFeedback.rhythm.score}%`} />
                </div>
                <div className="bg-primary/5 rounded-[1.5rem] p-5 border border-primary/10">
                  <div className="font-bold text-on-surface">{pronunciationFeedback.summary}</div>
                  <div className="mt-3 text-sm text-on-surface-variant">{pronunciationFeedback.grammarFeedback}</div>
                </div>
                <div className="bg-surface-container-low rounded-[1.5rem] p-5">
                  <div className="text-sm font-black uppercase tracking-widest text-primary">Waveform mistake map</div>
                  <FeedbackWaveform feedback={pronunciationFeedback} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <InsightCard title="Intonation" text={pronunciationFeedback.intonation.feedback} />
                  <InsightCard title="Rhythm" text={pronunciationFeedback.rhythm.feedback} />
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-black uppercase tracking-widest text-primary">Specific phonetic errors</div>
                  {pronunciationFeedback.phoneticErrors.length === 0 ? (
                    <div className="bg-green-50 text-green-700 rounded-[1.25rem] p-4 font-medium">
                      {t({ uz: 'Aniq fonetik xato topilmadi. Endi tabiiy tezlikni oshiring.', en: 'No major phonetic errors found. Now increase natural speed.', ru: 'Серьезных фонетических ошибок не найдено. Теперь поработайте над естественной скоростью.' })}
                    </div>
                  ) : (
                    pronunciationFeedback.phoneticErrors.map((error, index) => (
                      <div key={`${error.word}-${index}`} className="bg-surface-container-low rounded-[1.25rem] p-4 border border-outline-variant/10">
                        <div className="font-bold text-on-surface">{error.word} <span className="text-xs uppercase tracking-widest text-on-surface-variant">({error.severity})</span></div>
                        <div className="text-sm text-on-surface-variant mt-1">Expected: {error.expected} • Heard: {error.heard}</div>
                        <div className="text-sm text-on-surface mt-2">{error.issue}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="bg-surface-container-low rounded-[1.5rem] p-5 text-on-surface-variant">
                {t({
                  uz: 'Reference line ni tinglang, keyin mikrofon orqali ayting. Feedback fonetik xato, intonatsiya va ritm bo‘yicha ajratib chiqadi.',
                  en: 'Listen to the reference line, then say it into the microphone. Feedback is split into phonetic errors, intonation, and rhythm.',
                  ru: 'Прослушайте эталонную фразу, затем произнесите ее в микрофон. Обратная связь делится на фонетику, интонацию и ритм.',
                })}
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-primary">Level path</div>
            <h3 className="mt-2 text-xl font-extrabold text-on-surface">A0 to IELTS</h3>
            <div className="mt-4 space-y-3">
              {levelStages.map((level, index) => {
                const active = level === user.level;
                const done = levelRank(level) < levelRank(user.level);
                return (
                  <div
                    key={level}
                    className={cn(
                      'rounded-[1.25rem] border p-4 flex items-center justify-between gap-3',
                      active && 'border-primary bg-primary/5',
                      done && 'border-green-200 bg-green-50',
                      !active && !done && 'border-outline-variant/10 bg-surface-container-low',
                    )}
                  >
                    <div>
                      <div className="font-bold text-on-surface">{level}</div>
                      <div className="text-sm text-on-surface-variant">
                        {index === 0 && 'First words and first sentences'}
                        {index === 1 && 'Daily English and basic questions'}
                        {index === 2 && 'Controlled grammar and short paragraphs'}
                        {index === 3 && 'Opinion speaking and reading for meaning'}
                        {index === 4 && 'Essay planning and wider vocabulary'}
                        {index === 5 && 'IELTS style speaking and writing'}
                        {index === 6 && 'Timed mock exams, band prediction, and exam strategy'}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-xs font-black',
                        active && 'bg-primary text-white',
                        done && 'bg-green-500 text-white',
                        !active && !done && 'bg-surface-container-high text-on-surface-variant',
                      )}
                    >
                      {done ? 'OK' : level}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-primary">Coach notes</div>
            <div className="mt-4 space-y-3">
              <CoachPoint title="Reading" text="Scan the question first, then search the text for the detail." />
              <CoachPoint title="Writing" text="Start simple. Then add one reason and one example before you submit." />
              <CoachPoint title="Grammar" text={`Suggested repair topic: ${stats.suggestedTopic.label[settings.language]}`} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-primary">Recent writing</div>
            <div className="mt-4 space-y-3">
              {stats.recentWriting.length === 0 ? (
                <div className="text-sm text-on-surface-variant">Checked drafts will appear here.</div>
              ) : (
                stats.recentWriting.map((entry) => (
                  <div key={entry.id} className="rounded-[1.25rem] bg-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-on-surface">{entry.title}</div>
                      <div className="text-sm font-black text-primary">{entry.score}%</div>
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">{entry.level}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <nav className="bottom-safe-nav fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 sm:px-4 pt-3 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(25,27,35,0.06)] rounded-t-[2.5rem] border-t border-outline-variant/10">
        <NavItem icon={<Home className="w-6 h-6" />} label={t({ uz: 'Asosiy', en: 'Home', ru: 'Главная' })} onClick={() => navigate('/dashboard')} />
        <NavItem icon={<BookOpen className="w-6 h-6" />} label={t({ uz: 'Darslar', en: 'Lessons', ru: 'Уроки' })} onClick={() => navigate('/lessons')} />
        <NavItem icon={<Dumbbell className="w-6 h-6" />} label={t({ uz: 'Mashqlar', en: 'Practice', ru: 'Практика' })} active onClick={() => navigate('/practice')} />
        <NavItem icon={<User className="w-6 h-6" />} label={t({ uz: 'Profil', en: 'Profile', ru: 'Профиль' })} onClick={() => navigate('/profile')} />
      </nav>
    </div>
  );
}

function HeroCard({
  title,
  description,
  stats,
}: {
  title: string;
  description: string;
  stats: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="rounded-[2rem] p-5 sm:p-6 bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-widest opacity-80">Sora AI</div>
          <h2 className="mt-2 text-2xl font-extrabold">{title}</h2>
          <p className="mt-3 text-white/85 max-w-2xl">{description}</p>
        </div>
        <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center">
          <Sparkles className="w-7 h-7" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white/10 p-4">
            <div className="text-xs uppercase tracking-widest font-black text-white/70">{stat.label}</div>
            <div className="mt-2 text-xl font-black break-words">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={cn('shrink-0 whitespace-nowrap px-3 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all', active ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant')}>
      {label}
    </button>
  );
}

function FormatChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all', active ? 'bg-secondary-container text-white' : 'bg-surface-container-low text-on-surface-variant')}>
      {label}
    </button>
  );
}

function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-12 border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-on-surface-variant font-bold">{text}</p>
    </div>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">{children}</div>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-[1.25rem] p-4 border border-outline-variant/10">
      <div className="text-xs uppercase tracking-widest font-black text-primary">{label}</div>
      <div className="mt-2 text-2xl font-black text-on-surface">{value}</div>
    </div>
  );
}

function InsightCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-surface-container-low rounded-[1.25rem] p-5 border border-outline-variant/10">
      <div className="text-sm font-black uppercase tracking-widest text-primary">{title}</div>
      <div className="mt-2 text-sm text-on-surface-variant">{text}</div>
    </div>
  );
}

function CoachPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.25rem] bg-surface-container-low p-4">
      <div className="font-bold text-on-surface">{title}</div>
      <div className="mt-1 text-sm text-on-surface-variant">{text}</div>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: 'green' | 'amber';
}) {
  const isGreen = accent === 'green';
  return (
    <div className={cn('rounded-[1.5rem] p-5 border', isGreen ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200')}>
      <div className={cn('text-sm font-black uppercase tracking-widest', isGreen ? 'text-green-700' : 'text-amber-700')}>
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-on-surface-variant">No notes yet.</div>
        ) : (
          items.map((item) => (
            <div key={item} className="text-sm text-on-surface-variant">
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExercisePanel({
  exercise,
  selected,
  setSelected,
  fillValue,
  setFillValue,
  matchedPairs,
  setMatchedPairs,
  matchingSelection,
  setMatchingSelection,
  scrambledOrder,
  setScrambledOrder,
  isChecked,
  onPronounce,
}: {
  exercise: Exercise;
  selected: number | null;
  setSelected: (value: number | null) => void;
  fillValue: string;
  setFillValue: (value: string) => void;
  matchedPairs: string[];
  setMatchedPairs: React.Dispatch<React.SetStateAction<string[]>>;
  matchingSelection: string | null;
  setMatchingSelection: (value: string | null) => void;
  scrambledOrder: Array<{ id: string; text: string }>;
  setScrambledOrder: React.Dispatch<React.SetStateAction<Array<{ id: string; text: string }>>>;
  isChecked: boolean;
  onPronounce: () => void;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-outline-variant/10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-primary">{exercise.type}</div>
          {exercise.word && <h2 className="mt-2 text-3xl font-extrabold text-on-surface">{exercise.word}</h2>}
          {exercise.phonetic && <div className="text-primary font-bold mt-2">{exercise.phonetic}</div>}
        </div>
        {(exercise.word || exercise.correctSentence || exercise.correctWord) && (
          <button onClick={onPronounce} className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/15">
            <Volume2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {(exercise.type === 'multiple-choice' || exercise.type === 'vocabulary-identification') && (
        <div className="space-y-4">
          {exercise.sentence && <p className="text-on-surface-variant text-lg italic">{exercise.sentence}</p>}
          {exercise.definition && <p className="text-on-surface-variant text-lg italic">{exercise.definition}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            {exercise.options?.map((option) => (
              <button
                key={option.id}
                disabled={isChecked}
                onClick={() => setSelected(option.id)}
                className={cn('p-5 rounded-2xl font-bold border-2 text-left transition-all flex items-center justify-between group', selected === option.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-low border-outline-variant/15 hover:border-primary/40')}
              >
                <span>{option.label}</span>
                <ChevronRight className={cn('w-5 h-5 transition-transform', selected === option.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100')} />
              </button>
            ))}
          </div>
        </div>
      )}

      {exercise.type === 'fill-in-the-blanks' && (
        <div className="space-y-6">
          <p className="text-2xl font-bold text-on-surface leading-relaxed">
            {exercise.sentence?.split('______').map((part, index, array) => (
              <React.Fragment key={index}>
                {part}
                {index < array.length - 1 && <span className={cn('inline-block min-w-[120px] border-b-4 mx-2 text-primary', fillValue ? 'border-primary' : 'border-outline-variant')}>{fillValue || '...'}</span>}
              </React.Fragment>
            ))}
          </p>
          <div className="flex flex-wrap gap-3">
            {exercise.wordBank?.map((word) => (
              <button key={word} disabled={isChecked} onClick={() => setFillValue(word)} className={cn('px-5 py-3 rounded-xl font-bold border-2 transition-all', fillValue === word ? 'bg-primary text-white border-primary' : 'bg-surface-container-low border-outline-variant/15')}>
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {(exercise.type === 'sentence-builder' || exercise.type === 'sentence-unscrambling') && (
        <Reorder.Group axis="x" values={scrambledOrder} onReorder={setScrambledOrder} className="min-h-[100px] p-6 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant flex flex-wrap gap-3 items-center">
          {scrambledOrder.map((item) => (
            <Reorder.Item key={item.id} value={item} drag={!isChecked} className={cn('px-5 py-3 bg-white rounded-xl shadow-sm border border-outline-variant/20 font-bold text-on-surface', !isChecked ? 'cursor-grab' : 'opacity-50 cursor-not-allowed')}>
              {item.text}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {exercise.type === 'matching' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            {exercise.pairs?.map((pair) => (
              <button key={pair.english} disabled={isChecked || matchedPairs.includes(pair.english)} onClick={() => setMatchingSelection(pair.english)} className={cn('w-full p-4 rounded-xl font-bold border-2 transition-all text-left', matchedPairs.includes(pair.english) ? 'bg-green-100 border-green-500 text-green-700 opacity-50' : matchingSelection === pair.english ? 'bg-primary text-white border-primary' : 'bg-surface-container-low border-outline-variant/20')}>
                {pair.english}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {exercise.pairs?.map((pair) => (
              <button
                key={pair.english + pair.uzbek}
                disabled={isChecked || matchedPairs.some((english) => exercise.pairs?.find((entry) => entry.english === english)?.uzbek === pair.uzbek)}
                onClick={() => {
                  if (!matchingSelection) return;
                  const selectedPair = exercise.pairs?.find((entry) => entry.english === matchingSelection);
                  if (selectedPair?.uzbek === pair.uzbek) setMatchedPairs((current) => (current.includes(matchingSelection) ? current : [...current, matchingSelection]));
                  setMatchingSelection(null);
                }}
                className="w-full p-4 rounded-xl font-bold border-2 transition-all text-left bg-surface-container-low border-outline-variant/20"
              >
                {pair.uzbek}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface-container-low rounded-[1.5rem] p-5 border-l-4 border-secondary-container">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-secondary-container mt-0.5" />
          <div>
            <div className="font-bold text-on-surface">Tip</div>
            <div className="text-sm text-on-surface-variant mt-1">{exercise.tip}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackWaveform({ feedback }: { feedback: PronunciationFeedback }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-end gap-2 h-32">
        {feedback.waveform.map((segment, index) => {
          const height = segment.severity === 'good' ? 42 : segment.severity === 'warn' ? 78 : 110;
          return (
            <motion.div
              key={`${segment.label}-${index}`}
              initial={{ height: 10, opacity: 0.6 }}
              animate={{ height, opacity: 1 }}
              className={cn('flex-1 rounded-t-2xl rounded-b-md', segment.severity === 'good' ? 'bg-green-400/80' : segment.severity === 'warn' ? 'bg-yellow-400/80' : 'bg-red-400/80')}
              title={`${segment.label}: ${segment.note}`}
            />
          );
        })}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {feedback.waveform.map((segment, index) => (
          <div key={`${segment.label}-note-${index}`} className="rounded-xl bg-surface-container-lowest p-3 border border-outline-variant/10">
            <div className="font-bold text-on-surface">{segment.label}</div>
            <div className="text-sm text-on-surface-variant mt-1">{segment.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={cn('flex min-w-[68px] flex-col items-center justify-center px-3 py-2 transition-all duration-150 ease-out', active ? 'bg-secondary-container text-white rounded-full scale-105' : 'text-on-surface opacity-50 hover:scale-105')}>
      {icon}
      <span className="text-[11px] font-medium tracking-wide mt-1 whitespace-nowrap">{label}</span>
    </button>
  );
}
