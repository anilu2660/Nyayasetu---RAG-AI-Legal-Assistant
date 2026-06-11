'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import Sidebar from '../../components/sidebar';
import ChatInterface from '../../components/chat-interface';
import SettingsModal from '../../components/settings-modal';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, setUser, theme, setTheme } = useStore();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, [setUser]);

  // Synchronize theme state with DOM class on first load
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  if (isCheckingSession) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">
          Setting up legal secure channel...
        </p>
      </div>
    );
  }

  return (
    <main className="w-screen h-screen flex overflow-hidden bg-background select-none">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Primary Chat consultation space */}
      <ChatInterface />

      {/* Settings Modal */}
      <SettingsModal />
    </main>
  );
}
