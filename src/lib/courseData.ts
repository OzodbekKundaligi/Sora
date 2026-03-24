import type { LocalizedText } from './i18n';

export interface VocabularyEntry {
  word: string;
  translation: string;
  phonetic: string;
  definition: string;
  example: string;
  category: 'daily' | 'travel' | 'work' | 'study' | 'grammar';
  related: string[];
}

export interface GrammarTopic {
  id: string;
  label: LocalizedText;
  summary: LocalizedText;
  explanation: LocalizedText;
  example: string;
  drills: Array<{
    prompt: string;
    answer: string;
    options?: string[];
    type: 'fill-in-the-blanks' | 'multiple-choice' | 'sentence-builder';
  }>;
}

export interface LessonContent {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  duration: string;
  level: string;
  xp: number;
  theory: LocalizedText[];
  keyPoints: LocalizedText[];
  examples: string[];
  guidedPractice: Array<{
    question: LocalizedText;
    answer: LocalizedText;
  }>;
  practiceFocus:
    | { type: 'vocabulary'; word: string }
    | { type: 'grammar'; topicId: string };
}

export interface ReadingPassage {
  id: string;
  level: string;
  title: LocalizedText;
  passage: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: LocalizedText;
  }>;
}

export interface WritingPrompt {
  id: string;
  level: string;
  title: LocalizedText;
  instructions: LocalizedText;
  minimumWords: number;
  outlineTips: string[];
}

export const vocabularyBank: VocabularyEntry[] = [
  {
    word: 'airport',
    translation: 'aeroport',
    phonetic: '/ˈer.pɔːrt/',
    definition: 'a place where planes arrive and leave',
    example: 'We arrived at the airport two hours early.',
    category: 'travel',
    related: ['ticket', 'passport', 'flight'],
  },
  {
    word: 'passport',
    translation: 'pasport',
    phonetic: '/ˈpæs.pɔːrt/',
    definition: 'an official document for international travel',
    example: 'Keep your passport in a safe place.',
    category: 'travel',
    related: ['airport', 'ticket', 'flight'],
  },
  {
    word: 'flight',
    translation: 'reys',
    phonetic: '/flaɪt/',
    definition: 'a journey by plane',
    example: 'Our flight leaves at seven in the morning.',
    category: 'travel',
    related: ['airport', 'passport', 'ticket'],
  },
  {
    word: 'ticket',
    translation: 'chipta',
    phonetic: '/ˈtɪk.ɪt/',
    definition: 'a document or digital pass that allows travel or entry',
    example: 'She bought a train ticket online.',
    category: 'travel',
    related: ['airport', 'passport', 'flight'],
  },
  {
    word: 'meeting',
    translation: 'uchrashuv',
    phonetic: '/ˈmiː.tɪŋ/',
    definition: 'an event where people talk about work or plans',
    example: 'The meeting starts at nine o’clock.',
    category: 'work',
    related: ['schedule', 'project', 'deadline'],
  },
  {
    word: 'deadline',
    translation: 'topshirish muddati',
    phonetic: '/ˈded.laɪn/',
    definition: 'the latest time by which something must be finished',
    example: 'We must finish the report before the deadline.',
    category: 'work',
    related: ['meeting', 'project', 'schedule'],
  },
  {
    word: 'project',
    translation: 'loyiha',
    phonetic: '/ˈprɒdʒ.ekt/',
    definition: 'a planned piece of work',
    example: 'This project needs clear communication.',
    category: 'work',
    related: ['meeting', 'deadline', 'schedule'],
  },
  {
    word: 'schedule',
    translation: 'jadval',
    phonetic: '/ˈskedʒ.uːl/',
    definition: 'a plan that shows times for tasks or events',
    example: 'My study schedule is on the wall.',
    category: 'work',
    related: ['meeting', 'deadline', 'project'],
  },
  {
    word: 'library',
    translation: 'kutubxona',
    phonetic: '/ˈlaɪ.brer.i/',
    definition: 'a place where you can read or borrow books',
    example: 'I study in the library after class.',
    category: 'study',
    related: ['lesson', 'notebook', 'grammar'],
  },
  {
    word: 'notebook',
    translation: 'daftar',
    phonetic: '/ˈnəʊt.bʊk/',
    definition: 'a book of blank pages for writing notes',
    example: 'Write the new words in your notebook.',
    category: 'study',
    related: ['library', 'lesson', 'grammar'],
  },
  {
    word: 'lesson',
    translation: 'dars',
    phonetic: '/ˈles.ən/',
    definition: 'a period of learning about a topic',
    example: 'Today’s lesson is about the present simple.',
    category: 'study',
    related: ['library', 'notebook', 'grammar'],
  },
  {
    word: 'grammar',
    translation: 'grammatika',
    phonetic: '/ˈɡræm.ər/',
    definition: 'the rules for how words are used in a language',
    example: 'Good grammar makes your ideas clear.',
    category: 'grammar',
    related: ['lesson', 'notebook', 'sentence'],
  },
  {
    word: 'sentence',
    translation: 'gap',
    phonetic: '/ˈsen.təns/',
    definition: 'a group of words that expresses a complete idea',
    example: 'Read the sentence aloud.',
    category: 'grammar',
    related: ['grammar', 'verb', 'subject'],
  },
  {
    word: 'subject',
    translation: 'ega',
    phonetic: '/ˈsʌb.dʒɪkt/',
    definition: 'the person or thing that does the action in a sentence',
    example: 'In the sentence “She works”, “She” is the subject.',
    category: 'grammar',
    related: ['grammar', 'sentence', 'verb'],
  },
  {
    word: 'verb',
    translation: 'fe’l',
    phonetic: '/vɜːrb/',
    definition: 'a word that shows an action or state',
    example: 'The verb in “They study” is “study”.',
    category: 'grammar',
    related: ['grammar', 'sentence', 'subject'],
  },
  {
    word: 'breakfast',
    translation: 'nonushta',
    phonetic: '/ˈbrek.fəst/',
    definition: 'the first meal of the day',
    example: 'I usually eat breakfast at home.',
    category: 'daily',
    related: ['kitchen', 'morning', 'coffee'],
  },
  {
    word: 'kitchen',
    translation: 'oshxona',
    phonetic: '/ˈkɪtʃ.ən/',
    definition: 'the room where food is cooked',
    example: 'The kitchen is clean and bright.',
    category: 'daily',
    related: ['breakfast', 'morning', 'coffee'],
  },
  {
    word: 'coffee',
    translation: 'qahva',
    phonetic: '/ˈkɒf.i/',
    definition: 'a hot dark drink made from roasted beans',
    example: 'He drinks coffee before work.',
    category: 'daily',
    related: ['breakfast', 'kitchen', 'morning'],
  },
  {
    word: 'morning',
    translation: 'ertalab',
    phonetic: '/ˈmɔː.nɪŋ/',
    definition: 'the early part of the day',
    example: 'My energy is best in the morning.',
    category: 'daily',
    related: ['breakfast', 'kitchen', 'coffee'],
  },
];

export const grammarTopics: GrammarTopic[] = [
  {
    id: 'present-simple',
    label: {
      uz: 'Present Simple',
      en: 'Present Simple',
      ru: 'Present Simple',
    },
    summary: {
      uz: 'Kundalik odatlarni va doimiy faktlarni ifodalash.',
      en: 'Use it for routines and facts.',
      ru: 'Используется для привычек и фактов.',
    },
    explanation: {
      uz: 'Present Simple odatlar, jadval va umumiy haqiqatlar uchun ishlatiladi. He, she, it bilan fe’lga odatda -s qo‘shiladi.',
      en: 'Present Simple describes routines, schedules, and facts. With he, she, and it, add -s to the verb.',
      ru: 'Present Simple описывает привычки, расписание и факты. С he, she, it глагол обычно получает -s.',
    },
    example: 'She works in a bank.',
    drills: [
      {
        prompt: 'He ______ to school every day.',
        answer: 'goes',
        options: ['go', 'goes', 'going', 'gone'],
        type: 'fill-in-the-blanks',
      },
      {
        prompt: 'Choose the correct sentence.',
        answer: 'My sister likes music.',
        options: [
          'My sister like music.',
          'My sister likes music.',
          'My sister liking music.',
          'My sister is like music.',
        ],
        type: 'multiple-choice',
      },
      {
        prompt: 'they / every / study / evening / English',
        answer: 'They study English every evening.',
        type: 'sentence-builder',
      },
    ],
  },
  {
    id: 'articles',
    label: {
      uz: 'A / An artikllari',
      en: 'Articles A / An',
      ru: 'Артикли A / An',
    },
    summary: {
      uz: 'Unli va undosh tovush oldidan artikl tanlash.',
      en: 'Choose the right article before vowel and consonant sounds.',
      ru: 'Выбор правильного артикля перед гласными и согласными звуками.',
    },
    explanation: {
      uz: 'A undosh tovush bilan boshlanuvchi so‘z oldida, an esa unli tovush bilan boshlanuvchi so‘z oldida ishlatiladi.',
      en: 'Use a before a consonant sound and an before a vowel sound.',
      ru: 'Используйте a перед согласным звуком, а an перед гласным.',
    },
    example: 'an apple, a book',
    drills: [
      {
        prompt: 'It is ______ umbrella.',
        answer: 'an',
        options: ['a', 'an', 'the', 'no article'],
        type: 'fill-in-the-blanks',
      },
      {
        prompt: 'Choose the correct phrase.',
        answer: 'a university',
        options: ['an university', 'a university', 'the university', 'university'],
        type: 'multiple-choice',
      },
      {
        prompt: 'apple / is / this / an',
        answer: 'This is an apple.',
        type: 'sentence-builder',
      },
    ],
  },
  {
    id: 'want-to',
    label: {
      uz: 'Want to konstruktsiyasi',
      en: 'Want To Pattern',
      ru: 'Конструкция Want To',
    },
    summary: {
      uz: 'Want dan keyin harakat bo‘lsa, to kerak bo‘ladi.',
      en: 'Use to after want when another action follows.',
      ru: 'После want нужен to, если далее идет действие.',
    },
    explanation: {
      uz: 'Agar want dan keyin yana bir fe’l kelsa, want to + fe’l shakli ishlatiladi: I want to learn.',
      en: 'When another action follows want, use want to + verb: I want to learn.',
      ru: 'Если после want идет еще одно действие, используйте want to + глагол: I want to learn.',
    },
    example: 'I want to improve my English.',
    drills: [
      {
        prompt: 'I want ______ speak English well.',
        answer: 'to',
        options: ['to', 'for', 'at', 'with'],
        type: 'fill-in-the-blanks',
      },
      {
        prompt: 'Choose the correct sentence.',
        answer: 'They want to travel this summer.',
        options: [
          'They want travel this summer.',
          'They want to travel this summer.',
          'They wanting to travel this summer.',
          'They want travelling this summer.',
        ],
        type: 'multiple-choice',
      },
      {
        prompt: 'to / want / I / practice / more',
        answer: 'I want to practice more.',
        type: 'sentence-builder',
      },
    ],
  },
  {
    id: 'double-negative',
    label: {
      uz: 'Double Negative',
      en: 'Double Negative',
      ru: 'Двойное отрицание',
    },
    summary: {
      uz: 'Bitta gapda ikkita inkor ishlatilmaydi.',
      en: 'Avoid using two negatives in one sentence.',
      ru: 'Избегайте двух отрицаний в одном предложении.',
    },
    explanation: {
      uz: 'I don’t have anything yoki I have nothing deyiladi. I don’t have nothing xato bo‘ladi.',
      en: 'Say I don’t have anything or I have nothing. I don’t have nothing is incorrect.',
      ru: 'Говорите I don’t have anything или I have nothing. I don’t have nothing считается ошибкой.',
    },
    example: 'I don’t know anything about it.',
    drills: [
      {
        prompt: 'I don’t need ______ today.',
        answer: 'anything',
        options: ['nothing', 'anything', 'nobody', 'nowhere'],
        type: 'fill-in-the-blanks',
      },
      {
        prompt: 'Choose the correct sentence.',
        answer: 'She didn’t say anything.',
        options: [
          'She didn’t say nothing.',
          'She didn’t say anything.',
          'She not said anything.',
          'She didn’t anything say.',
        ],
        type: 'multiple-choice',
      },
      {
        prompt: 'know / I / don’t / anything / about / it',
        answer: 'I don’t know anything about it.',
        type: 'sentence-builder',
      },
    ],
  },
];

export const lessons: LessonContent[] = [
  {
    id: 'sounds-and-alphabet',
    title: {
      uz: 'Alifbo va tovushlar',
      en: 'Alphabet and Sounds',
      ru: 'Алфавит и звуки',
    },
    description: {
      uz: 'Harflar, asosiy tovushlar va oddiy talaffuz qoidalari.',
      en: 'Letters, core sounds, and simple pronunciation rules.',
      ru: 'Буквы, основные звуки и простые правила произношения.',
    },
    duration: '18 min',
    level: 'A0',
    xp: 80,
    theory: [
      {
        uz: 'Ingliz tilida harf nomi va tovush bir xil bo‘lmasligi mumkin. Masalan, A harfi /eɪ/ deb o‘qiladi.',
        en: 'In English, a letter name and its sound can be different. For example, the letter A is pronounced /eɪ/.',
        ru: 'В английском название буквы и звук часто различаются. Например, буква A читается как /eɪ/.',
      },
      {
        uz: 'Avval qisqa unli tovushlar va tez-tez uchraydigan undoshlarga e’tibor qarating: /æ/, /ɪ/, /ʌ/, /b/, /d/, /t/.',
        en: 'Start with short vowel sounds and common consonants: /æ/, /ɪ/, /ʌ/, /b/, /d/, /t/.',
        ru: 'Начните с кратких гласных и частых согласных: /æ/, /ɪ/, /ʌ/, /b/, /d/, /t/.',
      },
    ],
    keyPoints: [
      {
        uz: 'Tovushni eshitish va qaytarish yozishdan muhimroq.',
        en: 'Hearing and repeating a sound matters more than spelling at first.',
        ru: 'Сначала важнее услышать и повторить звук, чем написать его.',
      },
      {
        uz: 'Har kuni 5 ta so‘zni ovoz chiqarib aytish talaffuzni tez yaxshilaydi.',
        en: 'Reading 5 words aloud every day improves pronunciation quickly.',
        ru: 'Ежедневное произношение 5 слов вслух быстро улучшает произношение.',
      },
    ],
    examples: ['A /eɪ/, B /biː/, C /siː/', 'cat /kæt/, sit /sɪt/, cup /kʌp/'],
    guidedPractice: [
      {
        question: {
          uz: 'Qaysi so‘z /æ/ tovushiga ega?',
          en: 'Which word contains the /æ/ sound?',
          ru: 'В каком слове есть звук /æ/?',
        },
        answer: {
          uz: 'cat so‘zida /æ/ tovushi bor.',
          en: 'The word cat contains the /æ/ sound.',
          ru: 'В слове cat есть звук /æ/.',
        },
      },
    ],
    practiceFocus: { type: 'vocabulary', word: 'lesson' },
  },
  {
    id: 'greetings',
    title: {
      uz: 'Salomlashish va tanishish',
      en: 'Greetings and Introductions',
      ru: 'Приветствия и знакомство',
    },
    description: {
      uz: 'Oddiy muloqot, o‘zingizni tanishtirish va savol berish.',
      en: 'Simple communication, introducing yourself, and asking questions.',
      ru: 'Простое общение, представление себя и базовые вопросы.',
    },
    duration: '22 min',
    level: 'A1',
    xp: 120,
    theory: [
      {
        uz: 'Tanishishda qisqa va aniq gaplar ishlating: My name is Aziz. I am from Tashkent.',
        en: 'Use short, clear sentences when introducing yourself: My name is Aziz. I am from Tashkent.',
        ru: 'При знакомстве используйте короткие и ясные предложения: My name is Aziz. I am from Tashkent.',
      },
      {
        uz: 'Suhbatni davom ettirish uchun savol qaytaring: Nice to meet you. What do you do?',
        en: 'Keep the conversation going by returning a question: Nice to meet you. What do you do?',
        ru: 'Продолжайте разговор, задавая встречный вопрос: Nice to meet you. What do you do?',
      },
    ],
    keyPoints: [
      {
        uz: 'Hello va Hi norasmiy va rasmiy vaziyatlarda ishlatiladi.',
        en: 'Hello and Hi work in both casual and neutral situations.',
        ru: 'Hello и Hi подходят для неформальных и нейтральных ситуаций.',
      },
      {
        uz: 'How are you? savoliga faqat Fine emas, I’m doing well ham deyish mumkin.',
        en: 'For How are you?, you can say I’m doing well, not only Fine.',
        ru: 'На How are you? можно ответить I’m doing well, а не только Fine.',
      },
    ],
    examples: [
      'Hello, my name is Madina. Nice to meet you.',
      'I work as a designer. What about you?',
    ],
    guidedPractice: [
      {
        question: {
          uz: 'O‘zingizni ikki gap bilan tanishtiring.',
          en: 'Introduce yourself in two short sentences.',
          ru: 'Представьтесь двумя короткими предложениями.',
        },
        answer: {
          uz: 'Masalan: My name is Dilshod. I am a student.',
          en: 'For example: My name is Dilshod. I am a student.',
          ru: 'Например: My name is Dilshod. I am a student.',
        },
      },
    ],
    practiceFocus: { type: 'grammar', topicId: 'present-simple' },
  },
  {
    id: 'daily-routine',
    title: {
      uz: 'Kundalik odatlar',
      en: 'Daily Routines',
      ru: 'Повседневные привычки',
    },
    description: {
      uz: 'Kun tartibini aytish va vaqt birikmalaridan foydalanish.',
      en: 'Describing your day and using time phrases.',
      ru: 'Описание дня и использование временных выражений.',
    },
    duration: '25 min',
    level: 'A1',
    xp: 150,
    theory: [
      {
        uz: 'Kundalik odatlar uchun Present Simple ishlatiladi: I wake up at 6. She goes to work at 8.',
        en: 'Use Present Simple for routines: I wake up at 6. She goes to work at 8.',
        ru: 'Для повседневных действий используйте Present Simple: I wake up at 6. She goes to work at 8.',
      },
      {
        uz: 'Vaqt iboralari: in the morning, at night, after class, before work.',
        en: 'Common time phrases include in the morning, at night, after class, before work.',
        ru: 'Частые выражения времени: in the morning, at night, after class, before work.',
      },
    ],
    keyPoints: [
      {
        uz: 'He / she / it bilan fe’lga -s qo‘shing.',
        en: 'Add -s to the verb with he / she / it.',
        ru: 'Добавляйте -s к глаголу с he / she / it.',
      },
      {
        uz: 'Adverblarni fe’ldan oldin qo‘llang: I usually drink coffee.',
        en: 'Put adverbs before the main verb: I usually drink coffee.',
        ru: 'Ставьте наречия перед основным глаголом: I usually drink coffee.',
      },
    ],
    examples: [
      'I eat breakfast at home.',
      'She usually studies in the library after class.',
    ],
    guidedPractice: [
      {
        question: {
          uz: 'Ertalab qiladigan ikki odatingizni ayting.',
          en: 'Say two things you do in the morning.',
          ru: 'Назовите два действия, которые вы делаете утром.',
        },
        answer: {
          uz: 'Masalan: I make coffee. I read my notes.',
          en: 'For example: I make coffee. I read my notes.',
          ru: 'Например: I make coffee. I read my notes.',
        },
      },
    ],
    practiceFocus: { type: 'vocabulary', word: 'breakfast' },
  },
  {
    id: 'articles',
    title: {
      uz: 'A va an artikllari',
      en: 'Articles A and An',
      ru: 'Артикли A и An',
    },
    description: {
      uz: 'So‘z boshidagi tovushga qarab artikl tanlash.',
      en: 'Choosing the article based on the opening sound.',
      ru: 'Выбор артикля по начальному звуку слова.',
    },
    duration: '17 min',
    level: 'A1',
    xp: 110,
    theory: [
      {
        uz: 'Artikl yozilishidan ko‘ra tovush muhim: an apple, a university.',
        en: 'The sound matters more than the spelling: an apple, a university.',
        ru: 'Важен звук, а не написание: an apple, a university.',
      },
      {
        uz: 'Har safar yangi ot o‘rgansangiz, artikli bilan yodlang.',
        en: 'When you learn a noun, memorize it with its article.',
        ru: 'Когда учите существительное, запоминайте его вместе с артиклем.',
      },
    ],
    keyPoints: [
      {
        uz: 'A kitob, a job, a car.',
        en: 'a book, a job, a car.',
        ru: 'a book, a job, a car.',
      },
      {
        uz: 'An egg, an hour, an idea.',
        en: 'an egg, an hour, an idea.',
        ru: 'an egg, an hour, an idea.',
      },
    ],
    examples: ['a coffee', 'an airport announcement'],
    guidedPractice: [
      {
        question: {
          uz: 'umbrella so‘zi oldidan qaysi artikl keladi?',
          en: 'Which article comes before umbrella?',
          ru: 'Какой артикль идет перед umbrella?',
        },
        answer: {
          uz: 'An umbrella deyiladi.',
          en: 'We say an umbrella.',
          ru: 'Мы говорим an umbrella.',
        },
      },
    ],
    practiceFocus: { type: 'grammar', topicId: 'articles' },
  },
  {
    id: 'travel-basics',
    title: {
      uz: 'Sayohat uchun asosiy so‘zlar',
      en: 'Travel Basics',
      ru: 'Базовая лексика для путешествий',
    },
    description: {
      uz: 'Aeroport, chipta, pasport va sayohat iboralari.',
      en: 'Airport, ticket, passport, and travel expressions.',
      ru: 'Аэропорт, билет, паспорт и полезные фразы для поездки.',
    },
    duration: '24 min',
    level: 'A2',
    xp: 170,
    theory: [
      {
        uz: 'Sayohatda kalit so‘zlar aniq va qisqa bo‘lishi kerak: passport, boarding pass, gate, delayed flight.',
        en: 'Travel language should be short and clear: passport, boarding pass, gate, delayed flight.',
        ru: 'Речь в путешествии должна быть короткой и понятной: passport, boarding pass, gate, delayed flight.',
      },
      {
        uz: 'Savol berish namunasi: Where is gate 12? Can I see my seat number?',
        en: 'Useful questions include: Where is gate 12? Can I see my seat number?',
        ru: 'Полезные вопросы: Where is gate 12? Can I see my seat number?',
      },
    ],
    keyPoints: [
      {
        uz: 'passport, ticket, flight so‘zlarini faol ishlating.',
        en: 'Use passport, ticket, and flight actively.',
        ru: 'Активно используйте слова passport, ticket и flight.',
      },
      {
        uz: 'Aeroport savollarida polite forms muhim: Could you help me?',
        en: 'Polite forms matter at the airport: Could you help me?',
        ru: 'В аэропорту важны вежливые формы: Could you help me?',
      },
    ],
    examples: [
      'My flight is delayed by one hour.',
      'Can you check my ticket, please?',
    ],
    guidedPractice: [
      {
        question: {
          uz: 'Aeroportda yordam so‘rash uchun bitta gap tuzing.',
          en: 'Make one sentence to ask for help at the airport.',
          ru: 'Составьте одно предложение, чтобы попросить помощь в аэропорту.',
        },
        answer: {
          uz: 'Masalan: Could you help me find my gate?',
          en: 'For example: Could you help me find my gate?',
          ru: 'Например: Could you help me find my gate?',
        },
      },
    ],
    practiceFocus: { type: 'vocabulary', word: 'airport' },
  },
];

export function getVocabularyByWord(word?: string) {
  if (!word) {
    return null;
  }

  const normalized = word.toLowerCase();
  return vocabularyBank.find((entry) => entry.word.toLowerCase() === normalized) || null;
}

export function getRelatedVocabulary(word?: string) {
  const exact = getVocabularyByWord(word);

  if (exact) {
    return vocabularyBank.filter(
      (entry) =>
        entry.category === exact.category || exact.related.includes(entry.word),
    );
  }

  return vocabularyBank;
}

export function getGrammarTopic(topicId?: string) {
  if (!topicId) {
    return grammarTopics[0];
  }

  return grammarTopics.find((topic) => topic.id === topicId) || grammarTopics[0];
}

vocabularyBank.push(
  {
    word: 'application',
    translation: 'ariza',
    phonetic: '/ap.li.key.shn/',
    definition: 'a formal request or document',
    example: 'She sent her university application on Monday.',
    category: 'study',
    related: ['library', 'lesson', 'grammar'],
  },
  {
    word: 'research',
    translation: 'tadqiqot',
    phonetic: '/ri.surtsh/',
    definition: 'careful study to learn new facts',
    example: 'Our research focuses on language learning habits.',
    category: 'study',
    related: ['library', 'lesson', 'grammar'],
  },
  {
    word: 'opportunity',
    translation: 'imkoniyat',
    phonetic: '/o.pur.tu.nuh.tee/',
    definition: 'a good chance to do something',
    example: 'This course is a great opportunity to improve your English.',
    category: 'work',
    related: ['project', 'meeting', 'deadline'],
  },
  {
    word: 'conference',
    translation: 'konferensiya',
    phonetic: '/kon.fuh.rns/',
    definition: 'a large formal meeting',
    example: 'He gave a short talk at the conference.',
    category: 'work',
    related: ['meeting', 'project', 'schedule'],
  },
  {
    word: 'analysis',
    translation: 'tahlil',
    phonetic: '/uh.na.luh.sis/',
    definition: 'careful examination of something',
    example: 'The chart analysis shows a steady increase.',
    category: 'study',
    related: ['research', 'grammar', 'sentence'],
  },
  {
    word: 'policy',
    translation: 'siyosat qoidasi',
    phonetic: '/po.luh.see/',
    definition: 'an official rule or plan',
    example: 'The company policy changed last month.',
    category: 'work',
    related: ['project', 'meeting', 'deadline'],
  },
  {
    word: 'sustainable',
    translation: 'barqaror',
    phonetic: '/suh.stey.nuh.bl/',
    definition: 'able to continue without causing major harm',
    example: 'The city wants a more sustainable transport system.',
    category: 'daily',
    related: ['project', 'research', 'analysis'],
  },
  {
    word: 'essay',
    translation: 'insho',
    phonetic: '/e.sey/',
    definition: 'a short piece of formal writing',
    example: 'She wrote a clear essay about technology in education.',
    category: 'study',
    related: ['grammar', 'sentence', 'research'],
  },
);

lessons.push(
  {
    id: 'present-continuous',
    title: {
      uz: 'Hozir davom etayotgan ishlar',
      en: 'Present Continuous',
      ru: 'Present Continuous',
    },
    description: {
      uz: 'Ayni paytda bolayotgan harakatlarni tasvirlash.',
      en: 'Describe actions happening right now.',
      ru: 'Описание действий, происходящих прямо сейчас.',
    },
    duration: '22 min',
    level: 'A2',
    xp: 180,
    theory: [
      {
        uz: 'Present Continuous hozir sodir bolayotgan harakat uchun ishlatiladi: I am reading now.',
        en: 'Present Continuous is used for actions happening now: I am reading now.',
        ru: 'Present Continuous используется для действий, происходящих сейчас: I am reading now.',
      },
      {
        uz: 'To be + verb-ing shakli asosiy qolip hisoblanadi.',
        en: 'The basic structure is to be + verb-ing.',
        ru: 'Основная структура: to be + verb-ing.',
      },
    ],
    keyPoints: [
      {
        uz: 'I am, you are, he is shakllarini aralashtirmang.',
        en: 'Do not mix up I am, you are, and he is.',
        ru: 'Не путайте формы I am, you are и he is.',
      },
      {
        uz: 'Time markers: now, right now, at the moment.',
        en: 'Time markers: now, right now, at the moment.',
        ru: 'Маркеры времени: now, right now, at the moment.',
      },
    ],
    examples: ['She is speaking to her teacher.', 'They are waiting for the bus.'],
    guidedPractice: [
      {
        question: {
          uz: 'Ayni paytda qilayotgan bitta ishni ayting.',
          en: 'Say one thing you are doing right now.',
          ru: 'Назовите одно действие, которое вы делаете сейчас.',
        },
        answer: {
          uz: 'Masalan: I am learning English now.',
          en: 'For example: I am learning English now.',
          ru: 'Например: I am learning English now.',
        },
      },
    ],
    practiceFocus: { type: 'grammar', topicId: 'present-simple' },
  },
  {
    id: 'reading-basics',
    title: {
      uz: "O'qish va asosiy ma'no",
      en: 'Reading Basics',
      ru: 'Базовое чтение',
    },
    description: {
      uz: 'Qisqa matndan asosiy fikrni topish.',
      en: 'Find the main idea in short texts.',
      ru: 'Поиск главной идеи в коротком тексте.',
    },
    duration: '28 min',
    level: 'A2',
    xp: 190,
    theory: [
      {
        uz: "Readingda avval savolni o'qing, keyin matnni ko'zdan kechiring.",
        en: 'In reading, look at the question first and then scan the text.',
        ru: 'В чтении сначала посмотрите вопрос, затем быстро просмотрите текст.',
      },
      {
        uz: "Kalit so'zlar va time markerlar asosiy ma'noni topishga yordam beradi.",
        en: 'Key words and time markers help you find the main idea.',
        ru: 'Ключевые слова и временные маркеры помогают найти основную мысль.',
      },
    ],
    keyPoints: [
      {
        uz: 'Skimming va scanning ikkalasini ham mashq qiling.',
        en: 'Practice both skimming and scanning.',
        ru: 'Тренируйте и skimming, и scanning.',
      },
      {
        uz: "Har paragrafning bitta asosiy g'oyasi bo'ladi.",
        en: 'Each paragraph usually has one main idea.',
        ru: 'У каждого абзаца обычно есть одна основная мысль.',
      },
    ],
    examples: ['Read the title first.', 'Underline repeated ideas and topic words.'],
    guidedPractice: [
      {
        question: {
          uz: "Qisqa paragrafdan eng muhim bitta gapni toping.",
          en: 'Find the most important sentence in a short paragraph.',
          ru: 'Найдите самое важное предложение в коротком абзаце.',
        },
        answer: {
          uz: "Odatda topic sentence paragraf boshida yoki oxirida bo'ladi.",
          en: 'The topic sentence is often near the beginning or end.',
          ru: 'Тематическое предложение часто находится в начале или конце.',
        },
      },
    ],
    practiceFocus: { type: 'vocabulary', word: 'research' },
  },
  {
    id: 'opinion-writing',
    title: {
      uz: 'Opinion writing va essay',
      en: 'Opinion Writing and Essays',
      ru: 'Opinion writing и essays',
    },
    description: {
      uz: "Oddiy fikr bildirishdan IELTS uslubidagi essegacha o'tish.",
      en: 'Move from simple opinions to IELTS-style essays.',
      ru: 'Переход от простого мнения к эссе в стиле IELTS.',
    },
    duration: '35 min',
    level: 'B1',
    xp: 240,
    theory: [
      {
        uz: "Essay kirish, asosiy paragraf va xulosadan iborat bo'ladi.",
        en: 'An essay includes an introduction, body paragraph, and conclusion.',
        ru: 'Эссе состоит из вступления, основной части и заключения.',
      },
      {
        uz: "Har paragraf bitta asosiy fikrni aniq misol bilan ochishi kerak.",
        en: 'Each paragraph should develop one main point with a clear example.',
        ru: 'Каждый абзац должен раскрывать одну основную мысль с ясным примером.',
      },
    ],
    keyPoints: [
      {
        uz: 'Opinion paragraph uchun: point, reason, example.',
        en: 'For an opinion paragraph use point, reason, example.',
        ru: 'Для абзаца-мнения используйте point, reason, example.',
      },
      {
        uz: 'IELTS writingda linking words juda muhim.',
        en: 'Linking words are very important in IELTS writing.',
        ru: 'Связующие слова очень важны в IELTS writing.',
      },
    ],
    examples: [
      'In my opinion, online learning is useful because it saves time.',
      'However, face-to-face classes can offer better interaction.',
    ],
    guidedPractice: [
      {
        question: {
          uz: 'Bitta mavzu boyicha 3 gaplik opinion paragraph yozing.',
          en: 'Write a 3-sentence opinion paragraph on one topic.',
          ru: 'Напишите абзац-мнение из 3 предложений на одну тему.',
        },
        answer: {
          uz: 'Avval fikr, keyin sabab, keyin misol yozing.',
          en: 'Start with your opinion, then the reason, then an example.',
          ru: 'Сначала мнение, затем причина, затем пример.',
        },
      },
    ],
    practiceFocus: { type: 'vocabulary', word: 'essay' },
  },
  {
    id: 'ielts-speaking-writing',
    title: {
      uz: 'IELTS speaking va writing',
      en: 'IELTS Speaking and Writing',
      ru: 'IELTS speaking и writing',
    },
    description: {
      uz: "Murakkab savolga strukturali javob berish va formal esse yozish.",
      en: 'Give structured answers to difficult prompts and write formal essays.',
      ru: 'Структурированные ответы на сложные вопросы и формальные эссе.',
    },
    duration: '42 min',
    level: 'C1',
    xp: 320,
    theory: [
      {
        uz: "IELTS speakingda idea + reason + example + short conclusion ishlaydi.",
        en: 'In IELTS speaking, idea + reason + example + short conclusion works well.',
        ru: 'В IELTS speaking хорошо работает схема idea + reason + example + short conclusion.',
      },
      {
        uz: "Writing tasklarda aniqlik, coherence va vocabulary range bir xil muhim.",
        en: 'In writing tasks, clarity, coherence, and vocabulary range matter equally.',
        ru: 'В письменных заданиях одинаково важны ясность, coherence и vocabulary range.',
      },
    ],
    keyPoints: [
      {
        uz: 'Band descriptorga yaqin yozish uchun paragraf mantiqini saqlang.',
        en: 'Keep paragraph logic clear to write closer to IELTS band descriptors.',
        ru: 'Сохраняйте логику абзацев, чтобы писать ближе к критериям IELTS.',
      },
      {
        uz: 'Formal style, varied grammar, and precise examples matter.',
        en: 'Formal style, varied grammar, and precise examples matter.',
        ru: 'Важны формальный стиль, разнообразная грамматика и точные примеры.',
      },
    ],
    examples: [
      'One major advantage is that public transport reduces congestion.',
      'This trend is likely to continue unless strong policy changes are introduced.',
    ],
    guidedPractice: [
      {
        question: {
          uz: 'Murakkab mavzu boyicha 2 argument va 1 xulosa tuzing.',
          en: 'Build 2 arguments and 1 conclusion for a complex topic.',
          ru: 'Составьте 2 аргумента и 1 вывод по сложной теме.',
        },
        answer: {
          uz: "Har argumentga alohida misol qo'shing.",
          en: 'Add a separate example to each argument.',
          ru: 'Добавляйте отдельный пример к каждому аргументу.',
        },
      },
    ],
    practiceFocus: { type: 'vocabulary', word: 'analysis' },
  },
);

export const readingPassages: ReadingPassage[] = [
  {
    id: 'reading-a0-first-words',
    level: 'A0',
    title: {
      uz: 'Birinchi sozlar',
      en: 'First Words',
      ru: 'Pervye slova',
    },
    passage: 'This is Ali. Ali is a student. He has a book and a pen. He is happy.',
    questions: [
      {
        question: 'Who is Ali?',
        options: ['A teacher', 'A student', 'A driver', 'A doctor'],
        answer: 'A student',
        explanation: {
          uz: 'Matnda Ali is a student deb yozilgan.',
          en: 'The passage says Ali is a student.',
          ru: 'V tekste skazano, chto Ali student.',
        },
      },
      {
        question: 'What does he have?',
        options: ['A pen and a book', 'A bag and a phone', 'A car and a key', 'A map and a cup'],
        answer: 'A pen and a book',
        explanation: {
          uz: 'He has a book and a pen deyiladi.',
          en: 'The text says he has a book and a pen.',
          ru: 'V tekste skazano, chto u nego est kniga i ruchka.',
        },
      },
    ],
  },
  {
    id: 'reading-a1-routine',
    level: 'A1',
    title: {
      uz: 'Ali ning ertalabi',
      en: "Ali's Morning",
      ru: 'Утро Али',
    },
    passage: 'Ali wakes up at 6:30. He drinks tea and eats bread for breakfast. At 7:30 he walks to school with his sister.',
    questions: [
      {
        question: 'What does Ali drink in the morning?',
        options: ['Coffee', 'Tea', 'Milk', 'Juice'],
        answer: 'Tea',
        explanation: {
          uz: "Matnda Ali drinks tea deb aytilgan.",
          en: 'The text says Ali drinks tea.',
          ru: 'В тексте сказано, что Али пьет чай.',
        },
      },
      {
        question: 'How does he go to school?',
        options: ['By bus', 'By car', 'On foot', 'By train'],
        answer: 'On foot',
        explanation: {
          uz: "He walks to school - bu piyoda degani.",
          en: '"He walks to school" means he goes on foot.',
          ru: '"He walks to school" означает, что он идет пешком.',
        },
      },
    ],
  },
  {
    id: 'reading-a2-library',
    level: 'A2',
    title: {
      uz: 'Yangi kutubxona qoidasi',
      en: 'The New Library Rule',
      ru: 'Новое правило библиотеки',
    },
    passage: 'The city library has introduced a new study zone for students. People can now book a quiet desk for two hours. The library hopes this change will help more young people prepare for exams.',
    questions: [
      {
        question: 'Why was the new study zone created?',
        options: ['To sell books', 'To help students study', 'To hold concerts', 'To close early'],
        answer: 'To help students study',
        explanation: {
          uz: 'Matn examga tayyorlanishga yordam berishini aytadi.',
          en: 'The passage says it will help students prepare for exams.',
          ru: 'В тексте сказано, что это поможет студентам готовиться к экзаменам.',
        },
      },
      {
        question: 'How long can a desk be booked?',
        options: ['One hour', 'Two hours', 'Three hours', 'All day'],
        answer: 'Two hours',
        explanation: {
          uz: 'Desk two hours uchun bron qilinadi.',
          en: 'The desk can be booked for two hours.',
          ru: 'Стол можно забронировать на два часа.',
        },
      },
    ],
  },
  {
    id: 'reading-b1-transport',
    level: 'B1',
    title: {
      uz: 'Shahar transportidagi ozgarish',
      en: 'A Change in City Transport',
      ru: 'Изменение в городском транспорте',
    },
    passage: 'Last year, the city introduced a digital ticket system on all buses. At first, many passengers complained because they were not familiar with the new app. However, after several months, most people agreed that the system was faster and reduced long lines at bus stations.',
    questions: [
      {
        question: 'Why did people complain at first?',
        options: ['The buses were late', 'The app was unfamiliar', 'Tickets were too cheap', 'Stations were closed'],
        answer: 'The app was unfamiliar',
        explanation: {
          uz: 'Matnda they were not familiar with the new app deyiladi.',
          en: 'The passage says people were not familiar with the app.',
          ru: 'В тексте сказано, что люди не были знакомы с приложением.',
        },
      },
      {
        question: 'What was one positive result of the system?',
        options: ['More buses', 'Longer lines', 'Faster boarding', 'Cheaper phones'],
        answer: 'Faster boarding',
        explanation: {
          uz: 'System faster bolgani va lines kamaygani aytilgan.',
          en: 'It became faster and reduced long lines.',
          ru: 'Система стала быстрее и сократила длинные очереди.',
        },
      },
    ],
  },
  {
    id: 'reading-b2-education',
    level: 'B2',
    title: {
      uz: "Onlayn ta'limning ta'siri",
      en: 'The Impact of Online Education',
      ru: 'Влияние онлайн-образования',
    },
    passage: 'Online education has expanded access to learning for millions of people, especially those who live far from major cities. Nevertheless, access alone does not guarantee success. Students still need structure, motivation, and feedback if they want to make meaningful progress.',
    questions: [
      {
        question: 'What is the main idea of the passage?',
        options: ['Online education is always better', 'Access is useful but not enough on its own', 'Cities do not need schools', 'Feedback is unnecessary'],
        answer: 'Access is useful but not enough on its own',
        explanation: {
          uz: "Asosiy fikr: access foydali, lekin o'zi yetmaydi.",
          en: 'The main idea is that access helps, but success needs more than access.',
          ru: 'Главная идея: доступ помогает, но для успеха нужно нечто большее.',
        },
      },
      {
        question: 'Which factor is NOT mentioned as important?',
        options: ['Structure', 'Motivation', 'Feedback', 'Luck'],
        answer: 'Luck',
        explanation: {
          uz: 'Luck matnda tilga olinmagan.',
          en: 'Luck is not mentioned in the passage.',
          ru: 'Luck в тексте не упоминается.',
        },
      },
    ],
  },
];

export const writingPrompts: WritingPrompt[] = [
  {
    id: 'writing-a0-first-lines',
    level: 'A0',
    title: {
      uz: 'Juda oddiy gaplar',
      en: 'Very Simple Sentences',
      ru: 'Ochen prostye predlozheniya',
    },
    instructions: {
      uz: '4 ta juda oddiy gap yozing: ismingiz, shahringiz, bir yoqtirgan narsangiz va bugun nima qilayotganingiz haqida.',
      en: 'Write 4 very simple sentences about your name, city, one thing you like, and what you are doing today.',
      ru: 'Napishite 4 prostyh predlozheniya o svoem imeni, gorode, tom chto vam nravitsya i chto vy delaete segodnya.',
    },
    minimumWords: 18,
    outlineTips: ['My name is ...', 'I live in ...', 'I like ...', 'Today I ...'],
  },
  {
    id: 'writing-a1-self',
    level: 'A1',
    title: {
      uz: "O'zingiz haqingizda yozing",
      en: 'Write About Yourself',
      ru: 'Напишите о себе',
    },
    instructions: {
      uz: "3-4 gap bilan ismingiz, shahringiz va nima qilishni yoqtirishingiz haqida yozing.",
      en: 'Write 3-4 sentences about your name, city, and what you like doing.',
      ru: 'Напишите 3-4 предложения о своем имени, городе и любимом занятии.',
    },
    minimumWords: 25,
    outlineTips: ['My name is ...', 'I live in ...', 'I like ...'],
  },
  {
    id: 'writing-a2-routine',
    level: 'A2',
    title: {
      uz: 'Kundalik hayotim',
      en: 'My Daily Routine',
      ru: 'Мой распорядок дня',
    },
    instructions: {
      uz: "5-6 gap bilan odatiy kuningizni yozing. Time marker ishlating.",
      en: 'Write 5-6 sentences about your usual day. Use time markers.',
      ru: 'Напишите 5-6 предложений о своем обычном дне. Используйте маркеры времени.',
    },
    minimumWords: 45,
    outlineTips: ['In the morning...', 'After work...', 'In the evening...'],
  },
  {
    id: 'writing-b1-opinion',
    level: 'B1',
    title: {
      uz: 'Opinion paragraph',
      en: 'Opinion Paragraph',
      ru: 'Абзац-мнение',
    },
    instructions: {
      uz: "Texnologiya ta'limni yaxshilaydimi degan savolga 1 paragraf yozing.",
      en: 'Write one paragraph on whether technology improves education.',
      ru: 'Напишите один абзац о том, улучшает ли технология образование.',
    },
    minimumWords: 80,
    outlineTips: ['State your opinion', 'Give one reason', 'Add one example'],
  },
  {
    id: 'writing-b2-essay',
    level: 'B2',
    title: {
      uz: 'Muammo va yechim esse',
      en: 'Problem-Solution Essay',
      ru: 'Эссе проблема-решение',
    },
    instructions: {
      uz: "Shahar tirbandligi muammosi va yechimlari haqida 2 paragraf yozing.",
      en: 'Write a 2-paragraph essay about city traffic problems and solutions.',
      ru: 'Напишите эссе из 2 абзацев о проблемах городских пробок и решениях.',
    },
    minimumWords: 130,
    outlineTips: ['Introduce the problem', 'Explain causes', 'Suggest realistic solutions'],
  },
  {
    id: 'writing-c1-ielts',
    level: 'C1',
    title: {
      uz: 'IELTS task style essay',
      en: 'IELTS Task Style Essay',
      ru: 'Эссе в стиле IELTS Task',
    },
    instructions: {
      uz: "Ba'zi odamlar onlayn ish ofis ishidan samaraliroq deydi. Siz qanchalik rozi yoki norozisiz? Strukturali esse yozing.",
      en: 'Some people say remote work is more effective than office work. To what extent do you agree? Write a structured essay.',
      ru: 'Некоторые считают, что удаленная работа эффективнее офисной. Насколько вы согласны? Напишите структурированное эссе.',
    },
    minimumWords: 220,
    outlineTips: ['Clear introduction', 'Balanced argument', 'Specific examples', 'Short conclusion'],
  },
];

const generatedLessonThemes = [
  {
    uz: 'Speaking va dialog',
    en: 'Speaking and dialogue',
    ru: 'Speaking and dialogue',
  },
  {
    uz: 'Listening va tushunish',
    en: 'Listening and comprehension',
    ru: 'Listening and comprehension',
  },
  {
    uz: 'Reading va detail topish',
    en: 'Reading and finding details',
    ru: 'Reading and finding details',
  },
  {
    uz: 'Writing va gap qurish',
    en: 'Writing and sentence building',
    ru: 'Writing and sentence building',
  },
  {
    uz: 'Grammar nazorat',
    en: 'Grammar control',
    ru: 'Grammar control',
  },
  {
    uz: 'Vocabulary expansion',
    en: 'Vocabulary expansion',
    ru: 'Vocabulary expansion',
  },
];

const generatedLevelPlans = [
  { level: 'A0', count: 90, xp: 45, focus: 'short, direct, and guided' },
  { level: 'A1', count: 90, xp: 55, focus: 'basic communication and routines' },
  { level: 'A2', count: 90, xp: 70, focus: 'longer daily language and control' },
  { level: 'B1', count: 90, xp: 85, focus: 'paragraphs, opinions, and speaking flow' },
  { level: 'B2', count: 90, xp: 100, focus: 'essay building and detailed comprehension' },
  { level: 'C1', count: 90, xp: 120, focus: 'advanced structure, nuance, and IELTS-style control' },
  { level: 'IELTS', count: 60, xp: 145, focus: 'timed answers, exam strategy, and band-ready control' },
];

function createGeneratedLessons(): LessonContent[] {
  const generated: LessonContent[] = [];
  let cursor = 0;

  generatedLevelPlans.forEach((plan) => {
    for (let index = 1; index <= plan.count; index += 1) {
      const theme = generatedLessonThemes[(index - 1) % generatedLessonThemes.length];
      const vocab = vocabularyBank[cursor % vocabularyBank.length];
      const grammar = grammarTopics[cursor % grammarTopics.length];
      const practiceFocus =
        index % 2 === 0
          ? { type: 'vocabulary' as const, word: vocab.word }
          : { type: 'grammar' as const, topicId: grammar.id };

      generated.push({
        id: `generated-${plan.level.toLowerCase()}-${index}`,
        title: {
          uz: `${plan.level} ${index}-dars: ${theme.uz}`,
          en: `${plan.level} Lesson ${index}: ${theme.en}`,
          ru: `${plan.level} Lesson ${index}: ${theme.ru}`,
        },
        description: {
          uz: `${plan.level} bosqichidagi ${theme.uz.toLowerCase()} bo'yicha real mashg'ulot. Fokus: ${plan.focus}.`,
          en: `A real ${theme.en.toLowerCase()} session for ${plan.level}. Focus: ${plan.focus}.`,
          ru: `A real ${theme.ru.toLowerCase()} session for ${plan.level}. Focus: ${plan.focus}.`,
        },
        duration: `${18 + (index % 5) * 4} min`,
        level: plan.level,
        xp: plan.xp + (index % 5) * 5,
        theory: [
          {
            uz: `${theme.uz} darsida avval modelni ko'ring, keyin o'zingiz takrorlang. Bu bosqichda asosiy maqsad aniq va nazoratli progress.`,
            en: `In this ${theme.en.toLowerCase()} lesson, study the model first and then repeat it yourself. The main goal is clear, controlled progress.`,
            ru: `In this ${theme.ru.toLowerCase()} lesson, study the model first and then repeat it yourself. The main goal is clear, controlled progress.`,
          },
          {
            uz: `${vocab.word} va ${grammar.label.uz} shu darsdagi tayanch nuqtalar hisoblanadi. Ularni gap ichida ishlatish kerak.`,
            en: `${vocab.word} and ${grammar.label.en} are the support points of this lesson. They should be used inside real sentences.`,
            ru: `${vocab.word} and ${grammar.label.en} are the support points of this lesson. They should be used inside real sentences.`,
          },
        ],
        keyPoints: [
          {
            uz: `Dars ${index} uchun birinchi vazifa: qisqa, to'g'ri va aniq gap tuzish.`,
            en: `First task for lesson ${index}: build a short, correct, and clear sentence.`,
            ru: `First task for lesson ${index}: build a short, correct, and clear sentence.`,
          },
          {
            uz: `Ikkinchi vazifa: ${theme.uz.toLowerCase()} ichida ${vocab.word} yoki ${grammar.label.uz} ni faol ishlatish.`,
            en: `Second task: use ${vocab.word} or ${grammar.label.en} actively inside ${theme.en.toLowerCase()}.`,
            ru: `Second task: use ${vocab.word} or ${grammar.label.en} actively inside ${theme.ru.toLowerCase()}.`,
          },
        ],
        examples: [
          `I use ${vocab.word} in a real sentence.`,
          `${grammar.example}`,
        ],
        guidedPractice: [
          {
            question: {
              uz: `${vocab.word} so'zi bilan bitta sodda gap ayting.`,
              en: `Say one simple sentence with ${vocab.word}.`,
              ru: `Say one simple sentence with ${vocab.word}.`,
            },
            answer: {
              uz: `Masalan: ${vocab.example}`,
              en: `For example: ${vocab.example}`,
              ru: `For example: ${vocab.example}`,
            },
          },
          {
            question: {
              uz: `${grammar.label.uz} bo'yicha shu darsdagi modelni takrorlang.`,
              en: `Repeat the model for ${grammar.label.en} in this lesson.`,
              ru: `Repeat the model for ${grammar.label.en} in this lesson.`,
            },
            answer: {
              uz: grammar.explanation.uz,
              en: grammar.explanation.en,
              ru: grammar.explanation.ru,
            },
          },
        ],
        practiceFocus,
      });

      cursor += 1;
    }
  });

  return generated;
}

lessons.push(...createGeneratedLessons());

function createGeneratedReadingPassages(): ReadingPassage[] {
  const generated: ReadingPassage[] = [];
  let cursor = 0;

  generatedLevelPlans.forEach((plan) => {
    for (let index = 1; index <= Math.max(24, Math.round(plan.count / 4)); index += 1) {
      const vocab = vocabularyBank[cursor % vocabularyBank.length];
      const support = vocabularyBank[(cursor + 9) % vocabularyBank.length];
      const grammar = grammarTopics[cursor % grammarTopics.length];

      generated.push({
        id: `generated-reading-${plan.level.toLowerCase()}-${index}`,
        level: plan.level,
        title: {
          uz: `${plan.level} reading ${index}`,
          en: `${plan.level} reading ${index}`,
          ru: `${plan.level} reading ${index}`,
        },
        passage:
          `This ${plan.level} reading passage focuses on ${vocab.word} and ${support.word}. `
          + `Learners review the pattern "${grammar.example}" while building ${plan.focus}. `
          + `Lesson ${index} asks the learner to read for detail, main idea, and useful language.`,
        questions: [
          {
            question: 'Which vocabulary word is part of this passage focus?',
            options: [vocab.word, support.related[0] || 'market', 'window', 'forest'],
            answer: vocab.word,
            explanation: {
              uz: `${vocab.word} passage ichida asosiy tayanch soz sifatida berilgan.`,
              en: `${vocab.word} is named directly as one of the support words in the passage.`,
              ru: `${vocab.word} is named directly as one of the support words in the passage.`,
            },
          },
          {
            question: 'What else does the learner review?',
            options: ['A random poem', 'A grammar pattern', 'A travel ticket', 'A map legend'],
            answer: 'A grammar pattern',
            explanation: {
              uz: 'Matnda grammar pattern qayta korilishi aytilgan.',
              en: 'The passage says the learner reviews a grammar pattern.',
              ru: 'The passage says the learner reviews a grammar pattern.',
            },
          },
          {
            question: 'What skill is practiced most clearly?',
            options: ['Reading for detail', 'Drawing', 'Cooking', 'Typing speed'],
            answer: 'Reading for detail',
            explanation: {
              uz: 'Passage detail va main idea topishga qaratilgan.',
              en: 'The passage is built around reading for detail and main idea.',
              ru: 'The passage is built around reading for detail and main idea.',
            },
          },
        ],
      });

      cursor += 1;
    }
  });

  return generated;
}

function createGeneratedWritingPrompts(): WritingPrompt[] {
  const generated: WritingPrompt[] = [];
  let cursor = 0;

  generatedLevelPlans.forEach((plan) => {
    for (let index = 1; index <= Math.max(18, Math.round(plan.count / 5)); index += 1) {
      const vocab = vocabularyBank[cursor % vocabularyBank.length];
      const grammar = grammarTopics[cursor % grammarTopics.length];
      const minimumWords =
        plan.level === 'A0'
          ? 20
          : plan.level === 'A1'
            ? 35
            : plan.level === 'A2'
              ? 60
              : plan.level === 'B1'
                ? 95
                : plan.level === 'B2'
                  ? 140
                  : plan.level === 'C1'
                    ? 190
                    : 240;

      generated.push({
        id: `generated-writing-${plan.level.toLowerCase()}-${index}`,
        level: plan.level,
        title: {
          uz: `${plan.level} writing ${index}`,
          en: `${plan.level} writing ${index}`,
          ru: `${plan.level} writing ${index}`,
        },
        instructions: {
          uz: `${vocab.word} va "${grammar.example}" modelidan foydalanib ${plan.focus} yonalishida yozing. Lesson ${index} uchun aniq, mantiqli va real misol keltiring.`,
          en: `Write about ${vocab.word} and use the model "${grammar.example}" with a focus on ${plan.focus}. For lesson ${index}, keep the answer clear, logical, and supported by a real example.`,
          ru: `Write about ${vocab.word} and use the model "${grammar.example}" with a focus on ${plan.focus}. For lesson ${index}, keep the answer clear, logical, and supported by a real example.`,
        },
        minimumWords,
        outlineTips: [
          'Start with one clear main idea',
          `Use ${vocab.word} naturally`,
          `Add one line with ${grammar.label.en}`,
          'Finish with one supporting detail',
        ],
      });

      cursor += 1;
    }
  });

  return generated;
}

readingPassages.push(...createGeneratedReadingPassages());
writingPrompts.push(...createGeneratedWritingPrompts());
