import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Search, ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react';

export default function HelpCenter() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { id: 1, q: "Sora AI qanday ishlaydi?", a: "Sora AI - bu sun'iy intellektga asoslangan ingliz tili repetitori. U siz bilan jonli muloqot qiladi, xatolaringizni tuzatadi va darajangizga mos mashqlar beradi." },
    { id: 2, q: "IELTS ga tayyorlanish mumkinmi?", a: "Ha, albatta! Sora AI IELTS speaking, writing va vocabulary bo'limlari uchun maxsus tayyorlangan. U sizga mock testlar va maslahatlar beradi." },
    { id: 3, q: "Ovozli muloqot qanday ishlaydi?", a: "Chat bo'limidagi mikrofon tugmasini bosib turing va gapiring. Sora sizning gaplaringizni matnga aylantiradi va tahlil qiladi." },
    { id: 4, q: "Premium obuna bormi?", a: "Hozircha barcha funksiyalar bepul. Kelajakda qo'shimcha imkoniyatlar qo'shilishi mumkin." },
    { id: 5, q: "Xatolarni qanday tuzatadi?", a: "Sora siz yozgan har bir gapni grammatik tahlil qiladi. Agar xato bo'lsa, uni qizil rangda belgilaydi va o'zbek tilida batafsil tushuntirish beradi." },
  ];

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">Yordam markazi</span>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto mt-4">
        <section className="bg-primary p-8 rounded-3xl text-center space-y-6 shadow-xl shadow-primary/20">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Sizga qanday yordam bera olamiz?</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input 
              type="text" 
              placeholder="Savolingizni yozing..." 
              className="w-full bg-white/10 border-2 border-white/20 focus:border-white rounded-2xl py-4 pl-12 pr-6 text-white placeholder:text-white/50 font-bold transition-all outline-none"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1">Ko'p beriladigan savollar</h3>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
                <button 
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-container transition-colors"
                >
                  <span className="font-bold text-on-surface pr-4">{faq.q}</span>
                  {openFaq === faq.id ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-outline" />}
                </button>
                {openFaq === faq.id && (
                  <div className="px-5 pb-5 text-sm text-on-surface-variant leading-relaxed bg-surface-container-low/30">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1">Biz bilan bog'lanish</h3>
          <div className="grid grid-cols-3 gap-3">
            <ContactCard icon={<Mail />} label="Email" />
            <ContactCard icon={<MessageCircle />} label="Telegram" />
            <ContactCard icon={<Phone />} label="Qo'ng'iroq" />
          </div>
        </section>
      </main>
    </div>
  );
}

function ContactCard({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center gap-3 p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 hover:bg-primary/5 hover:border-primary/20 transition-all">
      <div className="text-primary">{icon}</div>
      <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{label}</span>
    </button>
  );
}
