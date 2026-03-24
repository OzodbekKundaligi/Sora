import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  Dumbbell,
  Home,
  Languages,
  LogOut,
  MessageSquare,
  Mic,
  Target,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCompletedLessonCount, getLearnedWordCount, getUserData } from '../lib/localData';
import { useTranslateText } from '../lib/i18n';
import { lessons } from '../lib/courseData';
import {
  getCertificateStatus,
  getDailyPlan,
  getLevelRoadmap,
  getWeeklyReport,
} from '../services/academy';
import { getGrammarTips } from '../services/sora-ai';
import { srsService } from '../services/srsService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, settings } = useAuth();
  const t = useTranslateText();
  const [tips] = React.useState(() => getGrammarTips(4));

  const overview = React.useMemo(() => {
    if (!user) {
      return null;
    }

    const userData = getUserData(user.id);
    const lessonCount = getCompletedLessonCount(user.id);
    const learnedWords = getLearnedWordCount(user.id);
    const srsStats = srsService.getStats(user.id);
    const nextLesson =
      lessons.find((lesson) => !userData.lessonProgress.find((item) => item.lessonId === lesson.id)?.completed)
      || lessons[0];

    return {
      lessonCount,
      learnedWords,
      srsStats,
      nextLesson,
      grammarErrors: userData.grammarErrors.slice(0, 3),
      messages: userData.messages.length,
    };
  }, [user]);

  if (!user || !overview) {
    return null;
  }

  const dailyPlan = getDailyPlan(user.id, user.level);
  const weeklyReport = getWeeklyReport(user.id);
  const certificateStatus = getCertificateStatus(user.id, user.level);
  const roadmap = getLevelRoadmap();

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-11 h-11 rounded-2xl object-cover shadow-lg border border-white/60"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg">
                {user.name[0] || 'U'}
              </div>
            )}
            <div>
              <div className="text-xl font-extrabold text-primary">Sora AI</div>
              <div className="text-xs text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                {settings.language.toUpperCase()} • {settings.theme}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-surface-container-low transition-colors"
            title={t({ uz: 'Chiqish', en: 'Log out', ru: 'Выйти' })}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-8 max-w-5xl mx-auto">
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-4xl p-8 bg-linear-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/20"
          >
            <span className="inline-flex px-3 py-1 rounded-full bg-white/15 text-xs font-black uppercase tracking-widest">
              {t({ uz: 'Keyingi qadam', en: 'Next Step', ru: 'Следующий шаг' })}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold">
              {t({
                uz: `Salom, ${user.name}!`,
                en: `Hello, ${user.name}!`,
                ru: `Здравствуйте, ${user.name}!`,
              })}
            </h1>
            <p className="mt-3 text-white/85 max-w-xl leading-relaxed">
              {t({
                uz: 'Endi ilova darslar, mashqlar va chatni alohida bo‘limlarga ajratadi. Darsni darsda o‘qing, mashqni mashqda bajaring, chatda esa alohida feedback oling.',
                en: 'The app now separates lessons, exercises, and chat clearly. Study the lesson in Lessons, drill in Practice, and get feedback in Chat.',
                ru: 'Теперь приложение четко разделяет уроки, упражнения и чат. Изучайте теорию в уроках, тренируйтесь в практике и получайте обратную связь в чате.',
              })}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton
                label={t({ uz: 'Darsni davom ettirish', en: 'Continue lesson', ru: 'Продолжить урок' })}
                onClick={() => navigate('/lessons')}
              />
              <ActionButton
                label={t({ uz: 'SRS mashq', en: 'SRS practice', ru: 'SRS практика' })}
                onClick={() => navigate('/practice', { state: { tab: 'vocabulary' } })}
                subtle
              />
              <ActionButton
                label="Reading"
                onClick={() => navigate('/practice', { state: { tab: 'reading' } })}
                subtle
              />
              <ActionButton
                label="Essay"
                onClick={() => navigate('/practice', { state: { tab: 'writing' } })}
                subtle
              />
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard
              icon={<BookOpen className="w-5 h-5" />}
              label={t({ uz: 'Yakunlangan darslar', en: 'Completed lessons', ru: 'Завершенные уроки' })}
              value={overview.lessonCount}
            />
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label={t({ uz: 'Faol SRS so‘zlar', en: 'Active SRS words', ru: 'Активные слова SRS' })}
              value={overview.learnedWords}
            />
            <StatCard
              icon={<Dumbbell className="w-5 h-5" />}
              label={t({ uz: 'Bugun takrorlash', en: 'Due today', ru: 'Повторить сегодня' })}
              value={overview.srsStats.due}
            />
            <StatCard
              icon={<MessageSquare className="w-5 h-5" />}
              label={t({ uz: 'Chat xabarlari', en: 'Chat messages', ru: 'Сообщения чата' })}
              value={overview.messages}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <SectionTitle title={t({ uz: 'O‘quv yo‘li', en: 'Learning Path', ru: 'Маршрут обучения' })} />
            <div className="bg-surface-container-lowest rounded-4xl p-6 border border-outline-variant/10 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary">{overview.nextLesson.level}</p>
                  <h2 className="text-2xl font-extrabold text-on-surface">
                    {overview.nextLesson.title[settings.language]}
                  </h2>
                  <p className="mt-2 text-on-surface-variant">
                    {overview.nextLesson.description[settings.language]}
                  </p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl font-black">
                  +{overview.nextLesson.xp} XP
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {overview.nextLesson.keyPoints.slice(0, 2).map((point, index) => (
                  <div key={index} className="bg-surface-container-low rounded-2xl p-4 text-sm text-on-surface-variant">
                    {point[settings.language]}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/lessons')}
                className="w-full bg-primary text-white rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2"
              >
                {t({ uz: 'To‘liq darsni ochish', en: 'Open full lesson', ru: 'Открыть полный урок' })}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle title={t({ uz: 'Sora tavsiyasi', en: 'Sora Suggestions', ru: 'Рекомендации Sora' })} />
            <div className="space-y-3">
              <QuickCard
                icon={<BookOpen className="w-5 h-5" />}
                title={t({ uz: 'Lug‘at quizlari', en: 'Vocabulary quizzes', ru: 'Словарные квизы' })}
                desc={t({
                  uz: `Bugun ${overview.srsStats.due} ta so‘z optimal vaqtda takrorlanadi.`,
                  en: `${overview.srsStats.due} words are ready for review at the right interval today.`,
                  ru: `Сегодня ${overview.srsStats.due} слов готовы к повторению в оптимальный момент.`,
                })}
                onClick={() => navigate('/practice', { state: { tab: 'vocabulary' } })}
              />
              <QuickCard
                icon={<Mic className="w-5 h-5" />}
                title={t({ uz: 'Pronunciation lab', en: 'Pronunciation lab', ru: 'Лаборатория произношения' })}
                desc={t({
                  uz: 'Fonetik xato, intonatsiya va ritm bo‘yicha batafsil feedback oling.',
                  en: 'Get detailed feedback on phonetic mistakes, intonation, and rhythm.',
                  ru: 'Получайте подробную обратную связь по фонетике, интонации и ритму.',
                })}
                onClick={() => navigate('/practice', { state: { tab: 'pronunciation' } })}
              />
              <QuickCard
                icon={<Dumbbell className="w-5 h-5" />}
                title={t({ uz: 'Grammar drills', en: 'Grammar drills', ru: 'Грамматические упражнения' })}
                desc={
                  overview.grammarErrors.length > 0
                    ? t({
                        uz: `So‘nggi xatolarga qarab ${overview.grammarErrors[0].topic} mavzusi tavsiya qilinadi.`,
                        en: `${overview.grammarErrors[0].topic} is recommended from your recent errors.`,
                        ru: `По вашим последним ошибкам рекомендована тема ${overview.grammarErrors[0].topic}.`,
                      })
                    : t({
                        uz: 'Mavzu tanlab yoki Sora tavsiyasi bo‘yicha ishlang.',
                        en: 'Choose a topic or let Sora suggest one.',
                        ru: 'Выберите тему или позвольте Sora предложить вариант.',
                      })
                }
                onClick={() => navigate('/practice', { state: { tab: 'grammar' } })}
              />
              <QuickCard
                icon={<Mic className="w-5 h-5" />}
                title="Listening lab"
                desc={t({
                  uz: 'Sekin, normal va tez audio bilan tinglashni bosqichma-bosqich kuchaytiring.',
                  en: 'Train listening with slow, normal, and fast audio modes.',
                  ru: 'Train listening with slow, normal, and fast audio modes.',
                })}
                onClick={() => navigate('/practice', { state: { tab: 'listening' } })}
              />
              <QuickCard
                icon={<Target className="w-5 h-5" />}
                title="Mock exam"
                desc={t({
                  uz: 'Listening, reading, writing va speaking bilan aralash sinov ishlang.',
                  en: 'Take a mixed listening, reading, writing, and speaking mock.',
                  ru: 'Take a mixed listening, reading, writing, and speaking mock.',
                })}
                onClick={() => navigate('/practice', { state: { tab: 'mock' } })}
              />
              <QuickCard
                icon={<MessageSquare className="w-5 h-5" />}
                title="Speaking roleplay"
                desc={t({
                  uz: 'Sora bilan real suhbat scene larini bosqichma-bosqich mashq qiling.',
                  en: 'Practice staged conversations with Sora in real speaking scenes.',
                  ru: 'Practice staged conversations with Sora in real speaking scenes.',
                })}
                onClick={() => navigate('/practice', { state: { tab: 'roleplay' } })}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.8fr]">
          <div className="bg-surface-container-lowest rounded-4xl p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title="Daily Plan" />
            <div className="mt-4 space-y-3">
              {dailyPlan.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.route, item.routeState ? { state: item.routeState } : undefined)}
                  className="w-full text-left rounded-3xl bg-surface-container-low p-4 hover:border-primary/30 border border-transparent transition-colors"
                >
                  <div className="text-xs font-black uppercase tracking-widest text-primary">{item.title[settings.language]}</div>
                  <div className="mt-1 font-bold text-on-surface">{item.description[settings.language]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-4xl p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title="Weekly Report" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniMetric label="Study days" value={weeklyReport.studyDays} />
              <MiniMetric label="Lessons" value={weeklyReport.lessonsCompleted} />
              <MiniMetric label="Writing" value={weeklyReport.writingsCompleted} />
              <MiniMetric label="Listening" value={weeklyReport.listeningCompleted} />
              <MiniMetric label="Mocks" value={weeklyReport.mocksCompleted} />
              <MiniMetric label="Level" value={user.level} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-4xl p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title="Certificate" />
            <div className="mt-4 text-sm font-bold text-on-surface">
              {certificateStatus.ready ? 'Sora certificate is unlocked.' : 'Sora certificate is still in progress.'}
            </div>
            <div className="mt-4 space-y-2">
              {certificateStatus.requirements.map((item) => (
                <div
                  key={item.label.en}
                  className={`rounded-2xl p-3 text-sm ${
                    item.complete
                      ? 'bg-green-50 text-green-700'
                      : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {item.label[settings.language]}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-4xl p-6 border border-outline-variant/10 shadow-sm">
          <SectionTitle title="A0 to IELTS Roadmap" />
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {roadmap.map((stage) => (
              <div
                key={stage.level}
                className={`rounded-3xl p-4 border ${
                  stage.level === user.level
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant/10 bg-surface-container-low'
                }`}
              >
                <div className="text-xs font-black uppercase tracking-widest text-primary">{stage.level}</div>
                <div className="mt-2 text-sm text-on-surface-variant">{stage.focus}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title={t({ uz: 'Qisqa grammar eslatmalar', en: 'Quick Grammar Tips', ru: 'Короткие советы по грамматике' })} />
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {tips.map((tip) => (
              <div
                key={tip.rule}
                className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/10 shadow-sm"
              >
                <div className="text-xs font-black uppercase tracking-widest text-primary">{tip.rule}</div>
                <div className="mt-3 text-sm font-semibold text-on-surface">{tip.example}</div>
                <div className="mt-2 text-sm text-on-surface-variant">{tip.explanation}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(25,27,35,0.08)] rounded-t-[2.5rem] border-t border-outline-variant/10">
        <NavItem icon={<Home />} label={t({ uz: 'Asosiy', en: 'Home', ru: 'Главная' })} active onClick={() => navigate('/dashboard')} />
        <NavItem icon={<BookOpen />} label={t({ uz: 'Darslar', en: 'Lessons', ru: 'Уроки' })} onClick={() => navigate('/lessons')} />
        <NavItem icon={<Dumbbell />} label={t({ uz: 'Mashqlar', en: 'Practice', ru: 'Практика' })} onClick={() => navigate('/practice')} />
        <NavItem icon={<User />} label={t({ uz: 'Profil', en: 'Profile', ru: 'Профиль' })} onClick={() => navigate('/profile')} />
      </nav>

      <button
        onClick={() => navigate('/chat')}
        className="fixed bottom-28 right-6 w-14 h-14 bg-secondary-container text-white rounded-full shadow-2xl shadow-secondary-container/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-xl font-bold text-on-surface">{title}</h3>;
}

function ActionButton({
  label,
  onClick,
  subtle,
}: {
  label: string;
  onClick: () => void;
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        subtle
          ? 'px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold'
          : 'px-5 py-3 rounded-full bg-white text-primary font-bold shadow-lg'
      }
    >
      {label}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
      <div className="text-[11px] font-black uppercase tracking-widest text-primary">{label}</div>
      <div className="mt-2 text-2xl font-black text-on-surface">{value}</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm p-5 min-h-[180px] flex flex-col justify-between">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-8 text-4xl leading-none font-black text-on-surface">{value}</div>
      <div className="mt-3 text-base text-on-surface-variant leading-snug">{label}</div>
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
      className="w-full text-left bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/10 shadow-sm hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-bold text-on-surface">{title}</div>
          <div className="mt-1 text-sm text-on-surface-variant">{desc}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-outline" />
      </div>
    </button>
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
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-5 py-2 transition-all duration-150 ease-out ${
        active
          ? 'bg-secondary-container text-white rounded-full scale-105'
          : 'text-on-surface opacity-60 hover:scale-110'
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium tracking-wide mt-1">{label}</span>
    </button>
  );
}
