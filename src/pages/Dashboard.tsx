import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Gift,
  Home,
  Languages,
  LogOut,
  MessageSquare,
  Mic,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getCompletedLessonCount,
  getDailyMissionRecord,
  getLearnedWordCount,
  getPlacementTestResult,
  getReferralCode,
  getUserData,
} from '../lib/localData';
import { lessons } from '../lib/courseData';
import {
  getAchievementCards,
  getCertificateStatus,
  getDailyMissionSummary,
  getDailyPlan,
  getProgressSummary,
  getRoadmapStageStatuses,
  getTeacherHighlights,
  getWeeklyReport,
  getWordOfTheDay,
} from '../services/academy';
import { getGrammarTips } from '../services/sora-ai';
import { srsService } from '../services/srsService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, settings } = useAuth();
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
  const dailyMission = getDailyMissionSummary(user.id, user.level);
  const completedMissionIds = new Set(getDailyMissionRecord(user.id)?.completedIds || []);
  const nextMission = dailyPlan.find((item) => !completedMissionIds.has(item.id)) || dailyPlan[0];
  const weeklyReport = getWeeklyReport(user.id);
  const certificateStatus = getCertificateStatus(user.id, user.level);
  const roadmapStages = getRoadmapStageStatuses(user.id, user.level);
  const achievements = getAchievementCards(user.id, user.level);
  const progressSummary = getProgressSummary(user.id, user.level);
  const placementResult = getPlacementTestResult(user.id);
  const teacherHighlights = getTeacherHighlights();
  const referralCode = getReferralCode(user);
  const wordOfTheDay = getWordOfTheDay(user.id);

  return (
    <div className="bg-background min-h-screen pb-36">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-11 h-11 rounded-2xl object-cover shadow-lg border border-white/60"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg shrink-0">
                {user.name[0] || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xl font-extrabold text-primary truncate">Sora AI</div>
              <div className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {settings.language.toUpperCase()} | {settings.theme} | {settings.preferredVoice}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-surface-container-low transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6 sm:px-6">
        <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr] items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] p-6 sm:p-8 bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/20"
          >
            <span className="inline-flex px-3 py-1 rounded-full bg-white/15 text-xs font-black uppercase tracking-widest">
              Next step
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight">
              Hello, {user.name}
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl leading-7">
              You are on the {user.level} track. Keep building from daily missions, full lessons, listening,
              writing, and speaking until you reach mock-ready IELTS practice.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ActionButton
                label="Continue lessons"
                onClick={() => navigate('/lessons')}
              />
              <ActionButton
                label="Open daily mission"
                onClick={() =>
                  navigate(nextMission.route, nextMission.routeState ? { state: nextMission.routeState } : undefined)
                }
                subtle
              />
              <ActionButton
                label="Start placement"
                onClick={() => navigate('/placement-test')}
                subtle
                hidden={Boolean(placementResult)}
              />
              <ActionButton
                label="Teacher dashboard"
                onClick={() => navigate('/teacher')}
                subtle
                hidden={user.role !== 'teacher'}
              />
              <ActionButton
                label="Invite friends"
                onClick={() => navigate('/referral')}
                subtle
              />
              <ActionButton
                label="Speaking roleplay"
                onClick={() => navigate('/practice', { state: { tab: 'roleplay' } })}
                subtle
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard icon={<BookOpen className="w-5 h-5" />} label="Completed lessons" value={overview.lessonCount} />
            <StatCard icon={<Target className="w-5 h-5" />} label="Active SRS words" value={overview.learnedWords} />
            <StatCard icon={<Dumbbell className="w-5 h-5" />} label="Due today" value={overview.srsStats.due} />
            <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Chat messages" value={overview.messages} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title="Learning path" />
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-widest text-primary">{overview.nextLesson.level}</div>
                <h2 className="mt-2 text-2xl font-extrabold text-on-surface">
                  {overview.nextLesson.title[settings.language]}
                </h2>
                <p className="mt-2 text-on-surface-variant leading-7">
                  {overview.nextLesson.description[settings.language]}
                </p>
              </div>
              <div className="rounded-2xl bg-primary/10 text-primary px-4 py-3 font-black shrink-0">
                +{overview.nextLesson.xp} XP
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {overview.nextLesson.keyPoints.slice(0, 2).map((point, index) => (
                <div key={index} className="bg-surface-container-low rounded-[1.5rem] p-4 text-sm text-on-surface-variant leading-6">
                  {point[settings.language]}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/lessons')}
              className="mt-4 w-full bg-primary text-white rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2"
            >
              Open full lesson
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <QuickCard
              icon={<BookOpen className="w-5 h-5" />}
              title="Vocabulary quizzes"
              desc={`${overview.srsStats.due} words are ready for SRS review today.`}
              onClick={() => navigate('/practice', { state: { tab: 'vocabulary' } })}
            />
            <QuickCard
              icon={<Mic className="w-5 h-5" />}
              title="Listening lab"
              desc="Use slow, normal, or fast audio. Unlock transcript only after you check the answer."
              onClick={() => navigate('/practice', { state: { tab: 'listening' } })}
            />
            <QuickCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="Speaking roleplay"
              desc="Practice real scenes with correction, score, retry, and a clear next target."
              onClick={() => navigate('/practice', { state: { tab: 'roleplay' } })}
            />
            <QuickCard
              icon={<Gift className="w-5 h-5" />}
              title="Referral and invite"
              desc={`Your code is ${referralCode.toUpperCase()}. Share it and bring a friend into Sora AI.`}
              onClick={() => navigate('/referral')}
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title={`Daily mission | ${dailyMission.totalMinutes} min`} />
            <div className="mt-2 text-sm text-on-surface-variant">
              {dailyMission.completedCount}/{dailyMission.totalCount} steps completed today.
            </div>
            <div className="mt-4 space-y-3">
              {dailyPlan.map((item) => {
                const complete = completedMissionIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.route, item.routeState ? { state: item.routeState } : undefined)}
                    className={`w-full text-left rounded-[1.5rem] border p-4 transition-colors ${
                      complete
                        ? 'bg-green-50 border-green-200'
                        : 'bg-surface-container-low border-outline-variant/10 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {complete ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-outline shrink-0" />
                          )}
                          <div className="text-xs font-black uppercase tracking-widest text-primary">
                            {item.title[settings.language]}
                          </div>
                        </div>
                        <div className="mt-2 font-bold text-on-surface break-words">
                          {item.description[settings.language]}
                        </div>
                      </div>
                      <div className="text-xs font-black text-on-surface-variant shrink-0">{item.minutes} min</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title="Weekly report" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniMetric label="Study days" value={weeklyReport.studyDays} />
              <MiniMetric label="Lessons" value={weeklyReport.lessonsCompleted} />
              <MiniMetric label="Writing" value={weeklyReport.writingsCompleted} />
              <MiniMetric label="Listening" value={weeklyReport.listeningCompleted} />
              <MiniMetric label="Mocks" value={weeklyReport.mocksCompleted} />
              <MiniMetric label="Level" value={user.level} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title="Certificate readiness" />
            <div className="mt-3 text-sm font-semibold text-on-surface">
              {certificateStatus.ready ? 'Sora certificate unlocked.' : 'Keep progressing before the certificate unlocks.'}
            </div>
            <div className="mt-4 space-y-2">
              {certificateStatus.requirements.map((item) => (
                <div
                  key={item.label.en}
                  className={`rounded-[1.25rem] p-3 text-sm ${
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

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
              <SectionTitle title="Progress summary" />
              <div className="mt-4 space-y-3">
                <SummaryCard text={progressSummary.today} />
                <SummaryCard text={progressSummary.tomorrow} />
                {progressSummary.streakWarning && (
                  <div className="rounded-[1.5rem] bg-amber-50 border border-amber-200 text-amber-700 p-4 font-semibold">
                    {progressSummary.streakWarning}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
              <SectionTitle title="Word of the day" />
              <div className="mt-4 rounded-[1.5rem] bg-surface-container-low p-5">
                <div className="text-xs font-black uppercase tracking-widest text-primary">{wordOfTheDay.category}</div>
                <div className="mt-2 text-2xl font-extrabold text-on-surface">{wordOfTheDay.word}</div>
                <div className="mt-2 text-on-surface-variant">{wordOfTheDay.translation}</div>
                <div className="mt-4 text-sm text-on-surface-variant leading-6">{wordOfTheDay.example}</div>
                <button
                  onClick={() => navigate('/practice', { state: { tab: 'vocabulary', word: wordOfTheDay.word } })}
                  className="mt-4 w-full sm:w-auto px-5 py-3 rounded-2xl bg-primary text-white font-bold"
                >
                  Practice this word
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title="Achievements and rewards" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`rounded-[1.5rem] p-4 border ${
                    achievement.unlocked
                      ? 'bg-green-50 border-green-200'
                      : 'bg-surface-container-low border-outline-variant/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-on-surface">{achievement.title}</div>
                    {achievement.unlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    ) : (
                      <Trophy className="w-5 h-5 text-outline shrink-0" />
                    )}
                  </div>
                  <div className="mt-2 text-sm text-on-surface-variant leading-6">
                    {achievement.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
          <SectionTitle title="A0 to IELTS roadmap" />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {roadmapStages.map((stage) => (
              <div
                key={stage.level}
                className={`rounded-[1.5rem] p-4 border ${
                  stage.current
                    ? 'border-primary bg-primary/5'
                    : stage.completed
                      ? 'border-green-200 bg-green-50'
                      : !stage.unlocked
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-outline-variant/10 bg-surface-container-low'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-black uppercase tracking-widest text-primary">{stage.level}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    {stage.current ? 'Current' : stage.completed ? 'Done' : stage.unlocked ? 'Open' : 'Locked'}
                  </div>
                </div>
                <div className="mt-3 font-bold text-on-surface">{stage.focus}</div>
                <div className="mt-3 space-y-2">
                  {stage.requirements.slice(0, 2).map((requirement) => (
                    <div key={requirement} className="text-sm text-on-surface-variant leading-6">
                      - {requirement}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {teacherHighlights.length > 0 && (
          <section className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <SectionTitle title="Teacher content" />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {teacherHighlights.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-outline-variant/10 bg-surface-container-low p-4">
                  <div className="text-xs font-black uppercase tracking-widest text-primary">
                    {item.level} | {item.contentType}
                  </div>
                  <div className="mt-2 font-bold text-on-surface">{item.title}</div>
                  <div className="mt-2 text-sm text-on-surface-variant leading-6">{item.description}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <SectionTitle title="Quick grammar notes" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tips.map((tip) => (
              <div
                key={tip.rule}
                className="bg-surface-container-lowest rounded-[1.5rem] p-5 border border-outline-variant/10 shadow-sm"
              >
                <div className="text-xs font-black uppercase tracking-widest text-primary">{tip.rule}</div>
                <div className="mt-3 text-sm font-semibold text-on-surface">{tip.example}</div>
                <div className="mt-2 text-sm text-on-surface-variant leading-6">{tip.explanation}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="bottom-safe-nav fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 sm:px-4 pt-3 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(25,27,35,0.08)] rounded-t-[2.5rem] border-t border-outline-variant/10">
        <NavItem icon={<Home />} label="Home" active onClick={() => navigate('/dashboard')} />
        <NavItem icon={<BookOpen />} label="Lessons" onClick={() => navigate('/lessons')} />
        <NavItem icon={<Dumbbell />} label="Practice" onClick={() => navigate('/practice')} />
        <NavItem icon={<User />} label="Profile" onClick={() => navigate('/profile')} />
      </nav>

      <button
        onClick={() => navigate('/chat')}
        className="fab-safe fixed right-4 sm:right-6 w-14 h-14 bg-secondary-container text-white rounded-full shadow-2xl shadow-secondary-container/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
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
  hidden,
}: {
  label: string;
  onClick: () => void;
  subtle?: boolean;
  hidden?: boolean;
}) {
  if (hidden) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={
        subtle
          ? 'w-full px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold'
          : 'w-full px-5 py-3 rounded-full bg-white text-primary font-bold shadow-lg'
      }
    >
      {label}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.25rem] bg-surface-container-low p-4 border border-outline-variant/10">
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
    <div className="bg-surface-container-lowest rounded-[1.75rem] border border-outline-variant/10 shadow-sm p-5 min-h-[160px] flex flex-col justify-between">
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
      className="w-full text-left bg-surface-container-lowest rounded-[1.75rem] p-5 border border-outline-variant/10 shadow-sm hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
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

function SummaryCard({ text }: { text: string }) {
  return <div className="rounded-[1.5rem] bg-surface-container-low p-4 text-on-surface leading-6">{text}</div>;
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
      className={`flex min-w-[68px] flex-col items-center justify-center px-3 py-2 transition-all duration-150 ease-out ${
        active
          ? 'bg-secondary-container text-white rounded-full scale-105'
          : 'text-on-surface opacity-60 hover:scale-105'
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium tracking-wide mt-1 whitespace-nowrap">{label}</span>
    </button>
  );
}
