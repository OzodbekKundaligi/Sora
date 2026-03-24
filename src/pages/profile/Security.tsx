import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Smartphone, Key, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changeLocalPassword } from '../../lib/localData';

export default function Security() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError("Parollar mos kelmadi!");
      return;
    }
    if (!user) return;
    setIsSaving(true);
    try {
      changeLocalPassword(user.id, oldPassword, newPassword);
      setIsSaving(false);
      alert("Parol muvaffaqiyatli o'zgartirildi!");
      navigate('/profile');
    } catch (caught) {
      setIsSaving(false);
      setError(caught instanceof Error ? caught.message : "Parolni yangilab bo'lmadi.");
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">Xavfsizlik</span>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto mt-4">
        <section className="bg-surface-container-low p-8 rounded-3xl text-center space-y-4 border border-outline-variant/10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-on-surface">Hisobingiz xavfsiz</h2>
            <p className="text-sm text-on-surface-variant font-bold">Oxirgi kirish: Bugun, 10:34</p>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-lg font-black text-on-surface ml-1">Parolni o'zgartirish</h3>
          {error && (
            <div className="p-3 rounded-2xl bg-error/10 text-error border border-error/15 text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Joriy parol</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl py-4 pl-12 pr-6 text-on-surface font-bold transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Yangi parol</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl py-4 pl-12 pr-6 text-on-surface font-bold transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Yangi parolni tasdiqlash</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl py-4 pl-12 pr-6 text-on-surface font-bold transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 p-5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSaving ? "Saqlanmoqda..." : (
              <>
                <Save className="w-6 h-6" />
                <span>Parolni yangilash</span>
              </>
            )}
          </button>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-on-surface ml-1">Qurilmalar</h3>
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-container/10 rounded-2xl flex items-center justify-center text-secondary-container">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface">iPhone 13 Pro</p>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Hozir faol</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
