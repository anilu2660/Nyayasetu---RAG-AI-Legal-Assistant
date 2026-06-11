'use client';

import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Settings, Sparkles, Moon, Sun, Monitor, Type, Globe } from 'lucide-react';
import gsap from 'gsap';

const LANGUAGES = [
  { value: 'en', label: 'English', native: 'English (Official)' },
  { value: 'hi', label: 'Hindi',   native: 'हिन्दी' },
  { value: 'bn', label: 'Bengali', native: 'বাংলা' },
  { value: 'ta', label: 'Tamil',   native: 'தமிழ்' },
  { value: 'te', label: 'Telugu',  native: 'తెలుగు' },
  { value: 'mr', label: 'Marathi', native: 'मराठी' },
];

export default function SettingsModal() {
  const {
    theme, fontSize, language, isSettingsOpen,
    setTheme, setFontSize, setLanguage, setSettingsOpen,
  } = useStore();

  const cardRef = useRef<HTMLDivElement>(null);

  /* GSAP fade+scale in */
  useLayoutEffect(() => {
    if (isSettingsOpen && cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, scale: 0.93, y: 16 },
        { opacity: 1, scale: 1,    y: 0, duration: 0.3, ease: 'back.out(1.4)' }
      );
    }
  }, [isSettingsOpen]);

  const close = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, { opacity: 0, scale: 0.94, y: 12, duration: 0.2, ease: 'power2.in',
        onComplete: () => setSettingsOpen(false) });
    } else { setSettingsOpen(false); }
  };

  /* Load from backend on open */
  useEffect(() => {
    if (!isSettingsOpen) return;
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.settings) {
        setTheme(d.settings.theme);
        setFontSize(d.settings.fontSize);
        setLanguage(d.settings.language);
      }
    }).catch(() => {});
  }, [isSettingsOpen]);

  const save = async (key: string, value: string) => {
    if (key === 'theme')    setTheme(value as 'light' | 'dark');
    if (key === 'fontSize') setFontSize(value as 'small' | 'medium' | 'large');
    if (key === 'language') setLanguage(value);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {}
  };

  if (!isSettingsOpen) return null;

  /* ── Shared styles ── */
  const optionBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 12px',
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: active ? '1px solid rgba(124,106,247,0.4)' : '1px solid var(--border)',
    background: active ? 'rgba(124,106,247,0.15)' : 'var(--secondary)',
    color: active ? '#a78bfa' : 'var(--muted-foreground)',
    transition: 'all 0.2s',
  });

  const themeOption = (val: 'light' | 'dark', Icon: React.FC<any>, label: string) => (
    <button
      key={val}
      onClick={() => save('theme', val)}
      style={optionBtn(theme === val)}
      onMouseEnter={e => { if (theme !== val) { e.currentTarget.style.background = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; } }}
      onMouseLeave={e => { if (theme !== val) { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; } }}>
      <Icon size={14} />
      {label}
      {/* Toggle pill indicator */}
      {theme === val && (
        <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa', flexShrink: 0 }} />
      )}
    </button>
  );

  const sizeOption = (val: 'small' | 'medium' | 'large', label: string, preview: string) => (
    <button
      key={val}
      onClick={() => save('fontSize', val)}
      style={{ ...optionBtn(fontSize === val), flexDirection: 'column', gap: 3, flex: 1, padding: '10px 8px' }}
      onMouseEnter={e => { if (fontSize !== val) { e.currentTarget.style.background = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; } }}
      onMouseLeave={e => { if (fontSize !== val) { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; } }}>
      <span style={{ fontSize: preview, fontWeight: 800, lineHeight: 1 }}>A</span>
      <span style={{ fontSize: 10 }}>{label}</span>
    </button>
  );

  return (
    <div
      onClick={e => e.target === e.currentTarget && close()}
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}>
      <div ref={cardRef} style={{ width: '100%', maxWidth: 440, background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>

        {/* ── Header ── */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={15} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--foreground)', lineHeight: 1 }}>Settings</p>
              <p style={{ fontSize: 11, margin: 0, marginTop: 2, color: 'var(--muted-foreground)', lineHeight: 1 }}>Customise your NyayaSetu experience</p>
            </div>
          </div>
          <button onClick={close}
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted-foreground)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}>
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* THEME */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={14} style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interface Theme</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {themeOption('light', Sun, 'Light')}
              {themeOption('dark',  Moon, 'Dark')}
            </div>
            {/* Live preview chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme === 'dark' ? '#a78bfa' : '#f0a500', boxShadow: `0 0 8px ${theme === 'dark' ? '#a78bfa' : '#f0a500'}` }} />
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                Currently: <strong style={{ color: 'var(--foreground)' }}>{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</strong>
              </span>
            </div>
          </div>

          {/* DIVIDER */}
          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* FONT SIZE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Type size={14} style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Text Size</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {sizeOption('small',  'Small',  '14px')}
              {sizeOption('medium', 'Default','17px')}
              {sizeOption('large',  'Large',  '21px')}
            </div>
            {/* Size preview sentence */}
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
              <p style={{
                margin: 0, lineHeight: 1.6, color: 'var(--muted-foreground)',
                fontSize: fontSize === 'small' ? '12px' : fontSize === 'large' ? '16px' : '14px',
              }}>
                The quick brown fox — <em style={{ color: '#a78bfa' }}>NyayaSetu legal preview text.</em>
              </p>
            </div>
          </div>

          {/* DIVIDER */}
          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* LANGUAGE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={14} style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Response Language</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {LANGUAGES.map(lang => (
                <button key={lang.value} onClick={() => save('language', lang.value)}
                  style={{ ...optionBtn(language === lang.value), flexDirection: 'column', gap: 2, alignItems: 'flex-start', padding: '8px 12px' }}
                  onMouseEnter={e => { if (language !== lang.value) { e.currentTarget.style.background = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; } }}
                  onMouseLeave={e => { if (language !== lang.value) { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; } }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{lang.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{lang.native}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={13} style={{ color: '#f0a500', flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
            Language settings apply AI auto-translation to responses.
          </p>
        </div>
      </div>
    </div>
  );
}
