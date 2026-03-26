import nlp from 'compromise';
import {
  grammarTopics,
  type GrammarTopic,
  getGrammarTopic,
  getRelatedVocabulary,
  getVocabularyByWord,
  readingPassages,
  type VocabularyEntry,
  vocabularyBank,
  writingPrompts,
} from '../lib/courseData';
import type { LocalizedText } from '../lib/i18n';
import {
  recordGrammarError,
  type PreferredVoice,
} from '../lib/localData';

export type ExerciseType =
  | 'multiple-choice'
  | 'fill-in-the-blanks'
  | 'sentence-unscrambling'
  | 'matching'
  | 'sentence-builder'
  | 'vocabulary-identification';

export interface Exercise {
  type: ExerciseType;
  word?: string;
  definition?: string;
  sentence?: string;
  phonetic?: string;
  options?: { id: number; label: string; desc: string; phonetic?: string }[];
  correctAnswerId?: number;
  wordBank?: string[];
  correctWord?: string;
  scrambledWords?: string[];
  correctSentence?: string;
  pairs?: { english: string; uzbek: string }[];
  tip: string;
  topicId?: string;
}

export interface GrammarResult {
  hasError: boolean;
  correctedText: string;
  explanation: string;
  detailedExplanation: string;
  tips: string[];
  topic: string;
}

export interface PronunciationFeedback {
  score: number;
  summary: string;
  grammarFeedback: string;
  phoneticErrors: Array<{
    word: string;
    expected: string;
    heard: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  intonation: {
    score: number;
    feedback: string;
  };
  rhythm: {
    score: number;
    feedback: string;
  };
  waveform: Array<{
    label: string;
    severity: 'good' | 'warn' | 'bad';
    note: string;
  }>;
}

export interface WritingEvaluation {
  score: number;
  bandEstimate: string;
  wordCount: number;
  feedback: string[];
  strengths: string[];
  correctedSample: string;
  strongerRewrite: string;
  nextTask: string;
}

export interface RoleplayScenario {
  id: string;
  level: string;
  title: LocalizedText;
  situation: LocalizedText;
  targetSkill: LocalizedText;
  successHint: LocalizedText;
  aiOpener: string;
  followUps: string[];
  closer: string;
}

export interface RoleplayTurnResult {
  aiReply: string;
  correction?: string;
  coachNote: string;
  score: number;
  nextTarget: string;
  finished: boolean;
}

const voiceProfiles: Record<
  PreferredVoice,
  { rate: number; pitch: number; hint: string[] }
> = {
  Zephyr: { rate: 1, pitch: 1.15, hint: ['zira', 'aria', 'female'] },
  Kore: { rate: 0.92, pitch: 0.95, hint: ['david', 'male', 'english'] },
  Fenrir: { rate: 0.98, pitch: 0.82, hint: ['alex', 'male'] },
  Puck: { rate: 1.06, pitch: 1.28, hint: ['samantha', 'zira', 'female'] },
  Charon: { rate: 0.86, pitch: 0.78, hint: ['daniel', 'male'] },
  Ozodbek: { rate: 0.94, pitch: 0.84, hint: ['male', 'david', 'mark', 'james', 'guy', 'uz', 'bek'] },
};

const basicDictionary: Record<string, string> = {
  hello: 'salom',
  great: 'zo‘r',
  practice: 'mashq',
  grammar: 'grammatika',
  vocabulary: 'lug‘at',
  sentence: 'gap',
  try: 'urinib ko‘ring',
  answer: 'javob',
  speak: 'gapiring',
  listen: 'tinglang',
  today: 'bugun',
  question: 'savol',
  example: 'misol',
  word: 'so‘z',
  good: 'yaxshi',
  again: 'yana',
  explain: 'tushuntiraman',
};

const levelOrder = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'IELTS'] as const;

const roleplayLibrary: RoleplayScenario[] = [
  {
    id: 'roleplay-a0-greeting',
    level: 'A0',
    title: { uz: 'Tanishuv', en: 'First introduction', ru: 'First introduction' },
    situation: {
      uz: 'Siz yangi kursdosh bilan birinchi marta tanishyapsiz.',
      en: 'You are meeting a new classmate for the first time.',
      ru: 'You are meeting a new classmate for the first time.',
    },
    targetSkill: { uz: 'Ism, mamlakat va oddiy tanishtirish', en: 'Name, country, and simple self-introduction', ru: 'Name, country, and simple self-introduction' },
    successHint: { uz: 'Kamida 2 toliq gap ayting.', en: 'Say at least 2 full sentences.', ru: 'Say at least 2 full sentences.' },
    aiOpener: 'Hello. I am Emma. What is your name, and where are you from?',
    followUps: [
      'Nice to meet you. What languages do you speak now?',
      'Good. Tell me one simple thing you study or do every day.',
    ],
    closer: 'Good job. End with one clear sentence about why you want to learn English.',
  },
  {
    id: 'roleplay-a1-cafe',
    level: 'A1',
    title: { uz: 'Kafeda buyurtma', en: 'Cafe order', ru: 'Cafe order' },
    situation: {
      uz: 'Siz kafeda ichimlik va yengil ovqat buyurtma qilyapsiz.',
      en: 'You are ordering a drink and a small meal in a cafe.',
      ru: 'You are ordering a drink and a small meal in a cafe.',
    },
    targetSkill: { uz: 'Polite request va oddiy savollar', en: 'Polite requests and basic questions', ru: 'Polite requests and basic questions' },
    successHint: { uz: 'Can I have...? yoki I would like... ishlating.', en: 'Use Can I have...? or I would like....', ru: 'Use Can I have...? or I would like....' },
    aiOpener: 'Welcome. What would you like to order today?',
    followUps: [
      'Sure. What size would you like, and do you want anything else?',
      'That is available. Please tell me if you want to eat here or take it away.',
    ],
    closer: 'Nice. Finish the roleplay by thanking the waiter politely.',
  },
  {
    id: 'roleplay-a2-travel',
    level: 'A2',
    title: { uz: 'Poezd bekatida', en: 'At the train station', ru: 'At the train station' },
    situation: {
      uz: 'Siz bekatda chipta va vaqt haqida malumot sorayapsiz.',
      en: 'You are asking for ticket and schedule information at a station.',
      ru: 'You are asking for ticket and schedule information at a station.',
    },
    targetSkill: { uz: 'Savol berish va detail olish', en: 'Asking questions and getting details', ru: 'Asking questions and getting details' },
    successHint: { uz: 'When, how much, which platform kabi savollarni ishlating.', en: 'Use questions like when, how much, and which platform.', ru: 'Use questions like when, how much, and which platform.' },
    aiOpener: 'Hello. How can I help you with your trip today?',
    followUps: [
      'The next train leaves soon. Which city are you traveling to?',
      'I can help with that. Ask me about the ticket price or the platform.',
    ],
    closer: 'Good. End by confirming the train time and thanking the staff member.',
  },
  {
    id: 'roleplay-b1-interview',
    level: 'B1',
    title: { uz: 'Qisqa intervyu', en: 'Short interview', ru: 'Short interview' },
    situation: {
      uz: 'Siz oddiy ish yoki oqish intervyusidasiz.',
      en: 'You are in a simple work or study interview.',
      ru: 'You are in a simple work or study interview.',
    },
    targetSkill: { uz: 'Tajriba, kuchli tomon va sabablarni tushuntirish', en: 'Explaining experience, strengths, and reasons', ru: 'Explaining experience, strengths, and reasons' },
    successHint: { uz: 'Har javobda bitta sabab yoki misol bering.', en: 'Give one reason or example in each answer.', ru: 'Give one reason or example in each answer.' },
    aiOpener: 'Tell me a little about yourself and why you are interested in this opportunity.',
    followUps: [
      'What is one strength that helps you study or work well?',
      'Describe a challenge you had and how you handled it.',
    ],
    closer: 'Strong. Finish by asking one smart question back to the interviewer.',
  },
  {
    id: 'roleplay-b2-meeting',
    level: 'B2',
    title: { uz: 'Jamoa uchrashuvi', en: 'Team meeting', ru: 'Team meeting' },
    situation: {
      uz: 'Siz jamoa bilan loyiha muhokama qilyapsiz.',
      en: 'You are discussing a project in a team meeting.',
      ru: 'You are discussing a project in a team meeting.',
    },
    targetSkill: { uz: 'Fikr bildirish, taklif qilish va kelishish-kelishmaslik', en: 'Giving opinions, making suggestions, and agreeing or disagreeing', ru: 'Giving opinions, making suggestions, and agreeing or disagreeing' },
    successHint: { uz: 'I think, however, we should, one concern is kabi birikmalarni ishlating.', en: 'Use phrases like I think, however, we should, and one concern is.', ru: 'Use phrases like I think, however, we should, and one concern is.' },
    aiOpener: 'We need to improve this project before Friday. What do you think we should change first?',
    followUps: [
      'That is one option. Can you justify your idea with one practical reason?',
      'Another teammate disagrees. How would you defend your position politely?',
    ],
    closer: 'Good. Close the meeting with one clear action point and a deadline.',
  },
  {
    id: 'roleplay-c1-debate',
    level: 'C1',
    title: { uz: 'Akademik munozara', en: 'Academic debate', ru: 'Academic debate' },
    situation: {
      uz: 'Siz talim yoki texnologiya haqida formal munozarada gapiryapsiz.',
      en: 'You are speaking in a formal discussion about education or technology.',
      ru: 'You are speaking in a formal discussion about education or technology.',
    },
    targetSkill: { uz: 'Nuanced argument va counterpoint', en: 'Nuanced argument and counterpoint', ru: 'Nuanced argument and counterpoint' },
    successHint: { uz: 'Main claim, counterpoint, va conclusionni saqlang.', en: 'Keep a main claim, one counterpoint, and a conclusion.', ru: 'Keep a main claim, one counterpoint, and a conclusion.' },
    aiOpener: 'Some people argue that AI tools weaken independent thinking. What is your view?',
    followUps: [
      'That is interesting. Present one counterargument and respond to it clearly.',
      'Now make your position more precise with an example from education or work.',
    ],
    closer: 'Strong. Finish with a concise concluding statement that sounds formal.',
  },
  {
    id: 'roleplay-ielts-speaking',
    level: 'IELTS',
    title: { uz: 'IELTS speaking mock', en: 'IELTS speaking mock', ru: 'IELTS speaking mock' },
    situation: {
      uz: 'Bu IELTS uslubidagi part 2-3 speaking scene.',
      en: 'This is an IELTS-style part 2-3 speaking scene.',
      ru: 'This is an IELTS-style part 2-3 speaking scene.',
    },
    targetSkill: { uz: 'Band uchun structured, developed, accurate answer', en: 'Structured, developed, accurate answer for band growth', ru: 'Structured, developed, accurate answer for band growth' },
    successHint: { uz: 'Fluency, coherence, lexical range va grammarni balanslang.', en: 'Balance fluency, coherence, lexical range, and grammar.', ru: 'Balance fluency, coherence, lexical range, and grammar.' },
    aiOpener: 'Describe a person who has influenced the way you study or work. You should say who this person is, how you know them, and explain why they influenced you.',
    followUps: [
      'Thank you. Now explain whether role models are more important for young people or adults.',
      'Finally, discuss whether success depends more on discipline or creativity.',
    ],
    closer: 'That completes the mock. Finish with one balanced final opinion in formal English.',
  },
];

function randomFrom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function levelRank(level?: string) {
  const index = levelOrder.indexOf((level || 'A0') as (typeof levelOrder)[number]);
  return index === -1 ? 0 : index;
}

function pickForLevel<T extends { level: string; id: string }>(
  items: T[],
  level = 'A0',
  preferredId?: string,
) {
  if (preferredId) {
    const exact = items.find((item) => item.id === preferredId);
    if (exact) {
      return exact;
    }
  }

  const userRank = levelRank(level);
  const eligible = items
    .filter((item) => levelRank(item.level) <= userRank)
    .sort((left, right) => levelRank(right.level) - levelRank(left.level));

  return eligible[0] || items[0];
}

function shuffle<T>(items: T[]) {
  return [...items]
    .map((item) => ({ item, rank: Math.random() }))
    .sort((left, right) => left.rank - right.rank)
    .map((entry) => entry.item);
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, '').trim();
}

function tokenize(text: string) {
  return normalize(text).split(/\s+/).filter(Boolean);
}

function levenshtein(source: string, target: string) {
  const rows = source.length + 1;
  const cols = target.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = source[row - 1] === target[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function similarity(source: string, target: string) {
  if (!source && !target) {
    return 1;
  }

  const distance = levenshtein(source, target);
  return 1 - distance / Math.max(source.length, target.length, 1);
}

function sentenceToScrambledWords(sentence: string) {
  return shuffle(sentence.replace(/[.?!]/g, '').split(/\s+/).filter(Boolean));
}

function ensureVocabularyEntry(relatedWord?: string) {
  return getVocabularyByWord(relatedWord) || randomFrom(vocabularyBank);
}

function createVocabularyOptions(entry: VocabularyEntry) {
  const pool = getRelatedVocabulary(entry.word)
    .filter((candidate) => candidate.word !== entry.word)
    .slice(0, 6);

  const selectedDistractors = shuffle(pool).slice(0, 3);
  const optionEntries = shuffle([entry, ...selectedDistractors]).slice(0, 4);

  return optionEntries.map((option, index) => ({
    id: index + 1,
    label: option.word,
    desc: option.translation,
    phonetic: option.phonetic,
  }));
}

function createMatchingExercise(entry: VocabularyEntry): Exercise {
  const set = shuffle(
    getRelatedVocabulary(entry.word).filter((candidate) => candidate.category === entry.category),
  ).slice(0, 4);

  return {
    type: 'matching',
    word: entry.word,
    pairs: set.map((item) => ({
      english: item.word,
      uzbek: item.translation,
    })),
    tip: `Bir mavzudagi so‘zlarni juftlab yodlash xotirani kuchaytiradi. Bugungi fokus: ${entry.category}.`,
  };
}

function createVocabularyExercise(entry: VocabularyEntry, forceType?: ExerciseType): Exercise {
  const availableTypes: ExerciseType[] = [
    'multiple-choice',
    'fill-in-the-blanks',
    'matching',
    'sentence-builder',
    'vocabulary-identification',
    'sentence-unscrambling',
  ];
  const type = forceType || randomFrom(availableTypes);

  if (type === 'multiple-choice') {
    const options = createVocabularyOptions(entry);
    return {
      type,
      word: entry.word,
      sentence: entry.example.replace(entry.word, '______'),
      phonetic: entry.phonetic,
      options,
      correctAnswerId: options.find((option) => option.label === entry.word)?.id,
      tip: `${entry.word} so‘zini gap konteksti bilan birga yodlang: ${entry.example}`,
    };
  }

  if (type === 'fill-in-the-blanks') {
    const bank = shuffle([
      entry.word,
      ...getRelatedVocabulary(entry.word)
        .filter((candidate) => candidate.word !== entry.word)
        .slice(0, 3)
        .map((candidate) => candidate.word),
    ]).slice(0, 4);

    return {
      type,
      word: entry.word,
      sentence: entry.example.replace(entry.word, '______'),
      wordBank: bank,
      correctWord: entry.word,
      tip: `Bo‘sh joyni to‘ldirayotganda gapning ma’nosini va mavzusini tekshiring.`,
    };
  }

  if (type === 'matching') {
    return createMatchingExercise(entry);
  }

  if (type === 'vocabulary-identification') {
    const options = createVocabularyOptions(entry);
    return {
      type,
      definition: entry.definition,
      options,
      correctAnswerId: options.find((option) => option.label === entry.word)?.id,
      tip: `${entry.word} so‘zi uchun ta’rifni yodlash faol lug‘atni mustahkamlaydi.`,
    };
  }

  if (type === 'sentence-builder' || type === 'sentence-unscrambling') {
    return {
      type,
      word: entry.word,
      correctSentence: entry.example,
      scrambledWords: sentenceToScrambledWords(entry.example),
      tip: `Gap qurishda ${entry.word} so‘zining odatiy joylashuvini sezishga harakat qiling.`,
    };
  }

  return createVocabularyExercise(entry, 'multiple-choice');
}

function buildGrammarExercise(topic: GrammarTopic): Exercise {
  const drill = randomFrom(topic.drills);

  if (drill.type === 'fill-in-the-blanks') {
    return {
      type: 'fill-in-the-blanks',
      sentence: drill.prompt.replace('______', '______'),
      wordBank: drill.options,
      correctWord: drill.answer,
      tip: `${topic.label.uz}: ${topic.summary.uz}`,
      topicId: topic.id,
    };
  }

  if (drill.type === 'multiple-choice') {
    const options = (drill.options || []).map((option, index) => ({
      id: index + 1,
      label: option,
      desc: topic.label.uz,
    }));

    return {
      type: 'multiple-choice',
      word: topic.label.uz,
      sentence: drill.prompt,
      options,
      correctAnswerId: options.find((option) => option.label === drill.answer)?.id,
      tip: `${topic.explanation.uz}`,
      topicId: topic.id,
    };
  }

  return {
    type: 'sentence-builder',
    word: topic.label.uz,
    correctSentence: drill.answer,
    scrambledWords: sentenceToScrambledWords(drill.prompt),
    tip: `${topic.explanation.uz}`,
    topicId: topic.id,
  };
}

export async function generateExercise(
  level = 'A1',
  relatedWord?: string,
  forceType?: ExerciseType,
  isGrammarFix?: boolean,
): Promise<Exercise | null> {
  if (isGrammarFix) {
    return generateGrammarExercise(level, relatedWord);
  }

  const entry = ensureVocabularyEntry(relatedWord);
  return createVocabularyExercise(entry, forceType);
}

export async function generateGrammarExercise(
  _level = 'A1',
  topicOrError?: string,
): Promise<Exercise | null> {
  const topic = grammarTopics.find((item) => item.id === topicOrError)
    || grammarTopics.find((item) => item.label.uz.toLowerCase() === (topicOrError || '').toLowerCase())
    || inferGrammarTopic(topicOrError || '')
    || grammarTopics[0];

  return buildGrammarExercise(topic);
}

export function getGrammarTopics() {
  return grammarTopics;
}

export function getReadingPassageForLevel(level = 'A0', passageId?: string) {
  return pickForLevel(readingPassages, level, passageId);
}

export function getWritingPromptForLevel(level = 'A0', promptId?: string) {
  return pickForLevel(writingPrompts, level, promptId);
}

export function getGrammarTips(count = 5) {
  return grammarTopics.slice(0, count).map((topic) => ({
    rule: topic.label.uz,
    example: topic.example,
    explanation: topic.explanation.uz,
  }));
}

export async function translateToUzbek(text: string): Promise<string> {
  const words = text.split(/\s+/);
  const translated = words.map((word) => {
    const key = word.toLowerCase().replace(/[^a-z']/g, '');
    return basicDictionary[key] || word;
  });

  return translated.join(' ');
}

function inferGrammarTopic(text: string) {
  const lower = text.toLowerCase();

  if (
    lower.includes('i is')
    || lower.includes('you is')
    || lower.includes('he are')
    || lower.includes('she are')
    || lower.includes('it are')
  ) {
    return getGrammarTopic('present-simple');
  }

  if (lower.includes("don't") && lower.includes('nothing')) {
    return getGrammarTopic('double-negative');
  }

  if (lower.includes('want ') && !lower.includes('want to')) {
    return getGrammarTopic('want-to');
  }

  if (/\ba [aeiou]/i.test(text) || /\ban [bcdfghjklmnpqrstvwxyz]/i.test(text)) {
    return getGrammarTopic('articles');
  }

  return null;
}

export function checkGrammar(text: string, userId?: number): GrammarResult {
  const normalized = text.toLowerCase();
  let correctedText = text;
  let explanation = '';
  let detailedExplanation = '';
  let topic = 'present-simple';
  let tips: string[] = [];

  if (normalized.includes('i is')) {
    correctedText = correctedText.replace(/i is/gi, 'I am');
    explanation = `'I' bilan 'am' ishlatiladi.`;
    detailedExplanation = `Ingliz tilida I olmoshi bilan to be fe’lining am shakli keladi: I am ready.`;
    tips = ['I am shaklini yodlang.', 'He is, she is, it is bilan adashtirmang.'];
    topic = 'present-simple';
  } else if (normalized.includes('you is')) {
    correctedText = correctedText.replace(/you is/gi, 'you are');
    explanation = `'You' bilan 'are' ishlatiladi.`;
    detailedExplanation = `You bilan har doim are ishlatiladi: You are late.`;
    tips = ['You are standart shakl.', 'Savolda: Are you ready?'];
    topic = 'present-simple';
  } else if (
    normalized.includes('he are')
    || normalized.includes('she are')
    || normalized.includes('it are')
  ) {
    correctedText = correctedText
      .replace(/he are/gi, 'he is')
      .replace(/she are/gi, 'she is')
      .replace(/it are/gi, 'it is');
    explanation = `He / she / it bilan 'is' ishlatiladi.`;
    detailedExplanation = `Uchinchi shaxs birlikda to be fe’li is bo‘ladi: She is a teacher.`;
    tips = ['He is, she is, it is qolipini takrorlang.'];
    topic = 'present-simple';
  } else if (normalized.includes("don't") && normalized.includes('nothing')) {
    correctedText = correctedText.replace(/nothing/gi, 'anything');
    explanation = `Bitta gapda ikki inkor ishlatilmaydi.`;
    detailedExplanation = `I don’t have anything yoki I have nothing deyiladi. I don’t have nothing xato.`;
    tips = ['Don’t + anything qolipini ishlating.'];
    topic = 'double-negative';
  } else if (normalized.includes('i want ') && !normalized.includes('i want to')) {
    correctedText = correctedText.replace(/i want\s+/i, 'I want to ');
    explanation = `'Want' dan keyin harakat bo‘lsa, 'to' kerak.`;
    detailedExplanation = `Want to + verb shakli ishlatiladi: I want to study.`;
    tips = ['Want to + verb.', 'Narsani xohlasangiz: I want a book.'];
    topic = 'want-to';
  } else if (/\ba [aeiou]/i.test(text)) {
    correctedText = correctedText.replace(/\ba ([aeiou]\w*)/gi, 'an $1');
    explanation = `Unli tovush oldidan 'an' ishlatiladi.`;
    detailedExplanation = `An apple, an idea, an umbrella kabi birikmalarda an ishlatiladi.`;
    tips = ['Tovushga qarang, faqat harfga emas.'];
    topic = 'articles';
  } else if (/\ban [bcdfghjklmnpqrstvwxyz]/i.test(text)) {
    correctedText = correctedText.replace(/\ban ([bcdfghjklmnpqrstvwxyz]\w*)/gi, 'a $1');
    explanation = `Undosh tovush oldidan 'a' ishlatiladi.`;
    detailedExplanation = `A book, a car, a lesson kabi birikmalarda a ishlatiladi.`;
    tips = ['Undosh tovush bilan a ishlating.'];
    topic = 'articles';
  } else {
    const doc = nlp(text);
    const subject = doc.match('(he|she|it)').text().toLowerCase();
    const firstVerb = doc.verbs().out('array')[0];
    if (subject && firstVerb && !firstVerb.endsWith('s')) {
      correctedText = text.replace(firstVerb, `${firstVerb}s`);
      explanation = `He / she / it bilan fe’lga ko‘pincha -s qo‘shiladi.`;
      detailedExplanation = `Present Simple zamonida he, she, it bilan work -> works, play -> plays bo‘ladi.`;
      tips = ['He works. She studies. It looks good.'];
      topic = 'present-simple';
    }
  }

  const hasError = Boolean(explanation);

  if (hasError && userId) {
    recordGrammarError(userId, {
      text,
      correctedText,
      explanation,
      topic,
    });
  }

  return {
    hasError,
    correctedText,
    explanation,
    detailedExplanation,
    tips,
    topic,
  };
}

function phoneticIssue(expected: string, heard: string) {
  if (!heard) {
    return 'So‘z tushib qolgan yoki juda noaniq aytilgan.';
  }
  if (expected.includes('th') && !heard.includes('th')) {
    return `'th' tovushi boshqa tovushga almashgan. Til uchini oldinga chiqarib mashq qiling.`;
  }
  if (expected.includes('v') && heard.includes('w')) {
    return `'v' va 'w' tovushlari aralashgan. Pastki labni yuqori tishga tekkizing.`;
  }
  if (expected.endsWith('ed') && !heard.endsWith('ed')) {
    return `O‘tgan zamon qo‘shimchasi zaif eshitildi. Oxirgi /d/ yoki /t/ ni aniqroq yoping.`;
  }
  if ('aeiou'.includes(expected[0]) && expected[0] !== heard[0]) {
    return `Boshlang‘ich unli tovush o‘zgargan. So‘zni sekin bo‘lib ayting.`;
  }
  return `So‘z shakli maqsadga to‘liq mos kelmadi. Avval bo‘g‘inlarga ajratib qayta ayting.`;
}

export async function getPronunciationFeedback(
  transcript: string,
  targetText: string,
): Promise<PronunciationFeedback> {
  const targetTokens = tokenize(targetText);
  const heardTokens = tokenize(transcript);
  const waveform: PronunciationFeedback['waveform'] = [];
  const phoneticErrors: PronunciationFeedback['phoneticErrors'] = [];

  let totalScore = 0;

  targetTokens.forEach((token, index) => {
    const heard = heardTokens[index] || '';
    const match = similarity(token, heard);
    totalScore += match;

    let severity: 'good' | 'warn' | 'bad' = 'good';
    if (match < 0.85 && match >= 0.6) severity = 'warn';
    if (match < 0.6) severity = 'bad';

    const note =
      severity === 'good'
        ? 'Tovush zanjiri deyarli to‘g‘ri.'
        : phoneticIssue(token, heard);

    waveform.push({
      label: token,
      severity,
      note,
    });

    if (severity !== 'good') {
      phoneticErrors.push({
        word: token,
        expected: token,
        heard: heard || '(eshitilmadi)',
        issue: note,
        severity: severity === 'bad' ? 'high' : 'medium',
      });
    }
  });

  const score = Math.max(
    35,
    Math.round((totalScore / Math.max(targetTokens.length, 1)) * 100),
  );

  const grammarResult = checkGrammar(transcript);
  const intonationScore = targetText.trim().endsWith('?')
    ? heardTokens.length >= targetTokens.length - 1
      ? 82
      : 68
    : heardTokens.length >= targetTokens.length
      ? 84
      : 72;
  const rhythmScore = Math.max(
    60,
    100 - Math.abs(targetTokens.length - heardTokens.length) * 9,
  );

  return {
    score,
    summary:
      phoneticErrors.length === 0
        ? 'Talaffuz ancha ravon. Endi tezlik va intonatsiyani bir xil ushlab turing.'
        : 'Asosiy xatolar ayrim so‘z boshida va oxirgi bo‘g‘inlarda ko‘rindi.',
    grammarFeedback: grammarResult.hasError
      ? grammarResult.explanation
      : 'Gap tuzilishi qabul qilinarli.',
    phoneticErrors,
    intonation: {
      score: intonationScore,
      feedback: targetText.trim().endsWith('?')
        ? 'Savol ohangida gap oxirini biroz ko‘tarib yakunlang.'
        : 'Gap oxirini keskin tushirib yubormang, tabiiy yumshoq pasayish saqlang.',
    },
    rhythm: {
      score: rhythmScore,
      feedback:
        heardTokens.length < targetTokens.length
          ? 'Ritmda so‘z tushirib qoldirish bor. Har bir tayanch so‘zni urib ayting.'
          : 'Urg‘u va pauzalar yomon emas, lekin funksional so‘zlarni yutib yubormang.',
    },
    waveform,
  };
}

function waitForSpeechVoices() {
  if (!('speechSynthesis' in window)) {
    return Promise.resolve<SpeechSynthesisVoice[]>([]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const handleVoices = () => {
      window.clearTimeout(timeout);
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
      resolve(window.speechSynthesis.getVoices());
    };

    const timeout = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
      resolve(window.speechSynthesis.getVoices());
    }, 1200);

    window.speechSynthesis.addEventListener('voiceschanged', handleVoices);
    window.speechSynthesis.getVoices();
  });
}

async function selectEnglishVoice(preferred: PreferredVoice) {
  const voices = await waitForSpeechVoices();
  const hints = voiceProfiles[preferred].hint;
  if (preferred === 'Ozodbek') {
    return (
      voices.find((voice) =>
        voice.lang.toLowerCase().startsWith('uz')
        && hints.some((hint) => voice.name.toLowerCase().includes(hint)),
      )
      || voices.find((voice) => voice.lang.toLowerCase().startsWith('uz'))
      || voices.find((voice) =>
        hints.some((hint) => voice.name.toLowerCase().includes(hint)),
      )
      || voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
      || null
    );
  }
  return (
    voices.find((voice) =>
      hints.some((hint) => voice.name.toLowerCase().includes(hint)),
    )
    || voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
    || null
  );
}

export function playPronunciation(
  text: string,
  preferredVoice: PreferredVoice = 'Zephyr',
  rateMultiplier = 1,
) {
  if (!('speechSynthesis' in window)) {
    return Promise.resolve(false);
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const profile = voiceProfiles[preferredVoice];
  utterance.rate = Math.max(0.6, Math.min(1.5, profile.rate * rateMultiplier));
  utterance.pitch = profile.pitch;

  return selectEnglishVoice(preferredVoice).then((selectedVoice) => {
    utterance.lang = selectedVoice?.lang || 'en-US';
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    return new Promise<boolean>((resolve) => {
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  });
}

export async function getHumanLikeVoice(
  text: string,
  voice: PreferredVoice = 'Zephyr',
) {
  await playPronunciation(text, voice);
  return null;
}

export function getSuggestedGrammarTopic(errorTopics: string[]) {
  const counts = errorTopics.reduce<Record<string, number>>((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});

  const suggested = Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0];
  return getGrammarTopic(suggested || grammarTopics[0].id);
}

export function generateTutorReply(
  message: string,
  history: Array<{ role: 'ai' | 'user'; text: string }> = [],
  userName?: string,
) {
  const lower = message.toLowerCase();
  const grammar = checkGrammar(message);
  const words = tokenize(message);
  const topicWord =
    vocabularyBank.find((entry) => lower.includes(entry.word))?.word
    || history.find((entry) => entry.role === 'user' && entry.text)?.text.split(' ')[0];

  if (grammar.hasError) {
    return `Sora correction:

This is not quite right yet. Say it like this:
"${grammar.correctedText}"

Why:
${grammar.explanation}

Do this now:
1. Repeat the corrected sentence once.
2. Write one more sentence with the same pattern.
3. Keep the subject and verb clear${userName ? `, ${userName}` : ''}.`;
  }

  if (words.length <= 3) {
    return `Sora coach:

Good start, but this answer is too short to build fluency.

Say at least two full sentences:
- one main idea
- one detail or reason

Try again and I will correct it precisely.`;
  }

  if (/(hello|hi|hey|salom)/i.test(lower)) {
    return `Sora: Hello${userName ? `, ${userName}` : ''}. We will build your English step by step from simple sentences to stronger answers. Start with this: describe your morning in 2 short sentences.`;
  }

  if (/(travel|airport|passport|ticket|flight)/i.test(lower)) {
    return `Sora: Travel English needs clear action verbs. Model sentence: "I check my passport and boarding gate first." Now answer this in English: what do you check first at the airport, and why?`;
  }

  if (/(work|meeting|project|deadline)/i.test(lower)) {
    return `Sora: Better answers in work English use time, action, and detail. Example: "I have a project deadline on Friday, so I am planning my tasks today." Now write your own sentence with "project" or "deadline".`;
  }

  if (/(grammar|sentence|verb|subject)/i.test(lower)) {
    return `Sora: Focus on accuracy. A strong sentence needs a clear subject, the right verb, and one useful detail. Example: "She studies every evening after dinner." Now write one sentence about your routine.`;
  }

  if (/(translate|translation|tarjima)/i.test(lower) && topicWord) {
    const entry = getVocabularyByWord(topicWord);
    return entry
      ? `Sora: "${entry.word}" means "${entry.translation}" in Uzbek. Example: ${entry.example} Now use "${entry.word}" in a new sentence.`
      : `Sora: I can help with translation. Send me one short English sentence, and I will explain it step by step.`;
  }

  const promptWord = getVocabularyByWord(topicWord);
  if (promptWord) {
    return `Sora: Use "${promptWord.word}" in a full context sentence. Model: ${promptWord.example} Your task: write a new sentence with "${promptWord.word}" and add a time expression or reason.`;
  }

  return `Sora: Good effort. To sound stronger, expand your idea with:

- one clear subject
- one accurate verb
- one specific detail

Send the improved version and I will tell you exactly what to fix next.`;
}

export function getChatResponse(message: string) {
  return generateTutorReply(message);
}

export async function getGrammarTipOfTheDay() {
  const topic = randomFrom(grammarTopics);
  return {
    rule: topic.label.uz,
    example: topic.example,
    explanation: topic.explanation.uz,
  };
}

export async function generateSpeakingChallenge(level = 'A1') {
  const prompts =
    level === 'A0' || level === 'A1'
      ? [
          { prompt: 'Describe your morning routine.', scenario: 'You are talking to a new classmate.', duration: 35 },
          { prompt: 'Talk about your family in simple English.', scenario: 'You are introducing yourself.', duration: 40 },
        ]
      : [
          { prompt: 'Explain a challenge you solved at work or school.', scenario: 'You are in a speaking interview.', duration: 50 },
          { prompt: 'Describe a useful skill you want to improve this year.', scenario: 'You are giving a short answer in class.', duration: 45 },
        ];

  return randomFrom(prompts);
}

export function getRoleplayScenariosForLevel(level = 'A0') {
  return roleplayLibrary.filter((scenario) => levelRank(scenario.level) <= levelRank(level));
}

export function getRoleplayScenarioForLevel(level = 'A0', scenarioId?: string) {
  const available = getRoleplayScenariosForLevel(level);
  if (scenarioId) {
    const exact = available.find((scenario) => scenario.id === scenarioId);
    if (exact) {
      return exact;
    }
  }

  return available[available.length - 1] || roleplayLibrary[0];
}

export async function continueRoleplayScenario(
  scenario: RoleplayScenario,
  userMessage: string,
  turnIndex = 0,
): Promise<RoleplayTurnResult> {
  const trimmed = userMessage.trim();
  const grammar = checkGrammar(trimmed);
  const wordCount = tokenize(trimmed).length;
  const idealLength =
    levelRank(scenario.level) <= levelRank('A1')
      ? 8
      : levelRank(scenario.level) <= levelRank('B1')
        ? 16
        : 28;

  let score = 50;
  score += Math.min(28, Math.round((wordCount / Math.max(idealLength, 1)) * 22));
  if (!grammar.hasError) score += 12;
  if (/\b(because|so|however|for example|usually|first|also)\b/i.test(trimmed)) score += 10;
  score = Math.max(35, Math.min(97, score));

  const nextScript = scenario.followUps[Math.min(turnIndex, scenario.followUps.length - 1)] || scenario.closer;
  const finished = turnIndex >= scenario.followUps.length - 1;

  const coachNote = grammar.hasError
    ? `Fix this structure first: ${grammar.explanation} Then repeat your answer with one extra detail.`
    : wordCount < idealLength
      ? 'Your idea is clear, but the answer is still short. Add one reason and one example.'
      : 'Good flow. Keep your grammar stable and make the next answer even more specific.';

  const nextTarget = finished
    ? 'Give one final polished answer without stopping.'
    : levelRank(scenario.level) <= levelRank('A1')
      ? 'Answer in 2-3 short full sentences.'
      : levelRank(scenario.level) <= levelRank('B1')
        ? 'Add one reason and one practical detail.'
        : 'Develop your answer with a clear opinion, support, and contrast.';

  return {
    aiReply: finished ? scenario.closer : nextScript,
    correction: grammar.hasError ? grammar.correctedText : undefined,
    coachNote,
    score,
    nextTarget,
    finished,
  };
}

export async function analyzeSpeakingChallenge(transcript: string, prompt: string) {
  const wordCount = tokenize(transcript).length;
  const grammar = checkGrammar(transcript);
  const score = Math.max(45, Math.min(96, wordCount * 4 + (grammar.hasError ? -10 : 8)));

  return {
    score,
    summary:
      wordCount < 12
        ? `Javob qisqa bo‘ldi. Fikr bor, lekin uni 2-3 qo‘shimcha gap bilan kengaytirish kerak.`
        : `Javob mavzuga mos. Siz asosiy fikrni yetkazdingiz va yetarli darajada davom ettirdingiz.`,
    feedback: grammar.hasError
      ? `Grammatik tomonda ${grammar.explanation.toLowerCase()} Keyingi urinishda bir xil strukturani 2 marta takrorlab mustahkamlang.`
      : `Keyingi bosqichda ko‘proq bog‘lovchi so‘z ishlating: because, also, usually, however.`,
  };
}

function scoreToBandEstimate(score: number) {
  if (score >= 92) return '8.0';
  if (score >= 86) return '7.5';
  if (score >= 78) return '6.5';
  if (score >= 70) return '6.0';
  if (score >= 62) return '5.5';
  if (score >= 54) return '5.0';
  if (score >= 46) return '4.5';
  return '4.0';
}

function buildStrongerRewrite(
  text: string,
  correctedText: string,
  level = 'A0',
  needsConnector: boolean,
) {
  let rewrite = (correctedText || text).replace(/\s+/g, ' ').trim();

  if (!rewrite) {
    return '';
  }

  if (!/[.!?]$/.test(rewrite)) {
    rewrite += '.';
  }

  if (needsConnector) {
    rewrite += ' This is important because it gives a clear reason.';
  }

  if (levelRank(level) >= levelRank('B1') && !/\bfor example\b/i.test(rewrite)) {
    rewrite += ' For example, it can improve real results over time.';
  }

  if (levelRank(level) >= levelRank('B2') && !/\bhowever\b/i.test(rewrite)) {
    rewrite += ' However, it still needs consistent practice and stronger detail.';
  }

  return rewrite;
}

export function evaluateWritingSubmission(
  text: string,
  level = 'A0',
  minimumWords = 40,
): WritingEvaluation {
  const trimmed = text.trim();
  const wordCount = tokenize(trimmed).length;
  const uniqueWords = new Set(tokenize(trimmed)).size;
  const sentenceCount = trimmed.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length;
  const grammar = checkGrammar(trimmed);
  const hasConnector = /\b(because|but|so|however|also|first|then|finally)\b/i.test(trimmed);
  const hasParagraphBreak = /\n\s*\n/.test(trimmed);
  const lengthRatio = Math.min(wordCount / Math.max(minimumWords, 1), 1.25);
  const varietyRatio = Math.min(uniqueWords / Math.max(wordCount, 1), 0.75);

  let score = 42;
  score += Math.round(lengthRatio * 28);
  score += Math.round(varietyRatio * 18);
  score += Math.min(sentenceCount * 3, 12);
  if (hasConnector) score += 6;
  if (hasParagraphBreak && levelRank(level) >= levelRank('B1')) score += 4;
  if (!grammar.hasError) score += 8;
  else score -= 6;
  score = Math.max(35, Math.min(96, score));

  const strengths: string[] = [];
  const feedback: string[] = [];

  if (wordCount >= minimumWords) {
    strengths.push('You reached the target length, so your idea has enough space to develop.');
  } else {
    feedback.push(`Your text is too short for this level. Write at least ${minimumWords} words.`);
  }

  if (sentenceCount >= 3) {
    strengths.push('You used more than one sentence, which makes the answer easier to follow.');
  } else {
    feedback.push('Build at least 3 sentences so your writing does not feel incomplete.');
  }

  if (hasConnector) {
    strengths.push('You used a linking word, which improves flow.');
  } else if (levelRank(level) >= levelRank('A2')) {
    feedback.push('Add linking words such as because, but, so, however, or also.');
  }

  if (uniqueWords <= Math.max(6, Math.floor(wordCount * 0.45))) {
    feedback.push('Vocabulary range is narrow. Replace repeated words with a more specific choice.');
  }

  if (grammar.hasError) {
    feedback.push(`Main grammar fix: ${grammar.explanation}`);
  } else {
    strengths.push('No major grammar pattern was detected in this draft.');
  }

  if (levelRank(level) >= levelRank('B1') && !hasParagraphBreak && wordCount >= 90) {
    feedback.push('Split the answer into paragraphs so each main idea is easier to follow.');
  }

  if (feedback.length === 0) {
    feedback.push('The draft is solid. Next, make one sentence more precise with a better example.');
  }

  const nextTask =
    levelRank(level) <= levelRank('A1')
      ? 'Rewrite it with one extra sentence about time or place.'
      : levelRank(level) <= levelRank('B1')
        ? 'Rewrite one paragraph and add a clear reason plus one example.'
        : 'Rewrite the introduction to sound more formal and precise.';

  return {
    score,
    bandEstimate: scoreToBandEstimate(score),
    wordCount,
    feedback,
    strengths,
    correctedSample: grammar.hasError ? grammar.correctedText : trimmed,
    strongerRewrite: buildStrongerRewrite(
      trimmed,
      grammar.hasError ? grammar.correctedText : trimmed,
      level,
      !hasConnector,
    ),
    nextTask,
  };
}
