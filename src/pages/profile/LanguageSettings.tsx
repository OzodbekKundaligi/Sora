import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Globe, Layout, Mic, Play, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslateText } from '../../lib/i18n';
import type { PreferredVoice } from '../../lib/localData';
import { playPronunciation } from '../../services/sora-ai';

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ');
}

const voices: PreferredVoice[] = ['Zephyr', 'Kore', 'Fenrir', 'Puck', 'Charon', 'Ozodbek'];

export default function LanguageSettings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAuth();
  const t = useTranslateText();
  const [language, setLanguage] = useState(settings.language);
  const [theme, setTheme] = useState(settings.theme);
  const [voice, setVoice] = useState<PreferredVoice>(settings.preferredVoice);
  const [isSaved, setIsSaved] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState<PreferredVoice | null>(null);

  const handleSave = () => {
    updateSettings({
      language,
      theme,
      preferredVoice: voice,
    });
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 1600);
  };

  const previewVoice = async (candidate: PreferredVoice) => {
    setIsPreviewing(candidate);
    const sample =
      candidate === 'Ozodbek'
        ? 'Hello. My name is Ozodbek. I will help you learn English step by step.'
        : 'Hello. This is your Sora AI voice preview.';
    await playPronunciation(sample, candidate);
    setIsPreviewing(null);
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">
            {t({ uz: 'Til va interfeys', en: 'Language and Interface', ru: 'Language and Interface' })}
          </span>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-3xl mx-auto mt-4">
        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t({ uz: 'Ilova tili', en: 'App language', ru: 'App language' })}
          </h3>
          <div className="bg-surface-container-lowest rounded-[1.75rem] overflow-hidden shadow-sm border border-outline-variant/10">
            <LanguageOption label="O'zbekcha" active={language === 'uz'} onClick={() => setLanguage('uz')} detail={t({ uz: 'Asosiy interfeys va tushuntirishlar o‘zbekcha bo‘ladi.', en: 'Primary interface and help text stay in Uzbek.', ru: 'Primary interface and help text stay in Uzbek.' })} />
            <LanguageOption label="English" active={language === 'en'} onClick={() => setLanguage('en')} detail={t({ uz: 'Interfeys ingliz tilida ko‘rinadi.', en: 'The interface switches to English.', ru: 'The interface switches to English.' })} />
            <LanguageOption label="Русский" active={language === 'ru'} onClick={() => setLanguage('ru')} detail={t({ uz: 'Interfeys rus tilida ko‘rinadi.', en: 'The interface switches to Russian.', ru: 'The interface switches to Russian.' })} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1 flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            {t({ uz: 'Mavzu', en: 'Theme', ru: 'Theme' })}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <ThemeOption label={t({ uz: "Yorug'", en: 'Light', ru: 'Light' })} active={theme === 'light'} onClick={() => setTheme('light')} />
            <ThemeOption label={t({ uz: 'Tungi', en: 'Dark', ru: 'Dark' })} active={theme === 'dark'} onClick={() => setTheme('dark')} dark />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1 flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            {t({ uz: 'Afzal TTS ovozi', en: 'Preferred TTS voice', ru: 'Preferred TTS voice' })}
          </h3>
          <div className="bg-surface-container-lowest rounded-[1.75rem] overflow-hidden shadow-sm border border-outline-variant/10">
            {voices.map((candidate) => (
              <div
                key={candidate}
                className="w-full flex items-center justify-between gap-3 p-5 border-b border-outline-variant/5 last:border-0 hover:bg-surface-container-low transition-colors"
              >
                <div className="text-left">
                  <div className="font-bold text-on-surface">{candidate}</div>
                  <div className="text-xs text-on-surface-variant">
                    {candidate === 'Zephyr' && t({ uz: 'Yengil va ravon profil', en: 'Bright and smooth profile', ru: 'Bright and smooth profile' })}
                    {candidate === 'Kore' && t({ uz: 'Barqaror va sokin profil', en: 'Stable and calm profile', ru: 'Stable and calm profile' })}
                    {candidate === 'Fenrir' && t({ uz: 'Pastroq va jiddiy profil', en: 'Lower and serious profile', ru: 'Lower and serious profile' })}
                    {candidate === 'Puck' && t({ uz: 'Tezroq va jonli profil', en: 'Lively and quick profile', ru: 'Lively and quick profile' })}
                    {candidate === 'Charon' && t({ uz: 'Sekin va chuqur profil', en: 'Slow and deep profile', ru: 'Slow and deep profile' })}
                    {candidate === 'Ozodbek' && t({ uz: 'Erkakcha, lokal va tabiiyroq profil', en: 'More local and natural male profile', ru: 'More local and natural male profile' })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVoice(candidate)}
                    className={cn(
                      'px-3 py-2 rounded-full text-xs font-bold',
                      voice === candidate ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface',
                    )}
                  >
                    {voice === candidate ? t({ uz: 'Tanlangan', en: 'Selected', ru: 'Selected' }) : t({ uz: 'Tanlash', en: 'Select', ru: 'Select' })}
                  </button>
                  <button
                    type="button"
                    onClick={() => previewVoice(candidate)}
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/15"
                    title={t({ uz: 'Ovoz namunasi', en: 'Preview voice', ru: 'Preview voice' })}
                  >
                    {isPreviewing === candidate ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-primary/5 border border-primary/10 rounded-[1.5rem] p-4 text-sm text-on-surface-variant">
            {t({
              uz: 'Saqlangan ovoz Chat va Practice ichidagi AI ovoz chiqishlari uchun default bo‘ladi. Ozodbek profili local brauzer TTS ichida eng tabiiyroq erkak variantga yaqinlashtiriladi.',
              en: 'The saved voice becomes the default AI playback voice in Chat and Practice. The Ozodbek profile tries to match the most natural local male browser TTS available.',
              ru: 'The saved voice becomes the default AI playback voice in Chat and Practice. The Ozodbek profile tries to match the most natural local male browser TTS available.',
            })}
          </div>
        </section>

        <button
          onClick={handleSave}
          className="w-full p-5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isSaved ? (
            <>
              <Check className="w-6 h-6" />
              {t({ uz: 'Saqlandi', en: 'Saved', ru: 'Saved' })}
            </>
          ) : (
            <>
              <Save className="w-6 h-6" />
              {t({ uz: 'Saqlash', en: 'Save changes', ru: 'Save changes' })}
            </>
          )}
        </button>
      </main>
    </div>
  );
}

function LanguageOption({
  label,
  active,
  detail,
  onClick,
}: {
  label: string;
  active: boolean;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-5 border-b border-outline-variant/5 last:border-0 hover:bg-surface-container-low transition-colors">
      <div className="text-left">
        <div className="font-bold text-on-surface">{label}</div>
        <div className="text-xs text-on-surface-variant mt-0.5">{detail}</div>
      </div>
      {active && <Check className="w-6 h-6 text-primary" />}
    </button>
  );
}

function ThemeOption({
  label,
  active,
  onClick,
  dark,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-6 rounded-[1.75rem] border-2 transition-all flex flex-col items-center gap-3',
        active ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-container-low',
      )}
    >
      <div className={cn('w-20 h-16 rounded-2xl border border-outline-variant/20', dark ? 'bg-slate-900' : 'bg-white')} />
      <span className="font-black text-on-surface">{label}</span>
      {active && <div className="w-2 h-2 rounded-full bg-primary" />}
    </button>
  );
}
