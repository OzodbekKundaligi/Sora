import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Star, Zap, ShieldCheck, Trophy, Target, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Achievements() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const achievements = [
    { id: 1, icon: <Flame className="text-orange-500" />, title: "3 Kunlik Streak", desc: "3 kun ketma-ket dars qildingiz!", unlocked: (user?.streak || 0) >= 3 },
    { id: 2, icon: <Zap className="text-yellow-500" />, title: "Tezkor o'rganuvchi", desc: "Bir kunda 100 XP to'pladingiz!", unlocked: (user?.xp || 0) >= 100 },
    { id: 3, icon: <ShieldCheck className="text-blue-500" />, title: "A1 Daraja", desc: "Ingliz tili asoslarini o'zlashtirdingiz!", unlocked: user?.level === 'A1' || user?.level === 'A2' },
    { id: 4, icon: <Trophy className="text-amber-500" />, title: "Lug'at ustasi", desc: "50 ta yangi so'z o'rgandingiz!", unlocked: (user?.xp || 0) >= 500 },
    { id: 5, icon: <Target className="text-red-500" />, title: "Aniqlik", desc: "Mashqlarni 100% to'g'ri bajardingiz!", unlocked: true },
    { id: 6, icon: <Star className="text-purple-500" />, title: "Sora AI Do'sti", desc: "AI bilan 1 soatdan ortiq gaplashdingiz!", unlocked: false },
  ];

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">Yutuqlar va sertifikatlar</span>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto mt-4">
        <section className="bg-primary/10 p-8 rounded-3xl text-center space-y-4 border border-primary/20">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white mx-auto shadow-xl">
            <Trophy className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface">Sizning darajangiz: {user?.level || 'A1'}</h2>
            <p className="text-on-surface-variant font-bold">Keyingi darajagacha 250 XP qoldi</p>
          </div>
          <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full w-[60%] bg-primary rounded-full" />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach) => (
            <div 
              key={ach.id} 
              className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                ach.unlocked 
                  ? "bg-surface-container-lowest border-primary/10 shadow-sm" 
                  : "bg-surface-container-low border-transparent opacity-50 grayscale"
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${ach.unlocked ? "bg-primary/10" : "bg-surface-container"}`}>
                {ach.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-on-surface">{ach.title}</h3>
                <p className="text-xs text-on-surface-variant font-medium">{ach.desc}</p>
              </div>
              {ach.unlocked && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1">Sertifikatlar</h3>
          <div className="bg-surface-container-low p-8 rounded-3xl text-center border-2 border-dashed border-outline-variant/30">
            <Award className="w-12 h-12 text-outline mx-auto mb-4" />
            <p className="text-on-surface-variant font-bold">Hozircha sertifikatlar yo'q.</p>
            <p className="text-xs text-on-surface-variant mt-2">Darajani yakunlang va sertifikatga ega bo'ling!</p>
          </div>
        </section>
      </main>
    </div>
  );
}
