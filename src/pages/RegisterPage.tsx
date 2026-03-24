import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslateText } from '../lib/i18n';
import { registerLocalUser } from '../lib/localData';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const t = useTranslateText();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const session = registerLocalUser({ email, password, name });
      login(session.token, session.user, session.settings);
      navigate('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t({
        uz: 'Ro‘yxatdan o‘tishda xatolik yuz berdi.',
        en: 'Registration failed.',
        ru: 'Не удалось создать аккаунт.',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 bg-surface-container-lowest p-8 rounded-4xl shadow-xl border border-outline-variant/10"
      >
        <div className="text-center space-y-2">
          <span className="inline-flex px-3 py-1 rounded-full bg-secondary-container/10 text-secondary-container text-xs font-black tracking-widest uppercase">
            Sora AI
          </span>
          <h1 className="text-3xl font-extrabold text-on-surface">
            {t({
              uz: 'Yangi akkaunt yarating',
              en: 'Create a new account',
              ru: 'Создайте новый аккаунт',
            })}
          </h1>
          <p className="text-on-surface-variant">
            {t({
              uz: 'Yangi foydalanuvchi uchun barcha dars va mashqlar 0 dan boshlanadi.',
              en: 'Every new learner starts from zero with a clean lesson and practice history.',
              ru: 'Каждый новый пользователь начинает с нуля с чистой историей уроков и практики.',
            })}
          </p>
        </div>

        {error && (
          <div className="bg-error/10 text-error p-3 rounded-2xl text-sm font-medium border border-error/15">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-on-surface">
              {t({ uz: 'Ism', en: 'Name', ru: 'Имя' })}
            </span>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-surface-container-low rounded-2xl py-3.5 pl-12 pr-4 outline-none border border-transparent focus:border-primary text-on-surface"
                placeholder="Aziza"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-on-surface">
              {t({ uz: 'Email', en: 'Email', ru: 'Email' })}
            </span>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-surface-container-low rounded-2xl py-3.5 pl-12 pr-4 outline-none border border-transparent focus:border-primary text-on-surface"
                placeholder="example@mail.com"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-on-surface">
              {t({ uz: 'Parol', en: 'Password', ru: 'Пароль' })}
            </span>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-surface-container-low rounded-2xl py-3.5 pl-12 pr-4 outline-none border border-transparent focus:border-primary text-on-surface"
                placeholder="••••••••"
              />
            </div>
          </label>

          <button
            type="submit"
            className="w-full bg-secondary-container text-white font-bold py-4 rounded-2xl shadow-lg shadow-secondary-container/20 transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {t({ uz: 'Boshlash', en: 'Get Started', ru: 'Начать' })}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-center text-on-surface-variant text-sm">
          {t({
            uz: 'Akkauntingiz bormi?',
            en: 'Already have an account?',
            ru: 'Уже есть аккаунт?',
          })}{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            {t({ uz: 'Kirish', en: 'Sign in', ru: 'Войти' })}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
