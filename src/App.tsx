/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import PracticePage from './pages/PracticePage';
import ProfilePage from './pages/ProfilePage';
import LessonsPage from './pages/LessonsPage';
import PlacementTestPage from './pages/PlacementTestPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import ReferralPage from './pages/ReferralPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PersonalInfo from './pages/profile/PersonalInfo';
import Achievements from './pages/profile/Achievements';
import LearningHistory from './pages/profile/LearningHistory';
import Security from './pages/profile/Security';
import Notifications from './pages/profile/Notifications';
import LanguageSettings from './pages/profile/LanguageSettings';
import HelpCenter from './pages/profile/HelpCenter';
import { getPlacementTestResult } from './lib/localData';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Yuklanmoqda...</div>;
  if (!token) return <Navigate to="/login" />;
  if (
    user
    && user.role !== 'teacher'
    && !getPlacementTestResult(user.id)
    && location.pathname !== '/placement-test'
  ) {
    return <Navigate to="/placement-test" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  React.useEffect(() => {
    const telegramWebApp = (window as any).Telegram?.WebApp;
    if (!telegramWebApp) return;
    telegramWebApp.ready?.();
    telegramWebApp.expand?.();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/practice" element={
            <ProtectedRoute>
              <PracticePage />
            </ProtectedRoute>
          } />
          <Route path="/placement-test" element={
            <ProtectedRoute>
              <PlacementTestPage />
            </ProtectedRoute>
          } />
          <Route path="/teacher" element={
            <ProtectedRoute>
              <TeacherDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/referral" element={
            <ProtectedRoute>
              <ReferralPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/profile/personal-info" element={
            <ProtectedRoute>
              <PersonalInfo />
            </ProtectedRoute>
          } />
          <Route path="/profile/achievements" element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          } />
          <Route path="/profile/history" element={
            <ProtectedRoute>
              <LearningHistory />
            </ProtectedRoute>
          } />
          <Route path="/profile/security" element={
            <ProtectedRoute>
              <Security />
            </ProtectedRoute>
          } />
          <Route path="/profile/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/profile/language" element={
            <ProtectedRoute>
              <LanguageSettings />
            </ProtectedRoute>
          } />
          <Route path="/profile/help" element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          } />
          <Route path="/lessons" element={
            <ProtectedRoute>
              <LessonsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
