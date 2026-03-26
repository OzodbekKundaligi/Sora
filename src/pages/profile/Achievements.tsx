import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, Lock, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAchievementCards, getCertificateStatus } from '../../services/academy';

export default function Achievements() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const achievements = getAchievementCards(user.id, user.level);
  const certificate = getCertificateStatus(user.id, user.level);
  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">Achievements</span>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-3xl mx-auto mt-4">
        <section className="bg-primary/10 p-8 rounded-3xl text-center space-y-4 border border-primary/20">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white mx-auto shadow-xl">
            <Trophy className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface">Level {user.level}</h2>
            <p className="text-on-surface-variant font-bold">{unlockedCount} achievements unlocked</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-6 rounded-2xl border-2 transition-all flex items-start gap-4 ${
                achievement.unlocked
                  ? 'bg-surface-container-lowest border-primary/10 shadow-sm'
                  : 'bg-surface-container-low border-transparent opacity-60'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${achievement.unlocked ? 'bg-green-100 text-green-700' : 'bg-surface-container text-outline'}`}>
                {achievement.unlocked ? <CheckCircle2 className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-on-surface">{achievement.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{achievement.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1">Certificate readiness</h3>
          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
            <div className="flex items-center gap-3 text-primary font-black">
              <Award className="w-6 h-6" />
              {certificate.title.en}
            </div>
            <div className="mt-3 text-on-surface-variant">
              {certificate.ready ? 'Certificate unlocked. You are ready for the Sora AI certificate.' : 'You are still building certificate readiness.'}
            </div>
            <div className="mt-5 space-y-3">
              {certificate.requirements.map((requirement) => (
                <div
                  key={requirement.label.en}
                  className={`rounded-2xl p-4 ${
                    requirement.complete ? 'bg-green-50 text-green-700' : 'bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  {requirement.label.en}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
