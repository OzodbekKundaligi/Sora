import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MessageCircle, Zap, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserData, updateNotifications } from '../../lib/localData';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState(() =>
    user
      ? getUserData(user.id).notifications
      : {
          dailyReminder: true,
          newLessons: true,
          chatFeedback: true,
          achievements: true,
          reminderTime: '20:00',
        },
  );

  const toggle = (key: keyof typeof settings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    if (user) {
      updateNotifications(user.id, next);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">Bildirishnomalar</span>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto mt-4">
        <section className="bg-surface-container-low p-8 rounded-3xl text-center space-y-4 border border-outline-variant/10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-on-surface">Bildirishnomalar faol</h2>
            <p className="text-sm text-on-surface-variant font-bold">Siz muhim yangiliklarni o'tkazib yubormaysiz</p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1">Xabarnomalar turi</h3>
          <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10">
            <NotificationToggle 
              icon={<Calendar className="text-blue-500" />} 
              label="Kunlik eslatma" 
              desc="Har kuni dars qilishni eslatib turadi" 
              active={settings.dailyReminder} 
              onToggle={() => toggle('dailyReminder')} 
            />
            <NotificationToggle 
              icon={<Zap className="text-yellow-500" />} 
              label="Yangi darslar" 
              desc="Yangi darslar qo'shilganda xabar beradi" 
              active={settings.newLessons} 
              onToggle={() => toggle('newLessons')} 
            />
            <NotificationToggle 
              icon={<MessageCircle className="text-green-500" />} 
              label="Chat feedback" 
              desc="Sora AI xabarlariga javob kelganda" 
              active={settings.chatFeedback} 
              onToggle={() => toggle('chatFeedback')} 
            />
            <NotificationToggle 
              icon={<Bell className="text-purple-500" />} 
              label="Yutuqlar" 
              desc="Yangi yutuqqa erishganingizda" 
              active={settings.achievements} 
              onToggle={() => toggle('achievements')} 
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1">Vaqt sozlamalari</h3>
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Eslatma vaqti</p>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Har kuni {settings.reminderTime} da</p>
              </div>
            </div>
            <button className="text-primary font-black text-sm hover:underline">O'zgartirish</button>
          </div>
        </section>
      </main>
    </div>
  );
}

function NotificationToggle({ icon, label, desc, active, onToggle }: { icon: React.ReactNode, label: string, desc: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-outline-variant/5 last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">{label}</p>
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{desc}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ${active ? "bg-primary" : "bg-surface-container-high"}`}
      >
        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${active ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
