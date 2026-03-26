export type AppLanguage = 'uz' | 'en' | 'ru';
export type AppTheme = 'light' | 'dark';
export type PreferredVoice = 'Zephyr' | 'Kore' | 'Fenrir' | 'Puck' | 'Charon' | 'Ozodbek';
export type UserRole = 'student' | 'teacher';

export interface User {
  id: number;
  email: string;
  name: string;
  xp: number;
  level: string;
  streak: number;
  avatarUrl?: string;
  role: UserRole;
}

interface StoredUser extends User {
  password: string;
  createdAt: string;
  lastActiveAt: string;
  lastStreakDate: string;
}

export interface Settings {
  language: AppLanguage;
  theme: AppTheme;
  preferredVoice: PreferredVoice;
}

export interface StoredMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: string;
  rating?: 'up' | 'down';
  translation?: string;
  audioUrl?: string | null;
}

export interface SRSData {
  word: string;
  level: number;
  nextReview: string;
  correctCount: number;
  wrongCount: number;
  lastResult: 'correct' | 'wrong' | null;
}

export interface GrammarErrorRecord {
  id: string;
  text: string;
  correctedText: string;
  explanation: string;
  topic: string;
  timestamp: string;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  lastOpenedAt?: string;
  xpEarned: number;
  practiceCompleted: number;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  newLessons: boolean;
  chatFeedback: boolean;
  achievements: boolean;
  reminderTime: string;
}

export interface WritingSubmission {
  id: string;
  promptId: string;
  title: string;
  level: string;
  text: string;
  score: number;
  feedback: string[];
  timestamp: string;
}

export interface ListeningSubmission {
  id: string;
  lessonId: string;
  title: string;
  level: string;
  score: number;
  completedAt: string;
}

export interface MockAttempt {
  id: string;
  title: string;
  level: string;
  kind: 'foundation' | 'ielts';
  score: number;
  band: number;
  completedAt: string;
}

export interface PlacementTestResult {
  score: number;
  level: string;
  recommendedFocus: string[];
  completedAt: string;
}

export interface DailyMissionRecord {
  date: string;
  completedIds: string[];
}

export interface TeacherContentItem {
  id: string;
  title: string;
  description: string;
  level: string;
  contentType: 'lesson' | 'quiz' | 'listening' | 'writing' | 'speaking';
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface UserData {
  settings: Settings;
  messages: StoredMessage[];
  srs: SRSData[];
  struggledWords: string[];
  grammarErrors: GrammarErrorRecord[];
  lessonProgress: LessonProgress[];
  notifications: NotificationSettings;
  writingSubmissions: WritingSubmission[];
  listeningSubmissions: ListeningSubmission[];
  mockAttempts: MockAttempt[];
  placementTest: PlacementTestResult | null;
  achievements: string[];
  dailyMissionRecords: DailyMissionRecord[];
}

interface Session {
  token: string;
  userId: number;
}

const USERS_KEY = 'sora_local_users_v2';
const SESSION_KEY = 'sora_local_session_v2';
const GUEST_SETTINGS_KEY = 'sora_guest_settings_v2';
const TEACHER_CONTENT_KEY = 'sora_teacher_content_v1';

export const DEFAULT_SETTINGS: Settings = {
  language: 'uz',
  theme: 'light',
  preferredVoice: 'Zephyr',
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  dailyReminder: true,
  newLessons: true,
  chatFeedback: true,
  achievements: true,
  reminderTime: '20:00',
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJSON<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function userDataKey(userId: number) {
  return `sora_user_data_${userId}_v2`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

function resolveLevel(xp: number) {
  if (xp >= 3200) return 'IELTS';
  if (xp >= 2200) return 'C1';
  if (xp >= 1500) return 'B2';
  if (xp >= 900) return 'B1';
  if (xp >= 400) return 'A2';
  if (xp >= 120) return 'A1';
  return 'A0';
}

function touchUserActivity(user: StoredUser) {
  const today = getTodayKey();

  if (user.lastStreakDate === today) {
    user.lastActiveAt = new Date().toISOString();
    return user;
  }

  if (user.lastStreakDate === getYesterdayKey()) {
    user.streak += 1;
  } else {
    user.streak = 1;
  }

  user.lastStreakDate = today;
  user.lastActiveAt = new Date().toISOString();
  return user;
}

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    avatarUrl: user.avatarUrl,
    role: user.role || 'student',
  };
}

function createEmptyUserData(): UserData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    messages: [],
    srs: [],
    struggledWords: [],
    grammarErrors: [],
    lessonProgress: [],
    notifications: { ...DEFAULT_NOTIFICATIONS },
    writingSubmissions: [],
    listeningSubmissions: [],
    mockAttempts: [],
    placementTest: null,
    achievements: [],
    dailyMissionRecords: [],
  };
}

function resolveRole(email: string): UserRole {
  return /admin|teacher|ustoz/i.test(email) ? 'teacher' : 'student';
}

export function getStoredUsers() {
  return readJSON<StoredUser[]>(USERS_KEY, []);
}

function saveStoredUsers(users: StoredUser[]) {
  writeJSON(USERS_KEY, users);
}

export function getUserById(userId: number) {
  const user = getStoredUsers().find((entry) => entry.id === userId);
  return user ? toPublicUser(user) : null;
}

export function getCurrentSession() {
  return readJSON<Session | null>(SESSION_KEY, null);
}

export function getCurrentUserId() {
  return getCurrentSession()?.userId ?? null;
}

export function getUserData(userId: number) {
  const data = readJSON<UserData | null>(userDataKey(userId), null);

  if (data) {
    return {
      ...createEmptyUserData(),
      ...data,
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      notifications: { ...DEFAULT_NOTIFICATIONS, ...data.notifications },
    };
  }

  const fresh = createEmptyUserData();
  writeJSON(userDataKey(userId), fresh);
  return fresh;
}

export function updateUserData(userId: number, updater: (data: UserData) => UserData) {
  const next = updater(getUserData(userId));
  writeJSON(userDataKey(userId), next);
  return next;
}

export function restoreLocalSession() {
  const session = getCurrentSession();

  if (!session) {
    return null;
  }

  const user = getStoredUsers().find((entry) => entry.id === session.userId);
  if (!user) {
    clearLocalSession();
    return null;
  }

  const publicUser = toPublicUser(user);
  const settings = getUserData(user.id).settings;

  return {
    token: session.token,
    user: publicUser,
    settings,
  };
}

export function clearLocalSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

function saveSession(userId: number) {
  const session = {
    token: `local-${createId()}`,
    userId,
  };

  writeJSON(SESSION_KEY, session);
  return session;
}

export function registerLocalUser({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Bu email bilan akkaunt allaqachon mavjud.');
  }

  const now = new Date().toISOString();
  const user: StoredUser = {
    id: Date.now(),
    email: normalizedEmail,
    name: name.trim(),
    password,
    xp: 0,
    level: 'A0',
    streak: 0,
    avatarUrl: '',
    role: resolveRole(normalizedEmail),
    createdAt: now,
    lastActiveAt: now,
    lastStreakDate: '',
  };

  users.push(user);
  saveStoredUsers(users);
  writeJSON(userDataKey(user.id), createEmptyUserData());
  const session = saveSession(user.id);

  return {
    token: session.token,
    user: toPublicUser(user),
    settings: getUserData(user.id).settings,
  };
}

export function loginLocalUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  const user = users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

  if (!user || user.password !== password) {
    throw new Error('Email yoki parol noto‘g‘ri.');
  }

  touchUserActivity(user);
  saveStoredUsers(users);
  const session = saveSession(user.id);

  return {
    token: session.token,
    user: toPublicUser(user),
    settings: getUserData(user.id).settings,
  };
}

export function updateLocalUser(userId: number, updates: Partial<User & { email: string }>) {
  const users = getStoredUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return null;
  }

  const nextEmail = updates.email?.trim().toLowerCase();
  if (
    nextEmail &&
    users.some((entry) => entry.id !== userId && entry.email.toLowerCase() === nextEmail)
  ) {
    throw new Error('Bu email boshqa akkauntda ishlatilgan.');
  }

  users[index] = {
    ...users[index],
    ...updates,
    email: nextEmail ?? users[index].email,
    name: updates.name?.trim() ?? users[index].name,
  };

  saveStoredUsers(users);
  return toPublicUser(users[index]);
}

export function changeLocalPassword(userId: number, oldPassword: string, newPassword: string) {
  const users = getStoredUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    throw new Error('Foydalanuvchi topilmadi.');
  }

  if (users[index].password !== oldPassword) {
    throw new Error('Joriy parol noto‘g‘ri.');
  }

  users[index].password = newPassword;
  saveStoredUsers(users);
}

export function addXp(userId: number, amount: number) {
  const users = getStoredUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index === -1) {
    return null;
  }

  const updated = touchUserActivity(users[index]);
  updated.xp += amount;
  updated.level = resolveLevel(updated.xp);
  users[index] = updated;
  saveStoredUsers(users);
  return toPublicUser(updated);
}

export function getSettings(userId?: number | null) {
  if (!userId) {
    return readJSON<Settings>(GUEST_SETTINGS_KEY, DEFAULT_SETTINGS);
  }

  return getUserData(userId).settings;
}

export function updateUserSettings(userId: number | null, settings: Partial<Settings>) {
  if (!userId) {
    const next = { ...getSettings(null), ...settings };
    writeJSON(GUEST_SETTINGS_KEY, next);
    return next;
  }

  return updateUserData(userId, (data) => ({
    ...data,
    settings: {
      ...data.settings,
      ...settings,
    },
  })).settings;
}

export function getPlacementTestResult(userId: number) {
  return getUserData(userId).placementTest;
}

export function savePlacementTestResult(userId: number, result: PlacementTestResult) {
  const users = getStoredUsers();
  const index = users.findIndex((user) => user.id === userId);

  if (index !== -1) {
    users[index] = {
      ...users[index],
      level: result.level,
      xp: Math.max(users[index].xp, result.score),
    };
    saveStoredUsers(users);
  }

  updateUserData(userId, (data) => ({
    ...data,
    placementTest: result,
  }));

  return getUserById(userId);
}

export function getDailyMissionRecord(userId: number, date = getTodayKey()) {
  return getUserData(userId).dailyMissionRecords.find((entry) => entry.date === date) || null;
}

export function completeDailyMissionItem(userId: number, missionId: string, date = getTodayKey()) {
  return updateUserData(userId, (data) => {
    const existing = data.dailyMissionRecords.find((entry) => entry.date === date);
    if (existing) {
      return {
        ...data,
        dailyMissionRecords: data.dailyMissionRecords.map((entry) =>
          entry.date === date
            ? {
                ...entry,
                completedIds: entry.completedIds.includes(missionId)
                  ? entry.completedIds
                  : [...entry.completedIds, missionId],
              }
            : entry,
        ),
      };
    }

    return {
      ...data,
      dailyMissionRecords: [
        ...data.dailyMissionRecords,
        {
          date,
          completedIds: [missionId],
        },
      ],
    };
  }).dailyMissionRecords;
}

export function unlockAchievement(userId: number, achievementId: string) {
  return updateUserData(userId, (data) => ({
    ...data,
    achievements: data.achievements.includes(achievementId)
      ? data.achievements
      : [...data.achievements, achievementId],
  })).achievements;
}

export function getTeacherContent() {
  return readJSON<TeacherContentItem[]>(TEACHER_CONTENT_KEY, []);
}

export function addTeacherContent(
  item: Omit<TeacherContentItem, 'id' | 'createdAt'>,
) {
  const nextItem: TeacherContentItem = {
    ...item,
    id: createId(),
    createdAt: new Date().toISOString(),
  };

  const items = [nextItem, ...getTeacherContent()];
  writeJSON(TEACHER_CONTENT_KEY, items);
  return nextItem;
}

export function removeTeacherContent(itemId: string) {
  const next = getTeacherContent().filter((item) => item.id !== itemId);
  writeJSON(TEACHER_CONTENT_KEY, next);
  return next;
}

export function getReferralCode(user: Pick<User, 'id' | 'name'>) {
  const cleaned = user.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'sora';
  return `${cleaned}-${String(user.id).slice(-4)}`;
}

export function getUserMessages(userId: number) {
  return getUserData(userId).messages.sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
}

export function saveUserMessages(userId: number, messages: StoredMessage[]) {
  return updateUserData(userId, (data) => ({
    ...data,
    messages,
  })).messages;
}

export function addUserMessage(
  userId: number,
  message: Omit<StoredMessage, 'id' | 'timestamp'> & Partial<Pick<StoredMessage, 'id' | 'timestamp'>>,
) {
  const nextMessage: StoredMessage = {
    id: message.id || createId(),
    timestamp: message.timestamp || new Date().toISOString(),
    role: message.role,
    text: message.text,
    rating: message.rating,
    translation: message.translation,
    audioUrl: message.audioUrl,
  };

  updateUserData(userId, (data) => ({
    ...data,
    messages: [...data.messages, nextMessage],
  }));

  return nextMessage;
}

export function updateMessageFeedback(userId: number, messageId: string, rating: 'up' | 'down') {
  return updateUserData(userId, (data) => ({
    ...data,
    messages: data.messages.map((message) =>
      message.id === messageId ? { ...message, rating } : message,
    ),
  })).messages;
}

export function getLearnedWordCount(userId: number) {
  return getUserData(userId).srs.filter((entry) => entry.correctCount > 0).length;
}

export function getCompletedLessonCount(userId: number) {
  return getUserData(userId).lessonProgress.filter((entry) => entry.completed).length;
}

export function updateNotifications(userId: number, updates: Partial<NotificationSettings>) {
  return updateUserData(userId, (data) => ({
    ...data,
    notifications: {
      ...data.notifications,
      ...updates,
    },
  })).notifications;
}

export function updateGrammarErrors(userId: number, errors: GrammarErrorRecord[]) {
  return updateUserData(userId, (data) => ({
    ...data,
    grammarErrors: errors,
  })).grammarErrors;
}

export function recordGrammarError(userId: number, error: Omit<GrammarErrorRecord, 'id' | 'timestamp'>) {
  return updateUserData(userId, (data) => ({
    ...data,
    grammarErrors: [
      {
        id: createId(),
        timestamp: new Date().toISOString(),
        ...error,
      },
      ...data.grammarErrors,
    ].slice(0, 30),
  })).grammarErrors;
}

export function recordLessonVisit(userId: number, lessonId: string) {
  return updateUserData(userId, (data) => {
    const existing = data.lessonProgress.find((entry) => entry.lessonId === lessonId);

    if (existing) {
      return {
        ...data,
        lessonProgress: data.lessonProgress.map((entry) =>
          entry.lessonId === lessonId
            ? { ...entry, lastOpenedAt: new Date().toISOString() }
            : entry,
        ),
      };
    }

    return {
      ...data,
      lessonProgress: [
        ...data.lessonProgress,
        {
          lessonId,
          completed: false,
          lastOpenedAt: new Date().toISOString(),
          xpEarned: 0,
          practiceCompleted: 0,
        },
      ],
    };
  }).lessonProgress;
}

export function completeLesson(userId: number, lessonId: string, xp: number) {
  updateUserData(userId, (data) => {
    const existing = data.lessonProgress.find((entry) => entry.lessonId === lessonId);
    const completedAt = new Date().toISOString();

    if (existing) {
      return {
        ...data,
        lessonProgress: data.lessonProgress.map((entry) =>
          entry.lessonId === lessonId
            ? {
                ...entry,
                completed: true,
                completedAt,
                xpEarned: Math.max(entry.xpEarned, xp),
              }
            : entry,
        ),
      };
    }

    return {
      ...data,
      lessonProgress: [
        ...data.lessonProgress,
        {
          lessonId,
          completed: true,
          completedAt,
          xpEarned: xp,
          practiceCompleted: 1,
        },
      ],
    };
  });

  return addXp(userId, xp);
}

export function addWritingSubmission(
  userId: number,
  submission: Omit<WritingSubmission, 'id' | 'timestamp'>,
) {
  return updateUserData(userId, (data) => ({
    ...data,
    writingSubmissions: [
      {
        id: createId(),
        timestamp: new Date().toISOString(),
      ...submission,
      },
      ...data.writingSubmissions,
    ].slice(0, 40),
  })).writingSubmissions;
}

export function addListeningSubmission(
  userId: number,
  submission: Omit<ListeningSubmission, 'id' | 'completedAt'>,
) {
  return updateUserData(userId, (data) => ({
    ...data,
    listeningSubmissions: [
      {
        id: createId(),
        completedAt: new Date().toISOString(),
        ...submission,
      },
      ...data.listeningSubmissions,
    ].slice(0, 40),
  })).listeningSubmissions;
}

export function addMockAttempt(
  userId: number,
  attempt: Omit<MockAttempt, 'id' | 'completedAt'>,
) {
  return updateUserData(userId, (data) => ({
    ...data,
    mockAttempts: [
      {
        id: createId(),
        completedAt: new Date().toISOString(),
        ...attempt,
      },
      ...data.mockAttempts,
    ].slice(0, 20),
  })).mockAttempts;
}
