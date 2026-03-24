import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  type Settings,
  type User,
  clearLocalSession,
  getSettings,
  restoreLocalSession,
  updateLocalUser,
  updateUserSettings,
} from '../lib/localData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  settings: Settings;
  login: (token: string, user: User, nextSettings?: Settings) => void;
  logout: () => void;
  updateUser: (newUser: Partial<User & { email: string }>) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const session = restoreLocalSession();

    if (session) {
      setToken(session.token);
      setUser(session.user);
      setSettings(session.settings);
    } else {
      setSettings(getSettings(null));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const login = (nextToken: string, nextUser: User, nextSettings?: Settings) => {
    setToken(nextToken);
    setUser(nextUser);
    setSettings(nextSettings || getSettings(nextUser.id));
  };

  const logout = () => {
    clearLocalSession();
    setToken(null);
    setUser(null);
    setSettings(getSettings(null));
  };

  const updateUserState = (newUser: Partial<User & { email: string }>) => {
    if (!user) {
      return;
    }

    const savedUser = updateLocalUser(user.id, newUser);
    if (savedUser) {
      setUser(savedUser);
    }
  };

  const updateSettingsState = (newSettings: Partial<Settings>) => {
    const nextSettings = updateUserSettings(user?.id ?? null, newSettings);
    setSettings(nextSettings);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      settings,
      login,
      logout,
      updateUser: updateUserState,
      updateSettings: updateSettingsState,
      loading,
    }),
    [loading, settings, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
