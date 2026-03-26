import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  Gift,
  HelpCircle,
  History,
  LogOut,
  Mic,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCompletedLessonCount, getLearnedWordCount, getReferralCode } from '../lib/localData';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, settings } = useAuth();

  if (!user) {
    return null;
  }

  const learnedCount = getLearnedWordCount(user.id);
  const completedLessons = getCompletedLessonCount(user.id);
  const referralCode = getReferralCode(user);

  return (
    <div className="bg-background min-h-screen pb-12">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">Profile</span>
        </div>
      </header>

      <main className="px-4 mt-6 space-y-6 max-w-4xl mx-auto sm:px-6">
        <section className="bg-surface-container-lowest rounded-[2rem] p-6 sm:p-8 border border-outline-variant/10 shadow-sm text-center space-y-5">
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
            <p className="text-on-surface-variant break-all">{user.email}</p>
            <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs uppercase tracking-widest font-black">
              {user.role}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard label="XP" value={user.xp} />
            <StatCard label="Level" value={user.level} />
            <StatCard label="Lessons" value={completedLessons} />
            <StatCard label="Words" value={learnedCount} />
            <StatCard label="Streak" value={user.streak} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <div className="text-sm font-black uppercase tracking-widest text-primary">Account settings</div>
            <div className="mt-4 rounded-[1.5rem] overflow-hidden border border-outline-variant/10">
              <ProfileMenuItem icon={<User />} label="Personal info" onClick={() => navigate('/profile/personal-info')} />
              <ProfileMenuItem icon={<Award />} label="Achievements" onClick={() => navigate('/profile/achievements')} />
              <ProfileMenuItem icon={<History />} label="Learning history" onClick={() => navigate('/profile/history')} />
              <ProfileMenuItem icon={<Shield />} label="Security" onClick={() => navigate('/profile/security')} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <div className="text-sm font-black uppercase tracking-widest text-primary">App settings</div>
            <div className="mt-4 rounded-[1.5rem] overflow-hidden border border-outline-variant/10">
              <ProfileMenuItem
                icon={<Settings />}
                label="Language, theme, and interface"
                detail={`${settings.language.toUpperCase()} | ${settings.theme} | ${settings.preferredVoice}`}
                onClick={() => navigate('/profile/language')}
              />
              <ProfileMenuItem
                icon={<Mic />}
                label="Voice profile"
                detail={settings.preferredVoice}
                onClick={() => navigate('/profile/language')}
              />
              <ProfileMenuItem icon={<Bell />} label="Notifications" onClick={() => navigate('/profile/notifications')} />
              {user.role === 'teacher' && (
                <ProfileMenuItem icon={<BookOpen />} label="Teacher dashboard" onClick={() => navigate('/teacher')} />
              )}
              <ProfileMenuItem icon={<HelpCircle />} label="Help center" onClick={() => navigate('/profile/help')} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <div className="text-sm font-black uppercase tracking-widest text-primary">Referral</div>
            <div className="mt-3 text-2xl font-extrabold text-on-surface break-words">{referralCode.toUpperCase()}</div>
            <div className="mt-2 text-sm text-on-surface-variant leading-6">
              Share your invite link and bring a friend into the Sora AI path.
            </div>
            <button
              onClick={() => navigate('/referral')}
              className="mt-4 w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-primary text-white font-bold inline-flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Open invite page
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-6 border border-outline-variant/10 shadow-sm">
            <div className="text-sm font-black uppercase tracking-widest text-primary">Current setup</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SetupCard title="Theme" value={settings.theme} />
              <SetupCard title="Language" value={settings.language.toUpperCase()} />
              <SetupCard title="Voice" value={settings.preferredVoice} />
              <SetupCard title="Track" value={`${user.level} path`} />
            </div>
          </div>
        </section>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-2 p-5 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span>Log out</span>
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

function SetupCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-surface-container-low p-4 border border-outline-variant/10">
      <div className="text-[11px] font-black uppercase tracking-widest text-primary">{title}</div>
      <div className="mt-2 font-bold text-on-surface break-words">{value}</div>
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
      className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-surface-container-low transition-colors border-b border-outline-variant/5 last:border-0"
    >
      <div className="text-primary shrink-0">{icon}</div>
      <div className="flex-1 text-left min-w-0">
        <div className="font-bold text-on-surface">{label}</div>
        {detail && <div className="text-xs text-on-surface-variant mt-0.5 break-words">{detail}</div>}
      </div>
      <ChevronRight className="text-outline w-5 h-5 shrink-0" />
    </button>
  );
}
