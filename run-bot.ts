import fs from 'node:fs';
import path from 'node:path';
import { vocabularyBank } from './src/lib/courseData';

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat?: { id?: number };
    from?: { first_name?: string; username?: string };
    text?: string;
    voice?: { file_id: string };
  };
};

type BotProfile = {
  chatId: number;
  firstName?: string;
  username?: string;
  startedAt: string;
  lastSeenDate: string;
  streak: number;
  reminderEnabled: boolean;
  reminderSentDate?: string;
  streakWarningSentDate?: string;
  feedbackMode?: boolean;
  quiz?: {
    answer: string;
    options: string[];
    word: string;
  } | null;
  totalQuizzes: number;
  correctQuizzes: number;
};

type BotStore = Record<string, BotProfile>;

const DEFAULT_BOT_TOKEN = '8613251282:AAED129hQ2froittgyZX0Q1G9hv06imOxiE';
const DEFAULT_WEB_APP_URL = 'https://sora-production-658d.up.railway.app';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || DEFAULT_BOT_TOKEN;
const WEB_APP_URL = process.env.TELEGRAM_WEBAPP_URL || process.env.WEB_APP_URL || DEFAULT_WEB_APP_URL;
const BOT_API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : '';
const STORE_PATH = path.join(process.cwd(), 'bot-data.json');

function readStore(): BotStore {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as BotStore;
  } catch {
    return {};
  }
}

function writeStore(store: BotStore) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function tashkentParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const lookup = (type: string) => parts.find((part) => part.type === type)?.value || '00';
  return {
    dateKey: `${lookup('year')}-${lookup('month')}-${lookup('day')}`,
    hour: Number(lookup('hour')),
    minute: Number(lookup('minute')),
  };
}

function yesterdayKey() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return tashkentParts(date).dateKey;
}

function buildUrl(route = '/dashboard') {
  const base = WEB_APP_URL.replace(/\/$/, '');
  const nextRoute = route.startsWith('/') ? route : `/${route}`;
  return `${base}${nextRoute}`;
}

function createPersistentKeyboard() {
  return {
    keyboard: [
      [{ text: '🚀 Open Sora AI' }, { text: '🎯 Level Test' }],
      [{ text: '📅 Daily Mission' }, { text: '🧠 Mini Quiz' }],
      [{ text: '📚 Word of the Day' }, { text: '📈 Progress' }],
      [{ text: '🎙 Speaking Prompt' }, { text: '🤝 Invite' }],
      [{ text: '💬 Feedback' }, { text: '🆘 Support' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

function createOpenAppMarkup(route = '/dashboard') {
  const url = buildUrl(route);
  if (url.startsWith('https://')) {
    return { inline_keyboard: [[{ text: '🚀 Open Sora AI', web_app: { url } }]] };
  }

  return { inline_keyboard: [[{ text: '🚀 Open Sora AI', url }]] };
}

function createStartInlineMarkup() {
  const openButton = buildUrl('/dashboard').startsWith('https://')
    ? { text: '🚀 Open App', web_app: { url: buildUrl('/dashboard') } }
    : { text: '🚀 Open App', url: buildUrl('/dashboard') };

  return {
    inline_keyboard: [
      [openButton],
      [
        { text: '🎯 Level Test', url: buildUrl('/placement-test') },
        { text: '📅 Daily Mission', url: buildUrl('/dashboard') },
      ],
      [
        { text: '🎧 Listening', url: buildUrl('/practice') },
        { text: '🎙 Speaking', url: buildUrl('/practice') },
      ],
      [
        { text: '🤝 Invite', url: buildUrl('/referral') },
        { text: '👤 Profile', url: buildUrl('/profile') },
      ],
    ],
  };
}

async function telegramRequest<T>(method: string, payload: Record<string, unknown>) {
  const response = await fetch(`${BOT_API_BASE}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json() as { ok?: boolean; result?: T; description?: string; error_code?: number };
  if (!response.ok || !data.ok) {
    throw new Error(`${method} failed: ${data.error_code ?? response.status} ${data.description ?? response.statusText}`);
  }

  return data.result as T;
}

function ensureProfile(chatId: number, firstName?: string, username?: string) {
  const store = readStore();
  const today = tashkentParts().dateKey;
  const existing = store[String(chatId)];

  if (existing) {
    if (existing.lastSeenDate !== today) {
      existing.streak = existing.lastSeenDate === yesterdayKey() ? existing.streak + 1 : 1;
      existing.lastSeenDate = today;
      existing.streakWarningSentDate = undefined;
    }
    existing.firstName = firstName || existing.firstName;
    existing.username = username || existing.username;
    store[String(chatId)] = existing;
    writeStore(store);
    return existing;
  }

  const profile: BotProfile = {
    chatId,
    firstName,
    username,
    startedAt: new Date().toISOString(),
    lastSeenDate: today,
    streak: 1,
    reminderEnabled: true,
    totalQuizzes: 0,
    correctQuizzes: 0,
    quiz: null,
  };

  store[String(chatId)] = profile;
  writeStore(store);
  return profile;
}

function updateProfile(chatId: number, updater: (profile: BotProfile) => BotProfile) {
  const store = readStore();
  const current = store[String(chatId)];
  if (!current) {
    return null;
  }
  const next = updater(current);
  store[String(chatId)] = next;
  writeStore(store);
  return next;
}

function wordOfTheDay() {
  const { dateKey } = tashkentParts();
  const seed = dateKey.split('-').join('').split('').reduce((total, value) => total + Number(value), 0);
  return vocabularyBank[seed % vocabularyBank.length];
}

function buildDailyMissionText(profile: BotProfile) {
  return [
    '📅 *Today\'s Sora Mission*',
    '',
    '1. 📘 5 min lesson review',
    '2. 🧠 4 min SRS vocabulary',
    '3. 🎧 4 min listening lab',
    '4. ✍️ 4 min writing check',
    '5. 🎙 3 min speaking roleplay',
    '',
    `🔥 Current streak: ${profile.streak} day(s)`,
    'Open the app and finish the mission in about 20 minutes.',
  ].join('\n');
}

function createQuiz() {
  const word = vocabularyBank[Math.floor(Math.random() * vocabularyBank.length)];
  const distractors = vocabularyBank
    .filter((entry) => entry.word !== word.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((entry) => entry.word);
  const options = [word.word, ...distractors].sort(() => Math.random() - 0.5);
  return {
    answer: word.word,
    options,
    word,
  };
}

async function sendMenu(chatId: number, name?: string) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      `👋 Salom${name ? `, ${name}` : ''}! Bu *Sora AI* boti.`,
      '',
      '🇬🇧 0 dan IELTSgacha bosqichma-bosqich organish uchun tayyormiz.',
      'Quyidagi menyudan kerakli bolimni tanlang yoki ilovani oching.',
    ].join('\n'),
    parse_mode: 'Markdown',
    reply_markup: createPersistentKeyboard(),
  });

  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '✨ *Quick start*',
      '',
      '🎯 Level Test bilan boshlang',
      '📅 Daily Missionni yoping',
      '🎙 Speaking va 🎧 Listeningni davom ettiring',
      '🤝 Invite orqali dostlaringizni chaqiring',
    ].join('\n'),
    parse_mode: 'Markdown',
    reply_markup: createStartInlineMarkup(),
  });
}

async function sendLevelTest(chatId: number) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '🎯 *Level Test*',
      '',
      'Sora sizni to‘g‘ri bosqichga joylashi uchun placement test tayyor.',
      'Uni ilova ichida yakunlasangiz, roadmap va daily mission darajangizga moslashadi.',
    ].join('\n'),
    parse_mode: 'Markdown',
    reply_markup: createOpenAppMarkup('/placement-test'),
  });
}

async function sendDailyMission(chatId: number, profile: BotProfile) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: buildDailyMissionText(profile),
    parse_mode: 'Markdown',
    reply_markup: createOpenAppMarkup('/dashboard'),
  });
}

async function sendWordOfDay(chatId: number) {
  const word = wordOfTheDay();
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '📚 *Word of the Day*',
      '',
      `*${word.word}* — ${word.translation}`,
      `Meaning: ${word.definition}`,
      `Example: ${word.example}`,
    ].join('\n'),
    parse_mode: 'Markdown',
    reply_markup: createOpenAppMarkup('/practice'),
  });
}

async function sendQuiz(chatId: number) {
  const quiz = createQuiz();
  updateProfile(chatId, (profile) => ({ ...profile, quiz }));

  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '🧠 *Mini Quiz*',
      '',
      `Which English word matches this Uzbek translation: *${quiz.word.translation}*?`,
      '',
      quiz.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n'),
      '',
      'Reply with A, B, C, D or send the full word.',
    ].join('\n'),
    parse_mode: 'Markdown',
  });
}

async function handleQuizAnswer(chatId: number, profile: BotProfile, text: string) {
  if (!profile.quiz) {
    return false;
  }

  const optionIndex = ['a', 'b', 'c', 'd'].indexOf(text.trim().toLowerCase());
  const selected = optionIndex >= 0 ? profile.quiz.options[optionIndex] : text.trim().toLowerCase();
  const correct = selected.toLowerCase() === profile.quiz.answer.toLowerCase();

  updateProfile(chatId, (current) => ({
    ...current,
    quiz: null,
    totalQuizzes: current.totalQuizzes + 1,
    correctQuizzes: current.correctQuizzes + (correct ? 1 : 0),
  }));

  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: correct
      ? `✅ Correct! *${profile.quiz.answer}* is right.`
      : `❌ Not quite. The correct answer is *${profile.quiz.answer}*.`,
    parse_mode: 'Markdown',
    reply_markup: createOpenAppMarkup('/practice'),
  });

  return true;
}

async function sendProgress(chatId: number, profile: BotProfile) {
  const accuracy =
    profile.totalQuizzes === 0
      ? 'No quizzes yet'
      : `${Math.round((profile.correctQuizzes / profile.totalQuizzes) * 100)}%`;

  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '📈 *Your Bot Progress*',
      '',
      `🔥 Streak: *${profile.streak}* day(s)`,
      `🧠 Quiz accuracy: *${accuracy}*`,
      `⏰ Reminders: *${profile.reminderEnabled ? 'ON' : 'OFF'}*`,
      '',
      'For full lesson, writing, mock, and certificate progress, open the app.',
    ].join('\n'),
    parse_mode: 'Markdown',
    reply_markup: createOpenAppMarkup('/dashboard'),
  });
}

async function sendInvite(chatId: number, profile: BotProfile) {
  const code = `SORA-${String(profile.chatId).slice(-5)}`;
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '🤝 *Invite a Friend*',
      '',
      `Your referral code: *${code}*`,
      `Share this link: ${buildUrl('/referral')}`,
      '',
      'Tell your friend to open the app, start with the placement test, and follow the daily mission.',
    ].join('\n'),
    parse_mode: 'Markdown',
  });
}

async function sendSupport(chatId: number) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '🆘 *Support*',
      '',
      'If something is unclear, send one short message describing the problem.',
      'You can also use:',
      '• 💬 Feedback',
      '• 🎙 Speaking Prompt',
      '• 🚀 Open Sora AI',
    ].join('\n'),
    parse_mode: 'Markdown',
  });
}

async function sendSpeakingPrompt(chatId: number) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '🎙 *Speaking Prompt*',
      '',
      'Speak for 20-30 seconds about your morning routine.',
      'Use at least 2 full sentences and 1 time expression.',
      '',
      'Then open Sora AI and continue in Speaking Roleplay mode.',
    ].join('\n'),
    parse_mode: 'Markdown',
    reply_markup: createOpenAppMarkup('/practice'),
  });
}

async function sendFeedbackStart(chatId: number) {
  updateProfile(chatId, (profile) => ({ ...profile, feedbackMode: true }));
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: '💬 Write your feedback in one message. I will save it as your latest bot feedback note.',
  });
}

async function saveFeedback(chatId: number, text: string) {
  updateProfile(chatId, (profile) => ({ ...profile, feedbackMode: false }));
  const feedbackPath = path.join(process.cwd(), 'bot-feedback.log');
  fs.appendFileSync(feedbackPath, `${new Date().toISOString()} | ${chatId} | ${text}\n`);
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: '✅ Feedback saved. Thank you. I will use it to improve Sora AI.',
  });
}

async function handleVoice(chatId: number) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      '🎙 Voice message received.',
      'Open Sora AI and continue inside Speaking Roleplay or Pronunciation Lab for detailed correction.',
    ].join('\n'),
    reply_markup: createOpenAppMarkup('/practice'),
  });
}

async function handleMessage(update: TelegramUpdate) {
  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim() || '';
  const voice = update.message?.voice;
  const firstName = update.message?.from?.first_name;
  const username = update.message?.from?.username;

  if (!chatId) {
    return;
  }

  const profile = ensureProfile(chatId, firstName, username);

  if (voice) {
    await handleVoice(chatId);
    return;
  }

  if (profile.feedbackMode && text && !text.startsWith('/')) {
    await saveFeedback(chatId, text);
    return;
  }

  if (await handleQuizAnswer(chatId, profile, text)) {
    return;
  }

  const lower = text.toLowerCase();

  if (!text || lower === '/start' || lower === '🏠 menu') {
    await sendMenu(chatId, firstName);
    return;
  }

  if (lower === '/app' || text === '🚀 Open Sora AI') {
    await telegramRequest('sendMessage', {
      chat_id: chatId,
      text: '🚀 Open your learning hub:',
      reply_markup: createOpenAppMarkup('/dashboard'),
    });
    return;
  }

  if (lower === '/leveltest' || text === '🎯 Level Test') {
    await sendLevelTest(chatId);
    return;
  }

  if (lower === '/daily' || text === '📅 Daily Mission') {
    await sendDailyMission(chatId, profile);
    return;
  }

  if (lower === '/word' || text === '📚 Word of the Day') {
    await sendWordOfDay(chatId);
    return;
  }

  if (lower === '/quiz' || text === '🧠 Mini Quiz') {
    await sendQuiz(chatId);
    return;
  }

  if (lower === '/progress' || text === '📈 Progress') {
    await sendProgress(chatId, profile);
    return;
  }

  if (lower === '/invite' || text === '🤝 Invite') {
    await sendInvite(chatId, profile);
    return;
  }

  if (lower === '/support' || text === '🆘 Support') {
    await sendSupport(chatId);
    return;
  }

  if (lower === '/feedback' || text === '💬 Feedback') {
    await sendFeedbackStart(chatId);
    return;
  }

  if (lower === '/speaking' || text === '🎙 Speaking Prompt') {
    await sendSpeakingPrompt(chatId);
    return;
  }

  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: '✨ Menu tugmalaridan birini tanlang yoki /start deb yozing.',
    reply_markup: createPersistentKeyboard(),
  });
}

async function runRemindersLoop() {
  while (true) {
    const store = readStore();
    const { dateKey, hour } = tashkentParts();
    const entries = Object.values(store);

    for (const profile of entries) {
      if (profile.reminderEnabled && hour >= 20 && profile.reminderSentDate !== dateKey) {
        await telegramRequest('sendMessage', {
          chat_id: profile.chatId,
          text: `⏰ Daily reminder\n\n${buildDailyMissionText(profile)}`,
          reply_markup: createOpenAppMarkup('/dashboard'),
        });
        profile.reminderSentDate = dateKey;
      }

      if (hour >= 18 && profile.lastSeenDate !== dateKey && profile.streakWarningSentDate !== dateKey) {
        await telegramRequest('sendMessage', {
          chat_id: profile.chatId,
          text: '🔥 Streak warning: bugun kirmasangiz streak uzilishi mumkin. 5-10 minut bo‘lsa ham kirib bitta mission qiling.',
          reply_markup: createOpenAppMarkup('/dashboard'),
        });
        profile.streakWarningSentDate = dateKey;
      }
    }

    writeStore(store);
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
}

async function main() {
  process.stdout.write(`[bot] Sora bot started. Web app: ${WEB_APP_URL}\n`);
  const bot = await telegramRequest<{ id: number; username?: string }>('getMe', {});
  process.stdout.write(`[bot] Telegram bot connected as @${bot.username ?? 'unknown'} (id: ${bot.id}).\n`);

  try {
    await telegramRequest('deleteWebhook', { drop_pending_updates: false });
  } catch (error) {
    process.stderr.write(`[bot] Could not clear webhook state: ${String(error)}\n`);
  }

  void runRemindersLoop();

  let offset = 0;
  while (true) {
    try {
      const updates = await telegramRequest<TelegramUpdate[]>('getUpdates', {
        offset,
        timeout: 25,
        allowed_updates: ['message'],
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        await handleMessage(update);
      }
    } catch (error) {
      const message = String(error);
      if (message.includes('409')) {
        process.stdout.write('[bot] Another Telegram polling instance is active. Stopping this session cleanly.\n');
        process.exit(0);
      }

      process.stderr.write(`[bot] Telegram polling error: ${message}\n`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

void main();
