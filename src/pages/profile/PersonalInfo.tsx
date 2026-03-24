import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Mail, Save, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PersonalInfo() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      window.alert('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      window.alert('Name and email are required.');
      return;
    }

    setIsSaving(true);
    updateUser({
      name,
      email,
      avatarUrl: avatarPreview,
    });
    setIsSaving(false);
    navigate('/profile');
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-3 px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <span className="text-xl font-extrabold text-primary font-headline">Shaxsiy ma'lumotlar</span>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={name || 'User avatar'}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-5xl font-black border-4 border-white shadow-xl">
                {name[0] || 'U'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-secondary-container rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-on-surface-variant font-bold text-sm uppercase tracking-widest">
            Profil rasmini ozgartirish
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-on-surface-variant uppercase tracking-wider ml-1">
              To'liq ism
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl py-4 pl-12 pr-6 text-on-surface font-bold transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-on-surface-variant uppercase tracking-wider ml-1">
              Email manzili
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
          {isSaving ? (
            'Saqlanmoqda...'
          ) : (
            <>
              <Save className="w-6 h-6" />
              <span>O'zgarishlarni saqlash</span>
            </>
          )}
        </button>
      </main>
    </div>
  );
}
