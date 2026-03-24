import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Clock, History, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCompletedLessonCount, getUserData } from '../../lib/localData';
import { useTranslateText } from '../../lib/i18n';

export default function LearningHistory() {
  const navigate = useNavigate();
  const { user, settings } = useAuth();
  const t = useTranslateText();

  if (!user) {
    return null;
  }

  const history = getUserData(user.id).messages;
  const lessons = getCompletedLessonCount(user.id);

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">
            {t({ uz: "O'rganish tarixi", en: 'Learning history', ru: 'История обучения' })}
          </span>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto mt-4">
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-6 rounded-3xl text-center space-y-2 border border-outline-variant/10">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-on-surface">{history.length}</h3>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              {t({ uz: 'Xabarlar', en: 'Messages', ru: 'Сообщения' })}
            </p>
          </div>
          <div className="bg-surface-container-low p-6 rounded-3xl text-center space-y-2 border border-outline-variant/10">
            <div className="w-12 h-12 bg-secondary-container/10 rounded-2xl flex items-center justify-center text-secondary-container mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-on-surface">{lessons}</h3>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              {t({ uz: 'Yakunlangan darslar', en: 'Completed lessons', ru: 'Завершенные уроки' })}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1">
            {t({ uz: "So'nggi faollik", en: 'Recent activity', ru: 'Последняя активность' })}
          </h3>
          {history.length === 0 ? (
            <div className="bg-surface-container-low p-12 rounded-3xl text-center border-2 border-dashed border-outline-variant/30">
              <History className="w-12 h-12 text-outline mx-auto mb-4" />
              <p className="text-on-surface-variant font-bold">
                {t({ uz: "Hozircha faollik yo'q.", en: 'No activity yet.', ru: 'Пока активности нет.' })}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history
                .slice()
                .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
                .slice(0, 12)
                .map((item) => (
                  <div key={item.id} className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-secondary-container/10 text-secondary-container'}`}>
                      {item.role === 'user' ? <MessageCircle className="w-6 h-6" /> : <History className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-on-surface truncate">{item.text}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleDateString(settings.language === 'ru' ? 'ru-RU' : settings.language === 'en' ? 'en-US' : 'uz-UZ')}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
