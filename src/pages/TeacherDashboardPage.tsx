import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  FileText,
  Headphones,
  Lock,
  PenLine,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { lessons } from '../lib/courseData';
import {
  addTeacherContent,
  addTeacherCourseItem,
  getStoredUsers,
  getTeacherCourseItems,
  getTeacherContent,
  getUserData,
  loginLocalUser,
  moveTeacherCourseItem,
  registerLocalUser,
  removeTeacherContent,
  removeTeacherCourseItem,
  TeacherCourseItem,
  TeacherCourseKind,
  TeacherCourseStatus,
  updateTeacherCourseItem,
  updateLocalUser,
} from '../lib/localData';

type ContentType = 'lesson' | 'quiz' | 'listening' | 'writing' | 'speaking';
type TeacherTab = 'dashboard' | 'users' | 'analytics' | 'course' | 'content';

const TEACHER_ADMIN_EMAIL = 'mamatovo354@gmail.com';
const TEACHER_ADMIN_PASSWORD = '123@Ozod';

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ');
}

function cleanLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseGuidedPractice(text: string) {
  return cleanLines(text).map((line) => {
    const parts = line.split('=>');
    if (parts.length >= 2) {
      return { q: parts[0].trim(), a: parts.slice(1).join('=>').trim() };
    }
    const fallback = line.split('|');
    return { q: (fallback[0] || '').trim(), a: (fallback[1] || '').trim() };
  }).filter((entry) => entry.q && entry.a);
}

function guidedPracticeToText(items: Array<{ q: string; a: string }>) {
  return (items || []).map((entry) => `${entry.q} => ${entry.a}`).join('\n');
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toDateKey(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

function matchesTeacherCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === TEACHER_ADMIN_EMAIL && password === TEACHER_ADMIN_PASSWORD;
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user, login, logout, loading } = useAuth();
  const [tab, setTab] = React.useState<TeacherTab>('dashboard');
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [teacherEmail, setTeacherEmail] = React.useState(TEACHER_ADMIN_EMAIL);
  const [teacherPassword, setTeacherPassword] = React.useState('');
  const [teacherError, setTeacherError] = React.useState('');
  const [teacherBusy, setTeacherBusy] = React.useState(false);

  const [items, setItems] = React.useState(() => getTeacherContent());
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [body, setBody] = React.useState('');
  const [level, setLevel] = React.useState('A1');
  const [contentType, setContentType] = React.useState<ContentType>('lesson');
  const [contentQuery, setContentQuery] = React.useState('');
  const [userQuery, setUserQuery] = React.useState('');
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);

  const [courseItems, setCourseItems] = React.useState(() => getTeacherCourseItems());
  const [courseFilters, setCourseFilters] = React.useState<{
    kind: 'ALL' | TeacherCourseKind;
    status: 'ALL' | TeacherCourseStatus;
    level: 'ALL' | string;
    query: string;
  }>({
    kind: 'ALL',
    status: 'ALL',
    level: 'ALL',
    query: '',
  });
  const [courseForm, setCourseForm] = React.useState(() => ({
    id: '',
    kind: 'lesson' as TeacherCourseKind,
    status: 'draft' as TeacherCourseStatus,
    level: 'A1',
    title: '',
    description: '',
    lessonDuration: 12,
    lessonXp: 80,
    lessonTheory: '',
    lessonKeyPoints: '',
    lessonExamples: '',
    lessonGuided: '',
    listeningTranscript: '',
    listeningFocus: '',
    listeningQuestion: '',
    listeningOptions: '',
    listeningAnswer: '',
    writingInstructions: '',
    writingMinWords: 80,
    writingOutlineTips: '',
    quizPrompt: '',
    quizOptions: '',
    quizAnswer: '',
    quizExplanation: '',
  }));

  React.useEffect(() => {
    setItems(getTeacherContent());
    setCourseItems(getTeacherCourseItems());
  }, [refreshKey]);

  const adminData = React.useMemo(() => {
    const stored = getStoredUsers();
    const lessonCounts: Record<string, { opened: number; completed: number }> = {};
    const summaries = stored.map((entry) => {
      const data = getUserData(entry.id);
      const completedLessons = data.lessonProgress.filter((progress) => progress.completed).length;
      const messages = data.messages.length;
      const up = data.messages.filter((message) => message.rating === 'up').length;
      const down = data.messages.filter((message) => message.rating === 'down').length;
      const placementDone = Boolean(data.placementTest);
      const missionToday = data.dailyMissionRecords.find((record) => record.date === todayKey());
      const grammarTopics = data.grammarErrors.map((error) => error.topic).filter(Boolean);

      data.lessonProgress.forEach((progress) => {
        const current = lessonCounts[progress.lessonId] || { opened: 0, completed: 0 };
        current.opened += 1;
        if (progress.completed) current.completed += 1;
        lessonCounts[progress.lessonId] = current;
      });

      return {
        id: entry.id,
        name: entry.name,
        email: entry.email,
        role: entry.role || 'student',
        level: entry.level,
        xp: entry.xp,
        streak: entry.streak,
        lastActiveAt: entry.lastActiveAt,
        referredBy: entry.referredBy || '',
        streakFreezeBalance: typeof (entry as any).streakFreezeBalance === 'number' ? (entry as any).streakFreezeBalance : 0,
        completedLessons,
        writings: data.writingSubmissions.length,
        listening: data.listeningSubmissions.length,
        mocks: data.mockAttempts.length,
        messages,
        up,
        down,
        placementDone,
        missionStepsToday: missionToday?.completedIds.length || 0,
        grammarTopics,
      };
    });

    const totals = summaries.reduce(
      (acc, entry) => ({
        totalUsers: acc.totalUsers + 1,
        teachers: acc.teachers + (entry.role === 'teacher' ? 1 : 0),
        activeToday: acc.activeToday + (toDateKey(entry.lastActiveAt) === todayKey() ? 1 : 0),
        placements: acc.placements + (entry.placementDone ? 1 : 0),
        lessons: acc.lessons + entry.completedLessons,
        writing: acc.writing + entry.writings,
        listening: acc.listening + entry.listening,
        mocks: acc.mocks + entry.mocks,
        messages: acc.messages + entry.messages,
        up: acc.up + entry.up,
        down: acc.down + entry.down,
        missionSteps: acc.missionSteps + entry.missionStepsToday,
      }),
      {
        totalUsers: 0,
        teachers: 0,
        activeToday: 0,
        placements: 0,
        lessons: 0,
        writing: 0,
        listening: 0,
        mocks: 0,
        messages: 0,
        up: 0,
        down: 0,
        missionSteps: 0,
      },
    );

    const topUsers = [...summaries].sort((a, b) => b.xp - a.xp).slice(0, 8);

    const grammarCounts = summaries
      .flatMap((entry) => entry.grammarTopics)
      .reduce<Record<string, number>>((acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {});

    const topGrammar = Object.entries(grammarCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([topic, count]) => ({ topic, count }));

    const dropoutLessons = lessons
      .map((lesson) => {
        const counts = lessonCounts[lesson.id] || { opened: 0, completed: 0 };
        const dropout = Math.max(0, counts.opened - counts.completed);
        const rate = counts.opened > 0 ? Math.round((dropout / counts.opened) * 100) : 0;
        return {
          lessonId: lesson.id,
          level: lesson.level,
          title: lesson.title.en,
          opened: counts.opened,
          completed: counts.completed,
          dropout,
          rate,
        };
      })
      .filter((entry) => entry.opened > 0)
      .sort((left, right) => right.dropout - left.dropout || right.rate - left.rate)
      .slice(0, 12);

    const referralCounts = summaries.reduce<Record<string, number>>((acc, entry) => {
      const key = entry.referredBy.trim();
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topReferrals = Object.entries(referralCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));

    return { summaries, totals, topUsers, topGrammar, dropoutLessons, topReferrals };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filteredContent = React.useMemo(() => {
    const q = contentQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => (
      item.title.toLowerCase().includes(q)
      || item.description.toLowerCase().includes(q)
      || item.body.toLowerCase().includes(q)
      || item.level.toLowerCase().includes(q)
      || item.contentType.toLowerCase().includes(q)
    ));
  }, [contentQuery, items]);

  const filteredUsers = React.useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return adminData.summaries;
    return adminData.summaries.filter((entry) => (
      entry.name.toLowerCase().includes(q)
      || entry.email.toLowerCase().includes(q)
      || entry.level.toLowerCase().includes(q)
      || entry.role.toLowerCase().includes(q)
    ));
  }, [adminData.summaries, userQuery]);

  const filteredCourseItems = React.useMemo(() => {
    const q = courseFilters.query.trim().toLowerCase();
    return courseItems.filter((item) => {
      const kindOk = courseFilters.kind === 'ALL' || item.kind === courseFilters.kind;
      const statusOk = courseFilters.status === 'ALL' || item.status === courseFilters.status;
      const levelOk = courseFilters.level === 'ALL' || item.level === courseFilters.level;
      const queryOk =
        !q
        || item.title.toLowerCase().includes(q)
        || item.description.toLowerCase().includes(q)
        || item.kind.toLowerCase().includes(q)
        || item.level.toLowerCase().includes(q);
      return kindOk && statusOk && levelOk && queryOk;
    });
  }, [courseFilters.kind, courseFilters.level, courseFilters.query, courseFilters.status, courseItems]);

  const selectedUser = React.useMemo(() => {
    if (!selectedUserId) return null;
    return adminData.summaries.find((entry) => entry.id === selectedUserId) || null;
  }, [adminData.summaries, selectedUserId]);

  async function handleTeacherLogin(event: React.FormEvent) {
    event.preventDefault();
    if (teacherBusy) return;
    setTeacherError('');
    setTeacherBusy(true);

    const normalizedEmail = teacherEmail.trim().toLowerCase();
    const password = teacherPassword;

    if (!matchesTeacherCredentials(normalizedEmail, password)) {
      setTeacherError('Wrong teacher credentials.');
      setTeacherBusy(false);
      return;
    }

    try {
      const session = loginLocalUser({ email: normalizedEmail, password });
      const upgraded = session.user.role !== 'teacher'
        ? updateLocalUser(session.user.id, { role: 'teacher', name: session.user.name || 'Sora Teacher' })
        : null;
      login(session.token, upgraded || session.user, session.settings);
      setTeacherPassword('');
      setRefreshKey((value) => value + 1);
    } catch {
      const exists = getStoredUsers().some((entry) => entry.email.toLowerCase() === normalizedEmail);
      if (exists) {
        setTeacherError('Teacher account exists, but password did not match.');
        setTeacherBusy(false);
        return;
      }

      try {
        const created = registerLocalUser({ email: normalizedEmail, password, name: 'Sora Teacher' });
        const upgraded = updateLocalUser(created.user.id, { role: 'teacher', name: 'Sora Teacher' });
        login(created.token, upgraded || created.user, created.settings);
        setTeacherPassword('');
        setRefreshKey((value) => value + 1);
      } catch (inner) {
        setTeacherError(inner instanceof Error ? inner.message : String(inner));
      }
    } finally {
      setTeacherBusy(false);
    }
  }

  function submitContent() {
    if (!user || user.role !== 'teacher') return;
    if (!title.trim() || !description.trim() || !body.trim()) return;

    const next = addTeacherContent({
      title: title.trim(),
      description: description.trim(),
      body: body.trim(),
      level,
      contentType,
      createdBy: user.name,
    });
    setItems((current) => [next, ...current]);
    setTitle('');
    setDescription('');
    setBody('');
    setRefreshKey((value) => value + 1);
  }

  async function exportTeacherContent() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getTeacherContent(), null, 2));
    } catch {
      // ignore
    }
  }

  function resetCourseForm(nextKind = courseForm.kind) {
    setCourseForm((current) => ({
      ...current,
      id: '',
      kind: nextKind,
      status: 'draft',
      level: 'A1',
      title: '',
      description: '',
      lessonDuration: 12,
      lessonXp: 80,
      lessonTheory: '',
      lessonKeyPoints: '',
      lessonExamples: '',
      lessonGuided: '',
      listeningTranscript: '',
      listeningFocus: '',
      listeningQuestion: '',
      listeningOptions: '',
      listeningAnswer: '',
      writingInstructions: '',
      writingMinWords: 80,
      writingOutlineTips: '',
      quizPrompt: '',
      quizOptions: '',
      quizAnswer: '',
      quizExplanation: '',
    }));
  }

  function buildCourseData(form = courseForm) {
    if (form.kind === 'lesson') {
      return {
        durationMinutes: Math.max(1, Number(form.lessonDuration) || 12),
        xp: Math.max(10, Number(form.lessonXp) || 80),
        theory: cleanLines(form.lessonTheory),
        keyPoints: cleanLines(form.lessonKeyPoints),
        examples: cleanLines(form.lessonExamples),
        guidedPractice: parseGuidedPractice(form.lessonGuided),
      };
    }
    if (form.kind === 'listening') {
      return {
        transcript: form.listeningTranscript.trim(),
        focus: form.listeningFocus.trim(),
        question: form.listeningQuestion.trim(),
        options: cleanLines(form.listeningOptions),
        answer: form.listeningAnswer.trim(),
      };
    }
    if (form.kind === 'writing') {
      return {
        instructions: form.writingInstructions.trim(),
        minimumWords: Math.max(20, Number(form.writingMinWords) || 80),
        outlineTips: cleanLines(form.writingOutlineTips),
      };
    }
    return {
      prompt: form.quizPrompt.trim(),
      options: cleanLines(form.quizOptions),
      answer: form.quizAnswer.trim(),
      explanation: form.quizExplanation.trim(),
    };
  }

  function loadCourseForm(item: TeacherCourseItem) {
    const data = item.data || {};
    setCourseForm((current) => ({
      ...current,
      id: item.id,
      kind: item.kind,
      status: item.status,
      level: item.level,
      title: item.title,
      description: item.description,
      lessonDuration: Number((data as any).durationMinutes) || 12,
      lessonXp: Number((data as any).xp) || 80,
      lessonTheory: Array.isArray((data as any).theory) ? (data as any).theory.join('\n') : '',
      lessonKeyPoints: Array.isArray((data as any).keyPoints) ? (data as any).keyPoints.join('\n') : '',
      lessonExamples: Array.isArray((data as any).examples) ? (data as any).examples.join('\n') : '',
      lessonGuided: Array.isArray((data as any).guidedPractice) ? guidedPracticeToText((data as any).guidedPractice) : '',
      listeningTranscript: String((data as any).transcript || ''),
      listeningFocus: String((data as any).focus || ''),
      listeningQuestion: String((data as any).question || ''),
      listeningOptions: Array.isArray((data as any).options) ? (data as any).options.join('\n') : '',
      listeningAnswer: String((data as any).answer || ''),
      writingInstructions: String((data as any).instructions || ''),
      writingMinWords: Number((data as any).minimumWords) || 80,
      writingOutlineTips: Array.isArray((data as any).outlineTips) ? (data as any).outlineTips.join('\n') : '',
      quizPrompt: String((data as any).prompt || ''),
      quizOptions: Array.isArray((data as any).options) ? (data as any).options.join('\n') : '',
      quizAnswer: String((data as any).answer || ''),
      quizExplanation: String((data as any).explanation || ''),
    }));
  }

  function saveCourseForm() {
    if (!user || user.role !== 'teacher') return;
    if (!courseForm.title.trim() || !courseForm.description.trim()) return;

    const data = buildCourseData(courseForm);
    const base = {
      kind: courseForm.kind,
      status: courseForm.status,
      level: courseForm.level,
      title: courseForm.title.trim(),
      description: courseForm.description.trim(),
      createdBy: user.name,
      data,
    };

    if (courseForm.id) {
      updateTeacherCourseItem(courseForm.id, base);
      setCourseItems(getTeacherCourseItems());
      return;
    }

    addTeacherCourseItem(base);
    setCourseItems(getTeacherCourseItems());
    resetCourseForm(courseForm.kind);
  }

  function toggleCourseStatus(item: TeacherCourseItem) {
    updateTeacherCourseItem(item.id, { status: item.status === 'published' ? 'draft' : 'published' });
    setCourseItems(getTeacherCourseItems());
  }

  function moveCourse(itemId: string, direction: 'up' | 'down') {
    setCourseItems(moveTeacherCourseItem(itemId, direction));
  }

  async function exportCourseJSON() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getTeacherCourseItems(), null, 2));
    } catch {
      // ignore
    }
  }

  async function exportUsersCSV() {
    const rows = [
      [
        'id',
        'name',
        'email',
        'role',
        'level',
        'xp',
        'streak',
        'lastActiveAt',
        'completedLessons',
        'writing',
        'listening',
        'mocks',
        'messages',
        'feedbackUp',
        'feedbackDown',
        'placementDone',
        'missionStepsToday',
      ],
      ...adminData.summaries.map((entry) => [
        String(entry.id),
        entry.name,
        entry.email,
        entry.role,
        entry.level,
        String(entry.xp),
        String(entry.streak),
        entry.lastActiveAt || '',
        String(entry.completedLessons),
        String(entry.writings),
        String(entry.listening),
        String(entry.mocks),
        String(entry.messages),
        String(entry.up),
        String(entry.down),
        entry.placementDone ? 'yes' : 'no',
        String(entry.missionStepsToday),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/\"/g, '""')}"`).join(','))
      .join('\n');

    try {
      await navigator.clipboard.writeText(csv);
    } catch {
      // ignore
    }
  }

  function toggleTeacherRole(userId: number) {
    const stored = getStoredUsers().find((entry) => entry.id === userId);
    if (!stored) return;
    updateLocalUser(userId, { role: stored.role === 'teacher' ? 'student' : 'teacher' });
    setRefreshKey((value) => value + 1);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">Loading...</div>;
  }

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-[2rem] p-6 sm:p-8 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-on-surface">Teacher Admin Login</div>
              <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Protected panel</div>
            </div>
          </div>

          <p className="mt-4 text-on-surface-variant leading-6">
            Enter teacher credentials to open the admin dashboard.
          </p>

          {teacherError && (
            <div className="mt-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 p-3 text-sm font-medium">
              {teacherError}
            </div>
          )}

          <form onSubmit={(event) => void handleTeacherLogin(event)} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-on-surface">Email</span>
              <input
                value={teacherEmail}
                onChange={(event) => setTeacherEmail(event.target.value)}
                type="email"
                required
                className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-on-surface">Password</span>
              <input
                value={teacherPassword}
                onChange={(event) => setTeacherPassword(event.target.value)}
                type="password"
                required
                className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <button
              type="submit"
              disabled={teacherBusy}
              className={cn(
                'w-full rounded-2xl bg-primary text-white font-bold py-4 shadow-lg shadow-primary/20',
                teacherBusy && 'opacity-70 cursor-not-allowed',
              )}
            >
              {teacherBusy ? 'Signing in...' : 'Enter Teacher Panel'}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-surface-container-low text-on-surface font-bold"
            >
              Go to student login
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-surface-container-low text-on-surface font-bold"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totals = adminData.totals;

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-on-surface" />
            </button>
            <div>
              <div className="text-xl font-extrabold text-primary">Teacher Admin</div>
              <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                Dashboard, users, content
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} label="Dashboard" icon={<BarChart3 className="w-4 h-4" />} />
              <TabButton active={tab === 'users'} onClick={() => setTab('users')} label="Users" icon={<Users className="w-4 h-4" />} />
              <TabButton active={tab === 'analytics'} onClick={() => setTab('analytics')} label="Analytics" icon={<BarChart3 className="w-4 h-4" />} />
              <TabButton active={tab === 'course'} onClick={() => setTab('course')} label="Course Builder" icon={<FileText className="w-4 h-4" />} />
              <TabButton active={tab === 'content'} onClick={() => setTab('content')} label="Content" icon={<BookOpen className="w-4 h-4" />} />
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-50 text-red-700 font-bold border border-red-200"
            >
              Exit teacher
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {tab === 'dashboard' && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetricCard title="Total users" value={String(totals.totalUsers)} hint={`${totals.teachers} teacher accounts`} icon={<Users className="w-5 h-5" />} />
              <MetricCard title="Active today" value={String(totals.activeToday)} hint={`${totals.missionSteps} mission steps done`} icon={<BarChart3 className="w-5 h-5" />} />
              <MetricCard title="Placements" value={String(totals.placements)} hint="Placement test completed" icon={<CheckCircle2 className="w-5 h-5" />} />
              <MetricCard title="Lessons done" value={String(totals.lessons)} hint={`Writing ${totals.writing} | Listening ${totals.listening}`} icon={<BookOpen className="w-5 h-5" />} />
              <MetricCard title="Mock attempts" value={String(totals.mocks)} hint="Total mock exams completed" icon={<CheckCircle2 className="w-5 h-5" />} />
              <MetricCard title="Chat feedback" value={`${totals.up} 👍 / ${totals.down} 👎`} hint={`${totals.messages} total messages`} icon={<BarChart3 className="w-5 h-5" />} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
              <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
                <div className="text-xs font-black uppercase tracking-widest text-primary">Top learners</div>
                <div className="mt-4 space-y-3">
                  {adminData.topUsers.length === 0 ? (
                    <div className="text-sm text-on-surface-variant">No users yet.</div>
                  ) : (
                    adminData.topUsers.map((entry, index) => (
                      <div key={entry.id} className="rounded-[1.5rem] bg-surface-container-low p-4 border border-outline-variant/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-on-surface truncate">
                              {index + 1}. {entry.name}
                            </div>
                            <div className="mt-1 text-xs text-on-surface-variant break-all">{entry.email}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-primary">{entry.xp} XP</div>
                            <div className="text-xs font-bold text-on-surface-variant">{entry.level}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
                <div className="text-xs font-black uppercase tracking-widest text-primary">Quick actions</div>
                <div className="mt-4 grid gap-3">
                  <QuickCard icon={<ChevronRight className="w-5 h-5" />} title="Open learner dashboard" desc="See what students see." onClick={() => navigate('/dashboard')} />
                  <QuickCard icon={<ChevronRight className="w-5 h-5" />} title="Open practice hub" desc="Check listening, writing, mock, roleplay." onClick={() => navigate('/practice')} />
                  <QuickCard icon={<ChevronRight className="w-5 h-5" />} title="Open lessons" desc="Review roadmap and unlocks." onClick={() => navigate('/lessons')} />
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Top grammar error topics</div>
                  <div className="mt-2 text-on-surface-variant">
                    Based on learners' recent grammar corrections in this browser.
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {adminData.topGrammar.length === 0 ? (
                  <div className="text-sm text-on-surface-variant">No grammar errors recorded yet.</div>
                ) : (
                  adminData.topGrammar.map((entry) => (
                    <div key={entry.topic} className="rounded-[1.5rem] bg-surface-container-low p-4 border border-outline-variant/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-bold text-on-surface break-words">{entry.topic}</div>
                        <div className="text-sm font-black text-primary">{entry.count}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {tab === 'users' && (
          <section className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-primary">Users</div>
                <div className="mt-2 text-on-surface-variant">Search and manage roles (local-only).</div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => void exportUsersCSV()}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface font-bold inline-flex items-center justify-center gap-2 border border-outline-variant/10"
                >
                  <ClipboardCopy className="w-4 h-4" />
                  Export CSV
                </button>
                <div className="relative w-full sm:max-w-sm">
                  <Search className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    value={userQuery}
                    onChange={(event) => setUserQuery(event.target.value)}
                    placeholder="Search by name, email, level..."
                    className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/10 pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map((entry) => (
                <div key={entry.id} className="rounded-[1.75rem] bg-surface-container-low p-5 border border-outline-variant/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-on-surface truncate">{entry.name}</div>
                      <div className="text-xs text-on-surface-variant break-all">{entry.email}</div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <MiniStat label="Level" value={entry.level} />
                        <MiniStat label="XP" value={entry.xp} />
                        <MiniStat label="Streak" value={entry.streak} />
                        <MiniStat label="Lessons" value={entry.completedLessons} />
                      </div>
                      <div className="mt-3 text-xs text-on-surface-variant">
                        Last active: {entry.lastActiveAt ? new Date(entry.lastActiveAt).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <RoleBadge role={entry.role} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => toggleTeacherRole(entry.id)}
                      className={cn(
                        'w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold border',
                        entry.role === 'teacher'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-primary text-white border-primary',
                      )}
                    >
                      {entry.role === 'teacher' ? 'Remove teacher' : 'Make teacher'}
                    </button>
                    <button
                      onClick={() => setSelectedUserId(entry.id)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold bg-surface-container-lowest text-on-surface border border-outline-variant/10"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedUser && (
              <div className="mt-6 rounded-[2rem] bg-surface-container-low p-5 sm:p-6 border border-outline-variant/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-widest text-primary">User detail</div>
                    <div className="mt-2 text-2xl font-extrabold text-on-surface truncate">{selectedUser.name}</div>
                    <div className="mt-1 text-sm text-on-surface-variant break-all">{selectedUser.email}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <RoleBadge role={selectedUser.role} />
                      <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-surface-container-lowest text-on-surface-variant border-outline-variant/10">
                        {selectedUser.level}
                      </div>
                      {selectedUser.referredBy && (
                        <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-primary/10 text-primary border-primary/20">
                          referred: {selectedUser.referredBy}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold bg-surface-container-lowest text-on-surface border border-outline-variant/10"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniStat label="XP" value={selectedUser.xp} />
                  <MiniStat label="Streak" value={selectedUser.streak} />
                  <MiniStat label="Freeze left" value={selectedUser.streakFreezeBalance} />
                  <MiniStat label="Lessons" value={selectedUser.completedLessons} />
                  <MiniStat label="Writing" value={selectedUser.writings} />
                  <MiniStat label="Listening" value={selectedUser.listening} />
                  <MiniStat label="Mocks" value={selectedUser.mocks} />
                  <MiniStat label="Chat msgs" value={selectedUser.messages} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 border border-outline-variant/10">
                    <div className="text-xs font-black uppercase tracking-widest text-primary">Chat feedback</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MiniStat label="Thumbs up" value={selectedUser.up} />
                      <MiniStat label="Thumbs down" value={selectedUser.down} />
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 border border-outline-variant/10">
                    <div className="text-xs font-black uppercase tracking-widest text-primary">Placement</div>
                    <div className="mt-3 text-sm font-bold text-on-surface">
                      {selectedUser.placementDone ? 'Completed' : 'Not completed'}
                    </div>
                    <div className="mt-2 text-sm text-on-surface-variant">
                      Daily mission steps today: {selectedUser.missionStepsToday}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'analytics' && (
          <section className="space-y-4">
            <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Exports</div>
                  <div className="mt-2 text-on-surface-variant">Copy analytics data for auditing and reporting.</div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => void exportUsersCSV()}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface font-bold inline-flex items-center justify-center gap-2 border border-outline-variant/10"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                    Users CSV
                  </button>
                  <button
                    onClick={() => void exportCourseJSON()}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface font-bold inline-flex items-center justify-center gap-2 border border-outline-variant/10"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                    Course JSON
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
              <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
                <div className="text-xs font-black uppercase tracking-widest text-primary">Dropout lessons</div>
                <div className="mt-2 text-on-surface-variant">
                  Opened but not completed (top lessons by dropout count).
                </div>
                <div className="mt-5 space-y-3">
                  {adminData.dropoutLessons.length === 0 ? (
                    <div className="text-sm text-on-surface-variant">No lesson activity yet.</div>
                  ) : (
                    adminData.dropoutLessons.map((entry) => (
                      <div key={entry.lessonId} className="rounded-[1.5rem] bg-surface-container-low p-4 border border-outline-variant/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-black uppercase tracking-widest text-primary">{entry.level}</div>
                            <div className="mt-1 font-bold text-on-surface truncate">{entry.title}</div>
                            <div className="mt-2 text-xs text-on-surface-variant">
                              Opened {entry.opened} | Completed {entry.completed} | Dropout {entry.dropout} ({entry.rate}%)
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/lessons')}
                            className="px-4 py-2 rounded-2xl bg-surface-container-lowest text-on-surface font-bold border border-outline-variant/10 shrink-0"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
                <div className="text-xs font-black uppercase tracking-widest text-primary">Top referral codes</div>
                <div className="mt-2 text-on-surface-variant">Registrations that used a referral code.</div>
                <div className="mt-5 space-y-3">
                  {adminData.topReferrals.length === 0 ? (
                    <div className="text-sm text-on-surface-variant">No referrals yet.</div>
                  ) : (
                    adminData.topReferrals.map((entry) => (
                      <div key={entry.code} className="rounded-[1.5rem] bg-surface-container-low p-4 border border-outline-variant/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold text-on-surface break-words">{entry.code}</div>
                          <div className="text-sm font-black text-primary">{entry.count}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'course' && (
          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Course builder</div>
                  <div className="mt-2 text-on-surface-variant">Create lessons, listening, writing, and quizzes (draft/publish).</div>
                </div>
                <button
                  onClick={() => resetCourseForm()}
                  className="px-4 py-2.5 rounded-2xl bg-surface-container-low text-on-surface font-bold border border-outline-variant/10"
                >
                  New
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={courseForm.kind}
                  onChange={(event) => setCourseForm((current) => ({ ...current, kind: event.target.value as TeacherCourseKind }))}
                  className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                >
                  <option value="lesson">Lesson</option>
                  <option value="listening">Listening</option>
                  <option value="writing">Writing</option>
                  <option value="quiz">Quiz</option>
                </select>
                <select
                  value={courseForm.status}
                  onChange={(event) => setCourseForm((current) => ({ ...current, status: event.target.value as TeacherCourseStatus }))}
                  className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={courseForm.level}
                  onChange={(event) => setCourseForm((current) => ({ ...current, level: event.target.value }))}
                  className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                >
                  {['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'IELTS'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10 text-sm text-on-surface-variant">
                  Status: <span className="font-bold text-on-surface">{courseForm.status}</span>
                </div>
              </div>

              <input
                value={courseForm.title}
                onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Title"
                className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
              />
              <input
                value={courseForm.description}
                onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Short description"
                className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
              />

              {courseForm.kind === 'lesson' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="space-y-2">
                      <div className="text-xs font-black uppercase tracking-widest text-primary">Duration (min)</div>
                      <input
                        value={courseForm.lessonDuration}
                        onChange={(event) => setCourseForm((current) => ({ ...current, lessonDuration: Number(event.target.value) }))}
                        type="number"
                        min={1}
                        className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                      />
                    </label>
                    <label className="space-y-2">
                      <div className="text-xs font-black uppercase tracking-widest text-primary">XP</div>
                      <input
                        value={courseForm.lessonXp}
                        onChange={(event) => setCourseForm((current) => ({ ...current, lessonXp: Number(event.target.value) }))}
                        type="number"
                        min={10}
                        className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                      />
                    </label>
                  </div>
                  <textarea
                    value={courseForm.lessonTheory}
                    onChange={(event) => setCourseForm((current) => ({ ...current, lessonTheory: event.target.value }))}
                    rows={6}
                    placeholder="Theory paragraphs (one per line)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                  <textarea
                    value={courseForm.lessonKeyPoints}
                    onChange={(event) => setCourseForm((current) => ({ ...current, lessonKeyPoints: event.target.value }))}
                    rows={5}
                    placeholder="Key points (one per line)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                  <textarea
                    value={courseForm.lessonExamples}
                    onChange={(event) => setCourseForm((current) => ({ ...current, lessonExamples: event.target.value }))}
                    rows={4}
                    placeholder="Examples (one per line)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                  <textarea
                    value={courseForm.lessonGuided}
                    onChange={(event) => setCourseForm((current) => ({ ...current, lessonGuided: event.target.value }))}
                    rows={5}
                    placeholder="Guided practice lines: Question => Answer"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                </>
              )}

              {courseForm.kind === 'listening' && (
                <>
                  <input
                    value={courseForm.listeningFocus}
                    onChange={(event) => setCourseForm((current) => ({ ...current, listeningFocus: event.target.value }))}
                    placeholder="Focus (short)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                  />
                  <textarea
                    value={courseForm.listeningTranscript}
                    onChange={(event) => setCourseForm((current) => ({ ...current, listeningTranscript: event.target.value }))}
                    rows={5}
                    placeholder="Transcript (what will be spoken by TTS)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                  <input
                    value={courseForm.listeningQuestion}
                    onChange={(event) => setCourseForm((current) => ({ ...current, listeningQuestion: event.target.value }))}
                    placeholder="Question"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                  />
                  <textarea
                    value={courseForm.listeningOptions}
                    onChange={(event) => setCourseForm((current) => ({ ...current, listeningOptions: event.target.value }))}
                    rows={4}
                    placeholder="Options (one per line)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                  <input
                    value={courseForm.listeningAnswer}
                    onChange={(event) => setCourseForm((current) => ({ ...current, listeningAnswer: event.target.value }))}
                    placeholder="Correct answer (must match one option)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                  />
                </>
              )}

              {courseForm.kind === 'writing' && (
                <>
                  <textarea
                    value={courseForm.writingInstructions}
                    onChange={(event) => setCourseForm((current) => ({ ...current, writingInstructions: event.target.value }))}
                    rows={6}
                    placeholder="Writing instructions"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                  <label className="space-y-2">
                    <div className="text-xs font-black uppercase tracking-widest text-primary">Minimum words</div>
                    <input
                      value={courseForm.writingMinWords}
                      onChange={(event) => setCourseForm((current) => ({ ...current, writingMinWords: Number(event.target.value) }))}
                      type="number"
                      min={20}
                      className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                    />
                  </label>
                  <textarea
                    value={courseForm.writingOutlineTips}
                    onChange={(event) => setCourseForm((current) => ({ ...current, writingOutlineTips: event.target.value }))}
                    rows={4}
                    placeholder="Outline tips (one per line)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                </>
              )}

              {courseForm.kind === 'quiz' && (
                <>
                  <textarea
                    value={courseForm.quizPrompt}
                    onChange={(event) => setCourseForm((current) => ({ ...current, quizPrompt: event.target.value }))}
                    rows={4}
                    placeholder="Prompt"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                  <textarea
                    value={courseForm.quizOptions}
                    onChange={(event) => setCourseForm((current) => ({ ...current, quizOptions: event.target.value }))}
                    rows={4}
                    placeholder="Options (one per line)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                  <input
                    value={courseForm.quizAnswer}
                    onChange={(event) => setCourseForm((current) => ({ ...current, quizAnswer: event.target.value }))}
                    placeholder="Answer"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none"
                  />
                  <textarea
                    value={courseForm.quizExplanation}
                    onChange={(event) => setCourseForm((current) => ({ ...current, quizExplanation: event.target.value }))}
                    rows={3}
                    placeholder="Explanation (optional)"
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none"
                  />
                </>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={saveCourseForm}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-primary text-white font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Save className="w-4 h-4" />
                  {courseForm.id ? 'Save changes' : 'Create item'}
                </button>
                <button
                  onClick={() => resetCourseForm(courseForm.kind)}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-surface-container-low text-on-surface font-bold border border-outline-variant/10"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-primary">Items</div>
                    <div className="mt-2 text-on-surface-variant">{filteredCourseItems.length} items shown.</div>
                  </div>
                  <button
                    onClick={() => void exportCourseJSON()}
                    className="px-4 py-2.5 rounded-2xl bg-surface-container-low text-on-surface font-bold inline-flex items-center gap-2 border border-outline-variant/10"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <select
                    value={courseFilters.kind}
                    onChange={(event) => setCourseFilters((current) => ({ ...current, kind: event.target.value as any }))}
                    className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-3 outline-none"
                  >
                    <option value="ALL">All kinds</option>
                    <option value="lesson">Lesson</option>
                    <option value="listening">Listening</option>
                    <option value="writing">Writing</option>
                    <option value="quiz">Quiz</option>
                  </select>
                  <select
                    value={courseFilters.status}
                    onChange={(event) => setCourseFilters((current) => ({ ...current, status: event.target.value as any }))}
                    className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-3 outline-none"
                  >
                    <option value="ALL">All status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <select
                    value={courseFilters.level}
                    onChange={(event) => setCourseFilters((current) => ({ ...current, level: event.target.value }))}
                    className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-3 outline-none"
                  >
                    <option value="ALL">All levels</option>
                    {['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'IELTS'].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <input
                    value={courseFilters.query}
                    onChange={(event) => setCourseFilters((current) => ({ ...current, query: event.target.value }))}
                    placeholder="Search..."
                    className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-3 outline-none"
                  />
                </div>
              </div>

              {filteredCourseItems.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 shadow-sm text-on-surface-variant">
                  No course items yet.
                </div>
              ) : (
                filteredCourseItems.map((item) => (
                  <div key={item.id} className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <button
                        onClick={() => loadCourseForm(item)}
                        className="text-left flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                          <span>{item.level}</span>
                          <span className="opacity-60">|</span>
                          <span>{item.kind}</span>
                          <span className="opacity-60">|</span>
                          <span className={item.status === 'published' ? 'text-green-700' : 'text-amber-700'}>
                            {item.status}
                          </span>
                        </div>
                        <div className="mt-2 font-bold text-on-surface truncate">{item.title}</div>
                        <div className="mt-1 text-sm text-on-surface-variant leading-6 line-clamp-2">{item.description}</div>
                      </button>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => moveCourse(item.id, 'up')}
                          className="w-10 h-10 rounded-2xl bg-surface-container-low text-on-surface flex items-center justify-center border border-outline-variant/10"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveCourse(item.id, 'down')}
                          className="w-10 h-10 rounded-2xl bg-surface-container-low text-on-surface flex items-center justify-center border border-outline-variant/10"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => toggleCourseStatus(item)}
                        className={cn(
                          'w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold border',
                          item.status === 'published'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-green-50 text-green-700 border-green-200',
                        )}
                      >
                        {item.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => {
                          setCourseItems(removeTeacherCourseItem(item.id));
                          if (courseForm.id === item.id) resetCourseForm(item.kind);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold bg-red-50 text-red-700 border border-red-200 inline-flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === 'content' && (
          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Create content</div>
                  <div className="mt-2 text-on-surface-variant">Appears in Dashboard and Lessons highlights.</div>
                </div>
                <button
                  onClick={() => void exportTeacherContent()}
                  className="px-4 py-2.5 rounded-2xl bg-surface-container-low text-on-surface font-bold inline-flex items-center gap-2 border border-outline-variant/10"
                >
                  <ClipboardCopy className="w-4 h-4" />
                  Export JSON
                </button>
              </div>

              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none" />
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none" />
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={level} onChange={(event) => setLevel(event.target.value)} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none">
                  {['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'IELTS'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentType)} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none">
                  {['lesson', 'quiz', 'listening', 'writing', 'speaking'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={9} placeholder="Body (teacher notes, drills...)" className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 outline-none resize-none" />
              <button onClick={submitContent} className="w-full rounded-2xl bg-primary text-white font-bold py-3.5 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Publish teacher content
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-primary">Content library</div>
                    <div className="mt-2 text-on-surface-variant">{filteredContent.length} items shown.</div>
                  </div>
                  <div className="relative w-full sm:max-w-sm">
                    <Search className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      value={contentQuery}
                      onChange={(event) => setContentQuery(event.target.value)}
                      placeholder="Search content..."
                      className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/10 pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {filteredContent.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 shadow-sm text-on-surface-variant">
                  No teacher content yet.
                </div>
              ) : (
                filteredContent.map((item) => (
                  <div key={item.id} className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs font-black uppercase tracking-widest text-primary">{item.level} | {item.contentType}</div>
                        <h2 className="mt-2 text-xl font-extrabold text-on-surface break-words">{item.title}</h2>
                        <p className="mt-2 text-on-surface-variant leading-6">{item.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setItems(removeTeacherContent(item.id));
                          setRefreshKey((value) => value + 1);
                        }}
                        className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center border border-red-200 shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-4 rounded-[1.25rem] bg-surface-container-low p-4 text-on-surface whitespace-pre-wrap">
                      {item.body}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant">
                      <Lock className="w-4 h-4" />
                      {item.createdBy}
                      <span className="opacity-60">|</span>
                      {new Date(item.createdAt).toLocaleDateString()}
                      <span className="opacity-60">|</span>
                      <button onClick={() => navigate('/dashboard')} className="font-bold text-primary inline-flex items-center gap-1">
                        Preview
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all inline-flex items-center gap-2',
        active ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] bg-surface-container-lowest p-5 border border-outline-variant/10 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-on-surface break-words">{value}</div>
      <div className="mt-2 text-sm text-on-surface-variant leading-6">{hint}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.25rem] bg-surface-container-low p-4 border border-outline-variant/10">
      <div className="text-[11px] font-black uppercase tracking-widest text-primary">{label}</div>
      <div className="mt-2 text-xl font-black text-on-surface break-words">{String(value)}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <div
      className={cn(
        'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border',
        role === 'teacher'
          ? 'bg-primary/10 text-primary border-primary/20'
          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/10',
      )}
    >
      {role}
    </div>
  );
}

function QuickCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface-container-low rounded-[1.5rem] p-4 border border-outline-variant/10 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-on-surface">{title}</div>
          <div className="mt-1 text-sm text-on-surface-variant leading-6">{desc}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-outline shrink-0" />
      </div>
    </button>
  );
}
