import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Star, TrendingUp, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslateText } from '../lib/i18n';

export default function LandingPage() {
  const navigate = useNavigate();
  const { token, settings } = useAuth();
  const t = useTranslateText();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-background">
      <header className="flex justify-between items-center w-full px-6 py-6 z-10">
        <div className="text-xl font-extrabold text-primary font-headline tracking-tight">Sora AI</div>
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface-variant font-label">
            {settings.language === 'uz' ? "O'zbekcha" : settings.language === 'en' ? 'English' : 'Русский'}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-8 pt-4 pb-12 relative">
        <div className="absolute top-10 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-48 h-48 bg-secondary-container/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full aspect-square mb-10 relative"
          >
            <div className="absolute inset-0 bg-surface-container-low rounded-xl transform rotate-3 scale-95 opacity-50" />
            <div className="absolute inset-0 bg-surface-container-low rounded-xl transform -rotate-2 scale-90 opacity-30" />
            <img 
              alt="Learning English" 
              className="w-full h-full object-cover rounded-xl shadow-sm relative z-10 border-4 border-white"
              src="https://picsum.photos/seed/learning/800/800"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center shadow-lg transform rotate-12 z-20">
              <Star className="text-white w-8 h-8 fill-current" />
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline font-extrabold text-[2.5rem] leading-tight text-on-surface mb-4 tracking-tight"
          >
            {t({
              uz: "Sening muvaffaqiyat yo'ling ",
              en: 'Your path to progress ',
              ru: 'Ваш путь к успеху ',
            })}
            <span className="text-primary">
              {t({
                uz: 'shu yerdan',
                en: 'starts here',
                ru: 'начинается здесь',
              })}
            </span>
            {t({
              uz: ' boshlanadi.',
              en: '.',
              ru: '.',
            })}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-on-surface-variant text-lg leading-relaxed mb-10 max-w-[280px]"
          >
            {t({
              uz: "Ingliz tilini tabiiy muloqot va Sora AI yordamida o'rganing.",
              en: 'Learn English with natural conversation, real lessons, and guided practice.',
              ru: 'Изучайте английский через естественное общение, реальные уроки и практику.',
            })}
          </motion.p>

          <div className="w-full space-y-4 mb-12">
            <FeatureCard 
              icon={<Star className="text-primary" />}
              title={t({ uz: 'Noldan boshlash', en: 'Start from zero', ru: 'Старт с нуля' })}
              description={t({
                uz: "Hech qanday boshlang'ich bilim shart emas. Biz sizga A dan Z gacha yo'l ko'rsatamiz.",
                en: 'New accounts begin clean, with a structured path from the first lesson.',
                ru: 'Новые аккаунты начинают с чистого листа и понятного маршрута с первого урока.',
              })}
            />
            <FeatureCard 
              icon={<TrendingUp className="text-secondary-container" />}
              title={t({ uz: 'Aniq bo‘limlar', en: 'Clear sections', ru: 'Понятные разделы' })}
              description={t({
                uz: "Darslar alohida, mashqlar alohida, chat esa alohida feedback beradi.",
                en: 'Lessons, exercises, and chat now have clear separate roles.',
                ru: 'Уроки, упражнения и чат теперь разделены по понятным ролям.',
              })}
            />
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => navigate('/register')}
            className="w-full bg-secondary-container py-5 rounded-full text-white font-headline font-bold text-lg shadow-xl shadow-secondary-container/20 active:scale-95 transition-transform duration-200"
          >
            {t({ uz: 'Boshlash', en: 'Get Started', ru: 'Начать' })}
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-full text-on-primary-fixed-variant font-headline font-bold text-base hover:bg-primary/5 transition-colors"
          >
            {t({
              uz: 'Menda allaqachon hisob bor',
              en: 'I already have an account',
              ru: 'У меня уже есть аккаунт',
            })}
          </button>
        </div>
      </main>

      <footer className="px-8 pb-8 text-center">
        <p className="text-[11px] text-on-surface-variant/50 font-label tracking-widest uppercase">
          {t({
            uz: "REAL O'RGANISH OQIMI",
            en: 'REAL LEARNING FLOW',
            ru: 'РЕАЛЬНЫЙ ПРОЦЕСС ОБУЧЕНИЯ',
          })}
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-surface-container-lowest p-5 rounded-lg border-2 border-primary/5 flex items-start text-left gap-4 hover:border-primary/20 transition-colors"
    >
      <div className="bg-primary/10 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <h3 className="font-headline font-bold text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant font-medium">{description}</p>
      </div>
    </motion.div>
  );
}
