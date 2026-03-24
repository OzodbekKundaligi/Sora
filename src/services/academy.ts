import { lessons, readingPassages, writingPrompts } from '../lib/courseData';
import { grammarTopics, vocabularyBank } from '../lib/courseData';
import type { LocalizedText } from '../lib/i18n';
import { getCompletedLessonCount, getLearnedWordCount, getUserData } from '../lib/localData';
import { getRoleplayScenarioForLevel } from './sora-ai';

export interface ListeningLesson {
  id: string;
  level: string;
  title: LocalizedText;
  transcript: string;
  focus: LocalizedText;
  speeds: Array<'slow' | 'normal' | 'fast'>;
  question: string;
  options: string[];
  answer: string;
  explanation: LocalizedText;
}

export interface DailyPlanItem {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  route: '/lessons' | '/practice' | '/chat';
  routeState?: Record<string, unknown>;
}

export interface WeeklyReport {
  studyDays: number;
  lessonsCompleted: number;
  writingsCompleted: number;
  listeningCompleted: number;
  mocksCompleted: number;
}

export interface CertificateStatus {
  title: LocalizedText;
  ready: boolean;
  requirements: Array<{
    label: LocalizedText;
    complete: boolean;
  }>;
}

export interface MockExam {
  id: string;
  title: LocalizedText;
  kind: 'foundation' | 'ielts';
  level: string;
  durationMinutes: number;
  listening: ListeningLesson;
  readingPassageId: string;
  speakingPrompt: LocalizedText;
  writingPromptId: string;
}

const levelOrder = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'IELTS'] as const;

const listeningLessons: ListeningLesson[] = [
  {
    id: 'listening-a0-classroom',
    level: 'A0',
    title: {
      uz: 'Birinchi classroom audio',
      en: 'First Classroom Audio',
      ru: 'First Classroom Audio',
    },
    transcript: 'Hello. My name is Sara. I am in class one. I have a book and a pen.',
    focus: {
      uz: 'Ism, sinf va oddiy buyumlar',
      en: 'Name, class, and basic objects',
      ru: 'Name, class, and basic objects',
    },
    speeds: ['slow', 'normal', 'fast'],
    question: 'What does Sara have?',
    options: ['A book and a pen', 'A phone and a bag', 'A notebook and tea', 'A map and a ticket'],
    answer: 'A book and a pen',
    explanation: {
      uz: 'Audio ichida Sara book va pen borligini aytadi.',
      en: 'The audio says Sara has a book and a pen.',
      ru: 'The audio says Sara has a book and a pen.',
    },
  },
  {
    id: 'listening-a1-routine',
    level: 'A1',
    title: {
      uz: 'Kundalik odat audio',
      en: 'Daily Routine Audio',
      ru: 'Daily Routine Audio',
    },
    transcript: 'I wake up at seven, drink tea, and walk to work. In the evening, I study English for thirty minutes.',
    focus: {
      uz: 'Routine va vaqt ifodalari',
      en: 'Routine and time markers',
      ru: 'Routine and time markers',
    },
    speeds: ['slow', 'normal', 'fast'],
    question: 'What does the speaker do in the evening?',
    options: ['Walk to work', 'Drink tea', 'Study English', 'Cook dinner'],
    answer: 'Study English',
    explanation: {
      uz: 'Evening qismida u English study qilishini aytadi.',
      en: 'The speaker says they study English in the evening.',
      ru: 'The speaker says they study English in the evening.',
    },
  },
  {
    id: 'listening-a2-library',
    level: 'A2',
    title: {
      uz: 'Kutubxona announcement',
      en: 'Library Announcement',
      ru: 'Library Announcement',
    },
    transcript: 'Attention students. The library closes at six today. The quiet study room is open until five thirty, and group desks must be booked online.',
    focus: {
      uz: 'Announcement va detail topish',
      en: 'Announcements and listening for detail',
      ru: 'Announcements and listening for detail',
    },
    speeds: ['slow', 'normal', 'fast'],
    question: 'How should group desks be reserved?',
    options: ['By phone', 'Online', 'At the door', 'By email tomorrow'],
    answer: 'Online',
    explanation: {
      uz: 'Audio group desks online booked bo‘lishini aytadi.',
      en: 'The announcement says group desks must be booked online.',
      ru: 'The announcement says group desks must be booked online.',
    },
  },
  {
    id: 'listening-b1-travel',
    level: 'B1',
    title: {
      uz: 'Airport delay update',
      en: 'Airport Delay Update',
      ru: 'Airport Delay Update',
    },
    transcript: 'Passengers for flight 214 should go to gate nine. The flight has been delayed by forty minutes because of heavy rain, but boarding will begin shortly.',
    focus: {
      uz: 'Travel update va sabab',
      en: 'Travel updates and reasons',
      ru: 'Travel updates and reasons',
    },
    speeds: ['slow', 'normal', 'fast'],
    question: 'Why is the flight delayed?',
    options: ['A technical problem', 'Heavy rain', 'Late passengers', 'No gate is available'],
    answer: 'Heavy rain',
    explanation: {
      uz: 'Audio delay sababi heavy rain ekanini aytadi.',
      en: 'The update says the delay is because of heavy rain.',
      ru: 'The update says the delay is because of heavy rain.',
    },
  },
  {
    id: 'listening-b2-education',
    level: 'B2',
    title: {
      uz: 'Education podcast clip',
      en: 'Education Podcast Clip',
      ru: 'Education Podcast Clip',
    },
    transcript: 'Online education improves access, but access alone is not enough. Learners still need structure, feedback, and regular practice if they want to build long-term skills.',
    focus: {
      uz: 'Main idea va supporting detail',
      en: 'Main idea and supporting details',
      ru: 'Main idea and supporting details',
    },
    speeds: ['slow', 'normal', 'fast'],
    question: 'What is the speaker’s main point?',
    options: [
      'Access solves every problem',
      'Feedback is unnecessary',
      'Access helps, but support is still needed',
      'Online education should be banned',
    ],
    answer: 'Access helps, but support is still needed',
    explanation: {
      uz: 'Asosiy fikr: access foydali, lekin structure va feedback ham kerak.',
      en: 'The main point is that access helps, but structure and feedback are still necessary.',
      ru: 'The main point is that access helps, but structure and feedback are still necessary.',
    },
  },
  {
    id: 'listening-c1-policy',
    level: 'C1',
    title: {
      uz: 'Policy discussion',
      en: 'Policy Discussion',
      ru: 'Policy Discussion',
    },
    transcript: 'Although the proposal seems efficient in the short term, it may create deeper inequality over time unless policymakers address access, funding, and teacher training at the same time.',
    focus: {
      uz: 'Murakkab argument va nuance',
      en: 'Complex argument and nuance',
      ru: 'Complex argument and nuance',
    },
    speeds: ['slow', 'normal', 'fast'],
    question: 'What is the warning in the discussion?',
    options: [
      'The proposal is too expensive immediately',
      'The proposal may create inequality later',
      'Teacher training is already perfect',
      'Access is no longer important',
    ],
    answer: 'The proposal may create inequality later',
    explanation: {
      uz: 'Audio long term inequality xavfini aytyapti.',
      en: 'The speaker warns that the proposal may create inequality over time.',
      ru: 'The speaker warns that the proposal may create inequality over time.',
    },
  },
];

levelOrder.forEach((level, levelIndex) => {
  for (let index = 1; index <= 36; index += 1) {
    const vocab = vocabularyBank[(levelIndex * 12 + index) % vocabularyBank.length];
    const grammar = grammarTopics[(levelIndex * 12 + index) % grammarTopics.length];
    listeningLessons.push({
      id: `generated-listening-${level.toLowerCase()}-${index}`,
      level,
      title: {
        uz: `${level} listening ${index}`,
        en: `${level} listening ${index}`,
        ru: `${level} listening ${index}`,
      },
      transcript: `This is ${level} listening drill ${index}. We are practicing the word ${vocab.word}. Remember this grammar point: ${grammar.example}`,
      focus: {
        uz: `${vocab.word} va ${grammar.label.uz}`,
        en: `${vocab.word} and ${grammar.label.en}`,
        ru: `${vocab.word} and ${grammar.label.en}`,
      },
      speeds: ['slow', 'normal', 'fast'],
      question: `Which target word appears in this listening drill?`,
      options: [
        vocab.word,
        vocabularyBank[(levelIndex * 12 + index + 3) % vocabularyBank.length].word,
        vocabularyBank[(levelIndex * 12 + index + 6) % vocabularyBank.length].word,
        vocabularyBank[(levelIndex * 12 + index + 9) % vocabularyBank.length].word,
      ],
      answer: vocab.word,
      explanation: {
        uz: `Tinglov ichida asosiy tayanch so'z ${vocab.word} edi.`,
        en: `The target support word in the listening drill was ${vocab.word}.`,
        ru: `The target support word in the listening drill was ${vocab.word}.`,
      },
    });
  }
});

function levelRank(level = 'A0') {
  const index = levelOrder.indexOf(level as (typeof levelOrder)[number]);
  return index === -1 ? 0 : index;
}

function pickForLevel<T extends { id: string; level: string }>(items: T[], level = 'A0', preferredId?: string) {
  if (preferredId) {
    const found = items.find((item) => item.id === preferredId);
    if (found) {
      return found;
    }
  }

  const allowed = items.filter((item) => levelRank(item.level) <= levelRank(level));
  return allowed[allowed.length - 1] || items[0];
}

export function getLevelRoadmap() {
  return [
    { level: 'A0', focus: 'First words, sounds, and very short sentences.' },
    { level: 'A1', focus: 'Daily communication and basic questions.' },
    { level: 'A2', focus: 'Routine English, short reading, and controlled writing.' },
    { level: 'B1', focus: 'Paragraphs, roleplay, opinions, and longer answers.' },
    { level: 'B2', focus: 'Essay building, detailed listening, and structured speaking.' },
    { level: 'C1', focus: 'Advanced accuracy, IELTS-style tasks, and formal expression.' },
    { level: 'IELTS', focus: 'Timed mock exams, band prediction, and exam strategy.' },
  ];
}

export function getListeningLessonForLevel(level = 'A0', lessonId?: string) {
  return pickForLevel(listeningLessons, level, lessonId);
}

export function getListeningLessonsForLevel(level = 'A0') {
  return listeningLessons.filter((entry) => levelRank(entry.level) <= levelRank(level));
}

export function evaluateListeningAnswer(lesson: ListeningLesson, answer: string) {
  const correct = answer === lesson.answer;
  return {
    correct,
    score: correct ? 100 : 45,
    feedback: correct ? lesson.explanation.en : `Correct answer: ${lesson.answer}`,
  };
}

export function getDailyPlan(userId: number, level = 'A0'): DailyPlanItem[] {
  const userData = getUserData(userId);
  const nextLesson =
    lessons.find((lesson) => !userData.lessonProgress.find((entry) => entry.lessonId === lesson.id)?.completed)
    || lessons[0];
  const listening = getListeningLessonForLevel(level);
  const roleplay = getRoleplayScenarioForLevel(level);
  const writing = pickForLevel(writingPrompts, level);
  const dueWords = userData.srs.filter((entry) => entry.nextReview <= new Date().toISOString()).length;

  return [
    {
      id: 'daily-lesson',
      title: { uz: 'Bugungi dars', en: 'Today lesson', ru: 'Today lesson' },
      description: nextLesson.title,
      route: '/lessons',
    },
    {
      id: 'daily-srs',
      title: { uz: 'SRS review', en: 'SRS review', ru: 'SRS review' },
      description: {
        uz: `${Math.max(dueWords, 4)} ta sozni takrorlang`,
        en: `Review ${Math.max(dueWords, 4)} words`,
        ru: `Review ${Math.max(dueWords, 4)} words`,
      },
      route: '/practice',
      routeState: { tab: 'vocabulary' },
    },
    {
      id: 'daily-listening',
      title: { uz: 'Listening', en: 'Listening', ru: 'Listening' },
      description: listening.title,
      route: '/practice',
      routeState: { tab: 'listening', lessonId: listening.id },
    },
    {
      id: 'daily-writing',
      title: { uz: 'Writing', en: 'Writing', ru: 'Writing' },
      description: writing.title,
      route: '/practice',
      routeState: { tab: 'writing', promptId: writing.id },
    },
    {
      id: 'daily-roleplay',
      title: { uz: 'Speaking roleplay', en: 'Speaking roleplay', ru: 'Speaking roleplay' },
      description: roleplay.title,
      route: '/practice',
      routeState: { tab: 'roleplay', roleplayId: roleplay.id },
    },
  ];
}

export function getWeeklyReport(userId: number): WeeklyReport {
  const userData = getUserData(userId);
  const fromDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const toKey = (value: string) => new Date(value).toISOString().slice(0, 10);

  const lessonDates = userData.lessonProgress
    .filter((entry) => entry.completedAt && new Date(entry.completedAt).getTime() >= fromDate)
    .map((entry) => entry.completedAt as string);
  const writingDates = userData.writingSubmissions
    .filter((entry) => new Date(entry.timestamp).getTime() >= fromDate)
    .map((entry) => entry.timestamp);
  const listeningDates = userData.listeningSubmissions
    .filter((entry) => new Date(entry.completedAt).getTime() >= fromDate)
    .map((entry) => entry.completedAt);
  const mockDates = userData.mockAttempts
    .filter((entry) => new Date(entry.completedAt).getTime() >= fromDate)
    .map((entry) => entry.completedAt);

  return {
    studyDays: new Set([...lessonDates, ...writingDates, ...listeningDates, ...mockDates].map(toKey)).size,
    lessonsCompleted: lessonDates.length,
    writingsCompleted: writingDates.length,
    listeningCompleted: listeningDates.length,
    mocksCompleted: mockDates.length,
  };
}

export function getCertificateStatus(userId: number, level = 'A0'): CertificateStatus {
  const userData = getUserData(userId);
  const lessonCount = getCompletedLessonCount(userId);
  const learnedWords = getLearnedWordCount(userId);

  const requirements = [
    {
      label: { uz: 'Kamida 8 ta dars tugatilgan', en: 'Complete at least 8 lessons', ru: 'Complete at least 8 lessons' },
      complete: lessonCount >= 8,
    },
    {
      label: { uz: 'Kamida 3 ta writing topshirilgan', en: 'Submit at least 3 writing tasks', ru: 'Submit at least 3 writing tasks' },
      complete: userData.writingSubmissions.length >= 3,
    },
    {
      label: { uz: 'Kamida 3 ta listening yakunlangan', en: 'Finish at least 3 listening drills', ru: 'Finish at least 3 listening drills' },
      complete: userData.listeningSubmissions.length >= 3,
    },
    {
      label: { uz: 'Kamida 1 ta mock test ishlangan', en: 'Take at least 1 mock test', ru: 'Take at least 1 mock test' },
      complete: userData.mockAttempts.length >= 1,
    },
    {
      label: { uz: 'B2 yoki undan yuqori daraja', en: 'Reach B2 or above', ru: 'Reach B2 or above' },
      complete: levelRank(level) >= levelRank('B2'),
    },
    {
      label: { uz: 'Faol lugatda 40 ta soz', en: 'Learn 40 active words', ru: 'Learn 40 active words' },
      complete: learnedWords >= 40,
    },
  ];

  return {
    title: {
      uz: 'Sora AI Achievement Certificate',
      en: 'Sora AI Achievement Certificate',
      ru: 'Sora AI Achievement Certificate',
    },
    ready: requirements.every((item) => item.complete),
    requirements,
  };
}

export function getMockExamForLevel(level = 'A0'): MockExam {
  const targetLevel =
    levelRank(level) >= levelRank('IELTS')
      ? 'IELTS'
      : levelRank(level) >= levelRank('B2')
        ? 'B2'
        : levelRank(level) >= levelRank('B1')
          ? 'B1'
          : 'A2';
  const listening = getListeningLessonForLevel(targetLevel);
  const reading = pickForLevel(readingPassages, targetLevel);
  const writing = pickForLevel(writingPrompts, targetLevel);

  return {
    id: `mock-${targetLevel.toLowerCase()}`,
    title: {
      uz: targetLevel === 'IELTS' ? 'IELTS full mock' : targetLevel === 'B2' ? 'IELTS tayyorgarlik mock' : 'Foundation mock',
      en: targetLevel === 'IELTS' ? 'IELTS full mock' : targetLevel === 'B2' ? 'IELTS preparation mock' : 'Foundation mock',
      ru: targetLevel === 'IELTS' ? 'IELTS full mock' : targetLevel === 'B2' ? 'IELTS preparation mock' : 'Foundation mock',
    },
    kind: targetLevel === 'IELTS' || targetLevel === 'B2' ? 'ielts' : 'foundation',
    level: targetLevel,
    durationMinutes: targetLevel === 'IELTS' ? 55 : targetLevel === 'B2' ? 40 : 25,
    listening,
    readingPassageId: reading.id,
    writingPromptId: writing.id,
    speakingPrompt: targetLevel === 'IELTS'
      ? {
          uz: 'Do schools need more creativity or more discipline? Give a clear IELTS-style answer with examples.',
          en: 'Do schools need more creativity or more discipline? Give a clear IELTS-style answer with examples.',
          ru: 'Do schools need more creativity or more discipline? Give a clear IELTS-style answer with examples.',
        }
      : targetLevel === 'B2'
      ? {
          uz: 'Remote work hamisha office ishidan yaxshiroqmi? Strukturali javob bering.',
          en: 'Is remote work always better than office work? Give a structured answer.',
          ru: 'Is remote work always better than office work? Give a structured answer.',
        }
      : {
          uz: 'Kundalik hayotingiz haqida 4-5 gap bilan gapiring.',
          en: 'Speak for 4-5 sentences about your daily life.',
          ru: 'Speak for 4-5 sentences about your daily life.',
        },
  };
}

export function evaluateMockResults(sectionScores: {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}) {
  const score = Math.round(
    (sectionScores.listening + sectionScores.reading + sectionScores.writing + sectionScores.speaking) / 4,
  );
  const band = Math.max(3, Math.min(9, Math.round((score / 11) * 2) / 2));

  return {
    score,
    band,
    sectionScores,
  };
}
