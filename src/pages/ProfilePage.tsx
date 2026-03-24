import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Bell,
  ChevronRight,
  HelpCircle,
  History,
  LogOut,
  Mic,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCompletedLessonCount, getLearnedWordCount } from '../lib/localData';
import { useTranslateText } from '../lib/i18n';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, settings } = useAuth();
  const t = useTranslateText();

  if (!user) {
    return null;
  }

  const learnedCount = getLearnedWordCount(user.id);
  const completedLessons = getCompletedLessonCount(user.id);

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">
            {t({ uz: 'Profil', en: 'Profile', ru: 'Профиль' })}
          </span>
        </div>
      </header>

      <main className="px-6 space-y-8 max-w-3xl mx-auto mt-6">
        <section className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 shadow-sm text-center space-y-5">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-surface-container-low mx-auto shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-black border-4 border-surface-container-low mx-auto shadow-xl">
              {user.name[0] || 'U'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-on-surface">{user.name}</h1>
            <p className="text-on-surface-variant">{user.email}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="XP" value={user.xp} />
            <StatCard label={t({ uz: 'Level', en: 'Level', ru: 'Level' })} value={user.level} />
            <StatCard label={t({ uz: 'Dars', en: 'Lessons', ru: 'Уроки' })} value={completedLessons} />
            <StatCard label={t({ uz: 'So‘z', en: 'Words', ru: 'Слова' })} value={learnedCount} />
            <StatCard label={t({ uz: 'Streak', en: 'Streak', ru: 'Серия' })} value={user.streak} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-on-surface ml-1">
            {t({ uz: 'Hisob sozlamalari', en: 'Account settings', ru: 'Настройки аккаунта' })}
          </h3>
          <div className="bg-surface-container-lowest rounded-[1.75rem] overflow-hidden shadow-sm border border-outline-variant/10">
            <ProfileMenuItem icon={<User />} label={t({ uz: "Shaxsiy ma'lumotlar", en: 'Personal info', ru: 'Личные данные' })} onClick={() => navigate('/profile/personal-info')} />
            <ProfileMenuItem icon={<Award />} label={t({ uz: 'Yutuqlar', en: 'Achievements', ru: 'Достижения' })} onClick={() => navigate('/profile/achievements')} />
            <ProfileMenuItem icon={<History />} label={t({ uz: "O'rganish tarixi", en: 'Learning history', ru: 'История обучения' })} onClick={() => navigate('/profile/history')} />
            <ProfileMenuItem icon={<Shield />} label={t({ uz: 'Xavfsizlik', en: 'Security', ru: 'Безопасность' })} onClick={() => navigate('/profile/security')} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-on-surface ml-1">
            {t({ uz: 'Ilova sozlamalari', en: 'App settings', ru: 'Настройки приложения' })}
          </h3>
          <div className="bg-surface-container-lowest rounded-[1.75rem] overflow-hidden shadow-sm border border-outline-variant/10">
            <ProfileMenuItem
              icon={<Settings />}
              label={t({ uz: 'Til, mavzu va interfeys', en: 'Language, theme, and interface', ru: 'Язык, тема и интерфейс' })}
              detail={`${settings.language.toUpperCase()} • ${settings.theme} • ${settings.preferredVoice}`}
              onClick={() => navigate('/profile/language')}
            />
            <ProfileMenuItem icon={<Mic />} label={t({ uz: 'Ovoz profili', en: 'Voice profile', ru: 'Голосовой профиль' })} detail={settings.preferredVoice} onClick={() => navigate('/profile/language')} />
            <ProfileMenuItem icon={<Bell />} label={t({ uz: 'Bildirishnomalar', en: 'Notifications', ru: 'Уведомления' })} onClick={() => navigate('/profile/notifications')} />
            <ProfileMenuItem icon={<HelpCircle />} label={t({ uz: 'Yordam markazi', en: 'Help center', ru: 'Центр помощи' })} onClick={() => navigate('/profile/help')} />
          </div>
        </section>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-2 p-5 bg-error/10 text-error rounded-2xl font-bold hover:bg-error/15 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span>{t({ uz: 'Tizimdan chiqish', en: 'Log out', ru: 'Выйти' })}</span>
        </button>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-container-low p-4 rounded-2xl text-center border border-outline-variant/5">
      <div className="text-xl font-black text-primary">{value}</div>
      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</div>
    </div>
  );
}

function ProfileMenuItem({
  icon,
  label,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 hover:bg-surface-container-low transition-colors border-b border-outline-variant/5 last:border-0"
    >
      <div className="text-primary">{icon}</div>
      <div className="flex-1 text-left">
        <div className="font-bold text-on-surface">{label}</div>
        {detail && <div className="text-xs text-on-surface-variant mt-0.5">{detail}</div>}
      </div>
      <ChevronRight className="text-outline w-5 h-5" />
    </button>
  );
}
