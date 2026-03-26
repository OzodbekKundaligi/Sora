import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Home,
  Lock,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { lessons } from '../lib/courseData';
import { useTranslateText } from '../lib/i18n';
import { completeDailyMissionItem, completeLesson, getUserData, recordLessonVisit } from '../lib/localData';
import { getCertificateStatus, getLevelRoadmap, getRoadmapStageStatuses, getTeacherHighlights } from '../services/academy';

export default function LessonsPage() {
  const navigate = useNavigate();
  const { user, settings, updateUser } = useAuth();
  const t = useTranslateText();
  const [selectedId, setSelectedId] = React.useState(lessons[0].id);
  const [selectedStage, setSelectedStage] = React.useState('A0');
  const [, forceRender] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    setSelectedStage((current) => (current === 'A0' ? user.level : current));
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const userData = getUserData(user.id);
  const completedIds = new Set(
    userData.lessonProgress.filter((entry) => entry.completed).map((entry) => entry.lessonId),
  );
  const isLocked = (lessonId: string) => {
    const index = lessons.findIndex((lesson) => lesson.id === lessonId);
    if (index <= 0) {
      return false;
    }

    return !completedIds.has(lessons[index - 1].id);
  };

  const progress = Math.round((completedIds.size / lessons.length) * 100);
  const roadmap = getLevelRoadmap();
  const roadmapStages = getRoadmapStageStatuses(user.id, user.level);
  const certificateStatus = getCertificateStatus(user.id, user.level);
  const teacherHighlights = getTeacherHighlights().filter((item) => item.level === selectedStage).slice(0, 3);
  const stageGroups = roadmap
    .map((stage) => {
      const stageLessons = lessons.filter((lesson) => lesson.level === stage.level);
      const stageStatus = roadmapStages.find((entry) => entry.level === stage.level);
      return {
        ...stage,
        lessons: stageLessons,
        completed: stageLessons.filter((lesson) => completedIds.has(lesson.id)).length,
        unlocked: stageStatus?.unlocked ?? stage.level === 'A0',
      };
    })
    .filter((stage) => stage.lessons.length > 0);
  const activeStage = stageGroups.find((stage) => stage.level === selectedStage) || stageGroups[0];
  const visibleLessons = activeStage?.lessons || lessons;
  const selectedLesson = visibleLessons.find((lesson) => lesson.id === selectedId)
    || lessons.find((lesson) => lesson.id === selectedId)
    || visibleLessons[0]
    || lessons[0];
  const selectedIndex = visibleLessons.findIndex((lesson) => lesson.id === selectedLesson.id);
  const stageProgress = activeStage
    ? Math.round((activeStage.completed / Math.max(activeStage.lessons.length, 1)) * 100)
    : 0;

  const handleSelectLesson = (lessonId: string) => {
    if (isLocked(lessonId)) {
      return;
    }

    setSelectedId(lessonId);
    recordLessonVisit(user.id, lessonId);
    forceRender((value) => value + 1);
  };

  const handleSelectStage = (stageLevel: string) => {
    const targetStage = stageGroups.find((stage) => stage.level === stageLevel);
    if (targetStage && !targetStage.unlocked) {
      return;
    }

    setSelectedStage(stageLevel);
    const stageLessons = lessons.filter((lesson) => lesson.level === stageLevel);
    const nextLesson = stageLessons.find((lesson) => !isLocked(lesson.id)) || stageLessons[0] || lessons[0];
    setSelectedId(nextLesson.id);
  };

  const handleComplete = () => {
    if (completedIds.has(selectedLesson.id)) {
      return;
    }

    const nextUser = completeLesson(user.id, selectedLesson.id, selectedLesson.xp);
    completeDailyMissionItem(user.id, 'daily-lesson');
    if (nextUser) {
      updateUser(nextUser);
    }
    forceRender((value) => value + 1);
  };

  return (
    <div className="bg-background min-h-screen pb-36">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="px-4 py-4 sm:px-6 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <div>
            <div className="text-xl font-extrabold text-primary font-headline">
              {t({ uz: 'Darslar', en: 'Lessons', ru: 'Уроки' })}
            </div>
            <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
              {t({ uz: 'To‘liq nazariya va yo‘naltirilgan mashq', en: 'Full lesson content and guided practice', ru: 'Полная теория и направленная практика' })}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pt-6 grid gap-6 xl:grid-cols-[0.95fr_1.25fr] max-w-6xl mx-auto sm:px-6">
        <section className="space-y-5">
          <div className="rounded-[2rem] p-5 sm:p-6 bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/15">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest opacity-80">
                  {t({ uz: 'Kurs progressi', en: 'Course progress', ru: 'Прогресс курса' })}
                </div>
                <h2 className="text-2xl font-extrabold mt-2">{progress}%</h2>
                <p className="mt-2 text-white/85">
                  {t({
                    uz: `${completedIds.size} / ${lessons.length} dars yakunlangan. Hozir ${activeStage.level} modulida ${stageProgress}% bajarilgan.`,
                    en: `${completedIds.size} / ${lessons.length} lessons completed. ${stageProgress}% of the ${activeStage.level} module is done.`,
                    ru: `${completedIds.size} из ${lessons.length} уроков завершено. ${stageProgress}% модуля ${activeStage.level} уже выполнено.`,
                  })}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-5 h-3 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {stageGroups.map((stage) => (
              <button
                key={stage.level}
                onClick={() => handleSelectStage(stage.level)}
                className={`rounded-[1.5rem] border p-4 text-left transition-all ${
                  selectedStage === stage.level
                    ? 'bg-surface-container-lowest border-primary shadow-lg shadow-primary/10'
                    : 'bg-surface-container-low border-outline-variant/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-black uppercase tracking-widest text-primary">{stage.level}</div>
                  <div className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                    {!stage.unlocked && <Lock className="w-3.5 h-3.5" />}
                    {stage.completed}/{stage.lessons.length}
                  </div>
                </div>
                <div className="mt-2 font-bold text-on-surface">{stage.focus}</div>
                <div className="mt-3 h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((stage.completed / Math.max(stage.lessons.length, 1)) * 100)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {visibleLessons.map((lesson, index) => {
              const locked = isLocked(lesson.id);
              const completed = completedIds.has(lesson.id);

              return (
                <motion.button
                  key={lesson.id}
                  whileHover={!locked ? { scale: 1.01 } : {}}
                  onClick={() => handleSelectLesson(lesson.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-[1.75rem] border transition-all ${
                    selectedLesson.id === lesson.id
                      ? 'bg-surface-container-lowest border-primary shadow-lg shadow-primary/10'
                      : 'bg-surface-container-lowest border-outline-variant/10'
                  } ${locked ? 'opacity-55 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        completed
                          ? 'bg-green-100 text-green-600'
                          : locked
                            ? 'bg-surface-container-high text-outline'
                            : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {completed ? <CheckCircle2 className="w-6 h-6" /> : locked ? <Lock className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{lesson.level}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          {lesson.duration}
                        </span>
                        <span className="text-[10px] font-bold text-secondary-container">+{lesson.xp} XP</span>
                      </div>
                      <div className="font-bold text-on-surface">{lesson.title[settings.language]}</div>
                      <div className="text-sm text-on-surface-variant mt-1">{lesson.description[settings.language]}</div>
                    </div>
                    <div className="text-xs font-black text-on-surface-variant">{index + 1}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-8 shadow-sm border border-outline-variant/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-primary">{selectedLesson.level}</div>
                <h1 className="mt-2 text-3xl font-extrabold text-on-surface">{selectedLesson.title[settings.language]}</h1>
                <p className="mt-3 text-on-surface-variant max-w-2xl">{selectedLesson.description[settings.language]}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 px-4 py-3 text-primary font-black">
                +{selectedLesson.xp} XP
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {selectedLesson.theory.map((paragraph, index) => (
                <div key={index} className="bg-surface-container-low rounded-[1.5rem] p-5 text-on-surface-variant leading-relaxed">
                  {paragraph[settings.language]}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <h3 className="text-lg font-bold text-on-surface">
                {t({ uz: 'Asosiy nuqtalar', en: 'Key Points', ru: 'Ключевые моменты' })}
              </h3>
              {selectedLesson.keyPoints.map((point, index) => (
                <div key={index} className="flex gap-3 items-start bg-surface-container-low rounded-[1.25rem] p-4">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-on-surface-variant">{point[settings.language]}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="bg-primary/5 border border-primary/10 rounded-[1.5rem] p-5">
                <div className="text-sm font-black text-primary uppercase tracking-widest">
                  {t({ uz: 'Misollar', en: 'Examples', ru: 'Примеры' })}
                </div>
                <div className="mt-3 space-y-3">
                  {selectedLesson.examples.map((example, index) => (
                    <div key={index} className="rounded-2xl bg-surface-container-lowest p-4 text-on-surface font-medium">
                      {example}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-secondary-container/5 border border-secondary-container/10 rounded-[1.5rem] p-5">
                <div className="text-sm font-black text-secondary-container uppercase tracking-widest">
                  {t({ uz: 'Yo‘naltirilgan mini amaliyot', en: 'Guided mini practice', ru: 'Мини-практика с подсказкой' })}
                </div>
                <div className="mt-3 space-y-3">
                  {selectedLesson.guidedPractice.map((item, index) => (
                    <div key={index} className="rounded-2xl bg-surface-container-lowest p-4">
                      <div className="font-bold text-on-surface">{item.question[settings.language]}</div>
                      <div className="mt-2 text-sm text-on-surface-variant">{item.answer[settings.language]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-surface-container-low rounded-[1.5rem] p-5 border border-outline-variant/10">
              <div className="text-sm font-black uppercase tracking-widest text-primary">
                {t({ uz: 'Modul eshiklari', en: 'Module doors', ru: 'Module doors' })}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  onClick={() => navigate('/practice', { state: { tab: 'listening' } })}
                  className="rounded-2xl bg-surface-container-lowest p-4 text-left font-bold text-on-surface"
                >
                  Listening
                </button>
                <button
                  onClick={() => navigate('/practice', { state: { tab: 'reading' } })}
                  className="rounded-2xl bg-surface-container-lowest p-4 text-left font-bold text-on-surface"
                >
                  Reading
                </button>
                <button
                  onClick={() => navigate('/practice', { state: { tab: 'writing' } })}
                  className="rounded-2xl bg-surface-container-lowest p-4 text-left font-bold text-on-surface"
                >
                  Writing
                </button>
                <button
                  onClick={() => navigate('/practice', { state: { tab: 'roleplay' } })}
                  className="rounded-2xl bg-surface-container-lowest p-4 text-left font-bold text-on-surface"
                >
                  Speaking roleplay
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleComplete}
                disabled={completedIds.has(selectedLesson.id)}
                className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl font-bold ${
                  completedIds.has(selectedLesson.id)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-primary text-white shadow-lg shadow-primary/20'
                }`}
              >
                {completedIds.has(selectedLesson.id)
                  ? t({ uz: 'Dars yakunlangan', en: 'Lesson completed', ru: 'Урок завершен' })
                  : t({ uz: 'Darsni yakunlash', en: 'Mark lesson complete', ru: 'Завершить урок' })}
              </button>
              <button
                onClick={() =>
                  navigate('/practice', {
                    state:
                      selectedLesson.practiceFocus.type === 'vocabulary'
                        ? { tab: 'vocabulary', word: selectedLesson.practiceFocus.word }
                        : { tab: 'grammar', topicId: selectedLesson.practiceFocus.topicId },
                  })
                }
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-bold bg-secondary-container text-white shadow-lg shadow-secondary-container/20 flex items-center justify-center gap-2"
              >
                <Dumbbell className="w-5 h-5" />
                {t({ uz: 'Bog‘liq mashqni ochish', en: 'Open related practice', ru: 'Открыть связанную практику' })}
              </button>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-[1.75rem] p-5 sm:p-6 border border-outline-variant/10">
            <div className="text-sm font-black uppercase tracking-widest text-primary">
              {t({ uz: 'Dars tartibi', en: 'Lesson flow', ru: 'Порядок уроков' })}
            </div>
            <p className="mt-3 text-on-surface-variant">
              {t({
                uz: `Siz ${selectedIndex + 1}-darsdasiz. Avval nazariyani o‘qing, keyin amaliy mashqni oching, oxirida darsni yakunlang.`,
                en: `You are on lesson ${selectedIndex + 1}. Study the theory first, open the guided practice next, and then complete the lesson.`,
                ru: `Вы на уроке ${selectedIndex + 1}. Сначала изучите теорию, затем откройте практику и после этого завершите урок.`,
              })}
            </p>
          </div>

          <div className="bg-surface-container-low rounded-[1.75rem] p-5 sm:p-6 border border-outline-variant/10">
            <div className="text-sm font-black uppercase tracking-widest text-primary">Roadmap</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {roadmapStages.map((stage) => (
                <div
                  key={stage.level}
                  className={`rounded-[1.25rem] p-4 border ${
                    stage.current
                      ? 'border-primary bg-primary/5'
                      : stage.completed
                        ? 'border-green-200 bg-green-50'
                        : !stage.unlocked
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-outline-variant/10 bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-black uppercase tracking-widest text-primary">{stage.level}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      {stage.current ? 'Current' : stage.completed ? 'Done' : stage.unlocked ? 'Open' : 'Locked'}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-on-surface-variant">{stage.focus}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-[1.75rem] p-5 sm:p-6 border border-outline-variant/10">
            <div className="text-sm font-black uppercase tracking-widest text-primary">Certificate readiness</div>
            <div className="mt-4 space-y-3">
              {certificateStatus.requirements.map((item) => (
                <div
                  key={item.label.en}
                  className={`rounded-[1.25rem] p-4 text-sm ${
                    item.complete
                      ? 'bg-green-50 text-green-700'
                      : 'bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  {item.label[settings.language]}
                </div>
              ))}
            </div>
          </div>

          {teacherHighlights.length > 0 && (
            <div className="bg-surface-container-low rounded-[1.75rem] p-5 sm:p-6 border border-outline-variant/10">
              <div className="text-sm font-black uppercase tracking-widest text-primary">Teacher content</div>
              <div className="mt-4 space-y-3">
                {teacherHighlights.map((item) => (
                  <div key={item.id} className="rounded-[1.25rem] p-4 bg-surface-container-lowest">
                    <div className="text-xs font-black uppercase tracking-widest text-primary">{item.contentType}</div>
                    <div className="mt-2 font-bold text-on-surface">{item.title}</div>
                    <div className="mt-2 text-sm text-on-surface-variant">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <nav className="bottom-safe-nav fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 sm:px-4 pt-3 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(25,27,35,0.06)] rounded-t-[2.5rem] border-t border-outline-variant/10">
        <NavItem icon={<Home className="w-6 h-6" />} label={t({ uz: 'Asosiy', en: 'Home', ru: 'Главная' })} onClick={() => navigate('/dashboard')} />
        <NavItem icon={<BookOpen className="w-6 h-6" />} label={t({ uz: 'Darslar', en: 'Lessons', ru: 'Уроки' })} active onClick={() => navigate('/lessons')} />
        <NavItem icon={<Dumbbell className="w-6 h-6" />} label={t({ uz: 'Mashqlar', en: 'Practice', ru: 'Практика' })} onClick={() => navigate('/practice')} />
        <NavItem icon={<User className="w-6 h-6" />} label={t({ uz: 'Profil', en: 'Profile', ru: 'Профиль' })} onClick={() => navigate('/profile')} />
      </nav>
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
    <button
      onClick={onClick}
      className={`flex min-w-[68px] flex-col items-center justify-center px-3 py-2 transition-all duration-150 ease-out ${
        active ? 'bg-secondary-container text-white rounded-full scale-105' : 'text-on-surface opacity-50 hover:scale-110'
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium tracking-wide mt-1 whitespace-nowrap">{label}</span>
    </button>
  );
}
