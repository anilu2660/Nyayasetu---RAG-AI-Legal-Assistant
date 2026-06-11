'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  Sparkles, ShieldCheck, Languages, ArrowRight, FileText,
  CheckCircle2, Lock, Mail, Landmark, Scale, BookOpen, Zap,
  Globe, Star, ChevronRight, Menu, Bot, MessageSquare, Upload,
  Clock, Loader2, X, User, Quote, LayoutDashboard,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ─── Data ─── */
const NAV_LINKS = [
  { label: 'Features',      href: 'features'      },
  { label: 'How It Works',  href: 'how-it-works'  },
  { label: 'Benefits',      href: 'benefits'      },
  { label: 'Testimonials',  href: 'testimonials'  },
];

const LAWS = [
  'Bharatiya Nyaya Sanhita 2023',
  'BNSS — Nagarik Suraksha Sanhita',
  'Bharatiya Sakshya Adhiniyam',
  'Constitution of India',
  'Consumer Protection Act',
  'Free Legal Aid · NALSA',
  'Cyber Laws of India',
  'RTI Act 2005',
  'POCSO Act',
  'Domestic Violence Act',
];

const FEATURES = [
  { icon: FileText,    color: '#818cf8', bg: 'rgba(129,140,248,0.1)', title: 'RAG Document Engine',       desc: 'Upload PDF, DOCX, or image contracts. Semantic chunking + vector search retrieves exact provisions every time.' },
  { icon: ShieldCheck, color: '#34d399', bg: 'rgba(52,211,153,0.1)',  title: 'Safety Guardrails',         desc: 'Domain-restricted prompting blocks non-legal queries. Structured disclaimers on every response.' },
  { icon: Languages,   color: '#f0a500', bg: 'rgba(240,165,0,0.1)',   title: 'Multilingual Responses',    desc: 'Hindi, Bengali, Marathi, Tamil, Telugu — accurate legal terminology preserved across languages.' },
  { icon: Scale,       color: '#c084fc', bg: 'rgba(192,132,252,0.1)', title: 'BNS / BNSS / BSA Coverage', desc: 'Deep coverage of new Indian Penal codes enacted in 2023, replacing IPC / CrPC / IEA.' },
  { icon: BookOpen,    color: '#f87171', bg: 'rgba(248,113,113,0.1)', title: 'Legal Aid Discovery',       desc: 'Know your rights under Article 39A. Find NALSA, DLSA schemes and eligibility instantly.' },
  { icon: Zap,         color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  title: 'Streaming Answers',         desc: 'Responses stream real-time in <5 s with source citations, follow-up suggestions, and structured overviews.' },
];

const STEPS = [
  { icon: MessageSquare, title: 'Ask Anything Legal',      desc: 'Type in plain language or paste a legal notice — any Indian law topic.' },
  { icon: Upload,        title: 'Upload Documents',         desc: 'Attach PDFs, contracts, FIRs. The RAG engine indexes and retrieves relevant passages.' },
  { icon: Bot,           title: 'AI Reasons & Cites',      desc: 'NyayaSetu cites exact sections — Art. 21, Sec. 303 BNS — never fabricates.' },
  { icon: CheckCircle2,  title: 'Structured Output',        desc: 'Overview → Provisions → Next Steps → Professional disclaimer, every time.' },
];

const BENEFITS = [
  { icon: Clock,       title: '24 / 7 Availability',  desc: 'Instant answers any time — no waiting for office hours.' },
  { icon: Globe,       title: 'Rural Accessibility',   desc: 'Simple language designed for every Indian, city or village.' },
  { icon: ShieldCheck, title: 'Session-Private',       desc: 'Your documents stay within your session — never stored.' },
  { icon: Scale,       title: 'Pinpoint Citations',    desc: 'References exact articles & sections. No hallucinated laws.' },
];

const TESTIMONIALS = [
  { text: 'I was confused about filing a police complaint under the new BNS codes. NyayaSetu explained the e-FIR process citing Section 173 BNSS instantly.', name: 'Rahul Verma', role: 'Citizen, New Delhi' },
  { text: 'As a law student I use NyayaSetu to cross-check case references. The RAG pipeline retrieves accurate document paragraphs — excellent research tool.', name: 'Meera Joshi', role: 'Law Student, Pune' },
  { text: 'My consumer complaint was filed successfully after NyayaSetu explained every step under the Consumer Protection Act, 2019.', name: 'Anil Sharma', role: 'Homebuyer, Bengaluru' },
];

const CHAT_DEMO = [
  { role: 'user', text: 'What is the process for filing an e-FIR under BNSS?' },
  { role: 'ai',   text: 'Under **Section 173 BNSS 2023**, you may register an e-FIR digitally for any cognizable offense regardless of jurisdiction (Zero FIR). Authentication required within **3 days**.', badge: '§173 · BNSS 2023' },
  { role: 'user', text: 'What if the police refuse to register the FIR?' },
  { role: 'ai',   text: 'You may file a complaint before the **Superintendent of Police** (§173 BNSS) or approach the Magistrate under **Section 175 BNSS**. A Writ of Mandamus under **Art. 226** is also available.', badge: '§175 BNSS · Art. 226' },
];

/* ─── Helpers ─── */
function parseBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') ? <strong key={i} style={{ color: '#a78bfa', fontWeight: 600 }}>{p.slice(2, -2)}</strong> : p
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function LandingPage() {
  const router   = useRouter();
  const { user, setUser, theme, setTheme } = useStore();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [authOpen,    setAuthOpen]    = useState(false);
  const [authMode,    setAuthMode]    = useState<'login'|'register'>('login');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [name,        setName]        = useState('');
  const [authError,   setAuthError]   = useState<string|null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [chatIdx,     setChatIdx]     = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  /* Apply theme to html element on mount */
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') { html.classList.add('dark'); html.classList.remove('light'); }
    else { html.classList.add('light'); html.classList.remove('dark'); }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const mainRef    = useRef<HTMLDivElement>(null);
  const heroRef    = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroChatRef = useRef<HTMLDivElement>(null);

  /* ── Navbar scroll shadow ── */
  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* ── Chat demo ticker ── */
  useEffect(() => {
    if (chatIdx >= CHAT_DEMO.length - 1) return;
    const t = setTimeout(() => setChatIdx(i => i + 1), 2200);
    return () => clearTimeout(t);
  }, [chatIdx]);

  /* ── Session check ── */
  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => { if (d?.user) setUser(d.user); }).catch(() => {});
  }, [setUser]);

  /* ══════════════════════════════════════
     GSAP ANIMATIONS
  ══════════════════════════════════════ */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      /* Hero entrance */
      const heroTl = gsap.timeline({ delay: 0.1 });
      heroTl
        .fromTo('.hero-badge',   { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
        .fromTo('.hero-h1',      { opacity: 0, y: 40  }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2')
        .fromTo('.hero-sub',     { opacity: 0, y: 24  }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .fromTo('.hero-cta',     { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
        .fromTo('.hero-stats',   { opacity: 0        }, { opacity: 1,         duration: 0.5                    }, '-=0.2')
        .fromTo('.hero-chat',    { opacity: 0, x: 40, scale: 0.96 }, { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: 'power3.out' }, '-=0.7');

      /* Orb elements removed from hero redesign — no parallax needed */

      /* Section reveals */
      gsap.utils.toArray<Element>('.gsap-fade').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } }
        );
      });
      gsap.utils.toArray<Element>('.gsap-slide-left').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, x: -50 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } }
        );
      });
      gsap.utils.toArray<Element>('.gsap-slide-right').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, x: 50 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } }
        );
      });

      /* Feature card stagger */
      gsap.fromTo('.feature-card-item',
        { opacity: 0, y: 50, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: '#features', start: 'top 80%' } }
      );

      /* Steps stagger */
      gsap.fromTo('.step-item',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.12,
          scrollTrigger: { trigger: '#how-it-works', start: 'top 82%' } }
      );

      /* Testimonial stagger */
      gsap.fromTo('.testimonial-item',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.15,
          scrollTrigger: { trigger: '#testimonials', start: 'top 82%' } }
      );

      /* CTA */
      gsap.fromTo('.cta-card',
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '.cta-card', start: 'top 85%' } }
      );

    }, mainRef);

    return () => ctx.revert();
  }, []);

  /* ─── Auth ─── */
  const openAuth = (mode: 'login' | 'register') => {
    if (user) { router.push('/dashboard'); return; }
    setAuthMode(mode);
    setAuthError(null);
    setEmail(''); setPassword(''); setName('');
    setAuthOpen(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: authMode, email, password, name: authMode === 'register' ? name : undefined }),
      });
      const data = await res.json();
      if (res.ok && data.user) { setUser(data.user); setAuthOpen(false); router.push('/dashboard'); }
      else setAuthError(data.error || 'Authentication failed.');
    } catch { setAuthError('Network error. Try again.'); }
    finally { setAuthLoading(false); }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div ref={mainRef} className="min-h-screen noise" style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-sans)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>

      {/* ─────────────────────────────────────
          NAVBAR
      ───────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 64,
        background: navScrolled ? (theme === 'dark' ? 'rgba(10,10,15,0.85)' : 'rgba(249,249,251,0.85)') : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        borderBottom: navScrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo */}
          <button onClick={() => scrollTo('hero')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div className="pulse-ring" style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c6af7, #5b50d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚖️</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--foreground)', margin: 0, lineHeight: 1 }}>NyayaSetu</p>
              <p style={{ fontSize: 9, color: '#6b6b82', fontWeight: 600, margin: 0, marginTop: 2, lineHeight: 1 }}>INDIAN JUSTICE BRIDGE</p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden-mobile">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)}
                style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}>
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTA + Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hidden-mobile">

            {/* ── Theme toggle pill ── */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
                borderRadius: 9999, padding: '4px 5px', cursor: 'pointer', transition: 'all 0.25s',
                width: 60, position: 'relative', height: 28,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,106,247,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)')}>
              {/* Track icons */}
              <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, opacity: theme === 'light' ? 0 : 0.5, transition: 'opacity 0.25s' }}>🌙</span>
              <span style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, opacity: theme === 'dark' ? 0 : 0.5, transition: 'opacity 0.25s' }}>☀️</span>
              {/* Thumb */}
              <span style={{
                position: 'absolute', top: 3,
                left: theme === 'dark' ? 3 : 31,
                width: 22, height: 22, borderRadius: '50%',
                background: theme === 'dark' ? '#a78bfa' : '#f59e0b',
                boxShadow: theme === 'dark' ? '0 0 8px rgba(167,139,250,0.6)' : '0 0 8px rgba(245,158,11,0.6)',
                transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), background 0.25s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>

            {user ? (
              <Button className="btn-glow" onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, height: 36, paddingLeft: 16, paddingRight: 16, fontSize: 13 }}>
                <LayoutDashboard size={14} /> Dashboard
              </Button>
            ) : (
              <>
                <button onClick={() => openAuth('login')} style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}>
                  Sign In
                </button>
                <button onClick={() => openAuth('register')} className="btn-glow"
                  style={{ fontSize: 13, fontWeight: 600, color: '#fff', padding: '7px 18px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Get Started <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--foreground)', display: 'none' }} className="show-mobile">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ position: 'fixed', top: 64, inset: '64px 0 0 0', zIndex: 40, background: theme === 'dark' ? 'rgba(10,10,15,0.97)' : 'rgba(249,249,251,0.97)', backdropFilter: 'blur(20px)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {NAV_LINKS.map(l => (
            <button key={l.label} onClick={() => scrollTo(l.href)}
              style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '8px 0' }}>
              {l.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Mobile theme toggle */}
            <button onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 600, padding: '12px 20px', borderRadius: 12, cursor: 'pointer', background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: '1px solid var(--border)', color: 'var(--foreground)', transition: 'all 0.2s' }}>
              <span style={{ fontSize: 18 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
            <button onClick={() => { openAuth('login'); setMobileOpen(false); }} className="btn-outline-glow" style={{ fontSize: 15, fontWeight: 600, padding: '12px 20px', borderRadius: 12, cursor: 'pointer' }}>Sign In</button>
            <button onClick={() => { openAuth('register'); setMobileOpen(false); }} className="btn-glow" style={{ fontSize: 15, fontWeight: 600, color: '#fff', padding: '12px 20px', borderRadius: 12, cursor: 'pointer' }}>Get Started</button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          HERO
      ───────────────────────────────────── */}
      <section id="hero" ref={heroRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 80, position: 'relative', overflow: 'hidden', background: 'var(--background)', transition: 'background-color 0.3s ease' }}>

        {/* Subtle top glow — very restrained */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,106,247,0.4), transparent)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 400, height: 280, background: theme === 'dark' ? 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(124,106,247,0.07) 0%, transparent 70%)' : 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(124,106,247,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ maxWidth: 1160, margin: '0 auto', width: '100%', padding: '80px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1 }} className="hero-grid">

          {/* LEFT */}
          <div ref={heroTextRef} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Eyebrow label — subtle, no shimmer */}
            <div className="hero-badge" style={{ opacity: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#6b6b82', letterSpacing: '0.02em' }}>
                  Available now — Indian Legal AI Assistant
                </span>
              </div>
            </div>

            {/* H1 — clean, restrained */}
            <h1 className="hero-h1" style={{ opacity: 0, fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.035em', margin: 0, color: 'var(--foreground)' }}>
              Understand Indian law.<br />
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>Without a law degree.</span>
            </h1>

            {/* Sub — concise, no keyword stuffing */}
            <p className="hero-sub" style={{ opacity: 0, fontSize: 15, color: 'var(--muted-foreground)', lineHeight: 1.8, maxWidth: 420, margin: 0, fontWeight: 400 }}>
              Ask questions about BNS, BNSS, Consumer Rights, or the Constitution. Upload documents and get accurate, cited answers in plain language.
            </p>

            {/* CTA row — primary + text link */}
            <div className="hero-cta" style={{ opacity: 0, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', paddingTop: 4 }}>
              <button onClick={() => openAuth('register')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', background: '#7c6af7', border: 'none', transition: 'opacity 0.2s, transform 0.2s', letterSpacing: '-0.01em' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Get started free
                <ArrowRight size={14} />
              </button>
              <button onClick={() => scrollTo('how-it-works')}
                style={{ fontSize: 14, fontWeight: 500, color: '#6b6b82', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.2s', padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ececec')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b6b82')}>
                See how it works <ChevronRight size={14} />
              </button>
            </div>

            {/* Trust line — not stats, just a quiet reassurance */}
            <div className="hero-stats" style={{ opacity: 0, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
              <ShieldCheck size={13} style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 400, opacity: 0.85 }}>Covers BNS · BNSS · BSA · Constitution · Consumer Law · RTI</span>
            </div>
          </div>

          {/* RIGHT — Chat preview (clean, no float animation) */}
          <div ref={heroChatRef} className="hero-chat" style={{ opacity: 0 }}>
            {/* Outer glow ring */}
            <div style={{ borderRadius: 18, padding: 1, background: 'linear-gradient(145deg, rgba(124,106,247,0.25), var(--border) 50%, rgba(124,106,247,0.08))', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
              <div style={{ borderRadius: 17, overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--border)' }}>

                {/* Window chrome — minimal 3-dot style */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: theme === 'dark' ? '#0f0f16' : '#f0f0f6' }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 5, background: 'rgba(124,106,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>⚖️</div>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>NyayaSetu — Legal AI</span>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                </div>

                {/* Messages */}
                <div style={{ padding: '16px 16px 10px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 260 }}>
                  {CHAT_DEMO.slice(0, chatIdx + 1).map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.role === 'ai' && (
                        <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(124,106,247,0.18)', border: '1px solid rgba(124,106,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginTop: 2 }}>⚖️</div>
                      )}
                      <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 5, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          padding: '8px 13px',
                          borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: msg.role === 'user' ? 'var(--primary)' : 'var(--secondary)',
                          border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
                          fontSize: 12, lineHeight: 1.6, color: msg.role === 'user' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        }}>
                          {parseBold(msg.text)}
                        </div>
                        {'badge' in msg && msg.badge && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.15)', color: '#8b7fd4', fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '0.01em' }}>
                            {msg.badge}
                          </span>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginTop: 2, color: '#a78bfa', fontWeight: 700 }}>U</div>
                      )}
                    </div>
                  ))}
                  {chatIdx < CHAT_DEMO.length - 1 && (
                    <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(124,106,247,0.18)', border: '1px solid rgba(124,106,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>⚖️</div>
                      <div style={{ padding: '8px 13px', borderRadius: '14px 14px 14px 4px', background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span className="dot-bounce" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--muted-foreground)', display: 'inline-block' }} />
                        <span className="dot-bounce" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--muted-foreground)', display: 'inline-block' }} />
                        <span className="dot-bounce" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--muted-foreground)', display: 'inline-block' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div style={{ padding: '0 14px 14px' }}>
                  <div onClick={() => openAuth('register')}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 13px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,106,247,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <p style={{ flex: 1, fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>Ask anything about Indian law…</p>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: '#7c6af7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowRight size={11} color="#fff" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          LAWS TICKER
      ───────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0', overflow: 'hidden', background: theme === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)' }}>
        <div className="ticker-inner" style={{ display: 'flex', gap: 40, width: 'max-content', whiteSpace: 'nowrap' }}>
          {[...LAWS, ...LAWS].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', flexShrink: 0 }}>
              <CheckCircle2 size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────
          FEATURES
      ───────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="gsap-fade" style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="badge-shimmer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
            <Zap size={12} /> Core Capabilities
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 14px', lineHeight: 1.1 }}>
            Everything You Need<br />for Legal Clarity
          </h2>
          <p style={{ fontSize: 15, color: '#6b6b82', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Built on a robust RAG pipeline with an offline Indian Legal Knowledge Base — no hallucinations, always cited.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card feature-card-item" style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, border: `1px solid ${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#6b6b82', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '100px 24px', background: theme === 'dark' ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.012)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="gsap-fade" style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="badge-shimmer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              <Scale size={12} /> Process Flow
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 14px', lineHeight: 1.1 }}>
              How NyayaSetu Works
            </h2>
            <p style={{ fontSize: 15, color: '#6b6b82', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              Four steps from your legal question to a cited, structured answer.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="step-item feature-card" style={{ padding: 28, position: 'relative', overflow: 'visible' }}>
                <div style={{ position: 'absolute', top: 18, right: 18, fontSize: 40, fontWeight: 900, color: 'rgba(124,106,247,0.07)', fontFamily: 'var(--font-mono)', lineHeight: 1, userSelect: 'none' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <s.icon size={18} style={{ color: '#a78bfa' }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#6b6b82', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          BENEFITS
      ───────────────────────────────────── */}
      <section id="benefits" style={{ padding: '100px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div className="gsap-fade" style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600, marginBottom: 16, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)', color: '#f0a500' }}>
            <Star size={12} /> Advantages
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 14px', lineHeight: 1.1 }}>
            Built for Every Indian Citizen
          </h2>
          <p style={{ fontSize: 15, color: '#6b6b82', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
            Legal awareness should not be a privilege. NyayaSetu makes it a right.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} className={`feature-card ${i % 2 === 0 ? 'gsap-slide-left' : 'gsap-slide-right'}`}
              style={{ padding: 24, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <b.icon size={18} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{b.title}</h3>
                <p style={{ fontSize: 13, color: '#6b6b82', lineHeight: 1.65, margin: 0 }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────
          TESTIMONIALS
      ───────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '100px 24px', background: theme === 'dark' ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.012)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="gsap-fade" style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="badge-shimmer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              <Quote size={12} /> What Citizens Say
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: 0, lineHeight: 1.1 }}>
              Real People. Real Justice.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card testimonial-item" style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                    {[...Array(5)].map((_, si) => <Star key={si} size={13} style={{ color: '#f0a500', fill: '#f0a500' }} />)}
                  </div>
                  <p style={{ fontSize: 14, color: '#8888a0', lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>"{t.text}"</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1 }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: '#6b6b82', margin: 0, marginTop: 3 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          CTA
      ───────────────────────────────────── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="cta-card glass" style={{ borderRadius: 24, padding: 'clamp(40px, 8vw, 72px)', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(124,106,247,0.15)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,106,247,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="pulse-ring" style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#7c6af7,#5b50d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(124,106,247,0.4)' }}>⚖️</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 14px', lineHeight: 1.1 }}>
                Empower Your Legal Literacy{' '}
                <span className="text-gradient">Today.</span>
              </h2>
              <p style={{ fontSize: 15, color: '#6b6b82', maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.75 }}>
                Create a free session, upload documents, and ask any legal question. Citation-backed answers in under 5 seconds.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => openAuth('register')} className="btn-glow"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  Access AI Legal Assistant
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => openAuth('login')} className="btn-outline-glow"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          FOOTER
      ───────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚖️</span>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>NyayaSetu</span>
            <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>— Bridging Citizens and Justice Through AI.</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)', maxWidth: 480, lineHeight: 1.65, margin: 0, opacity: 0.8 }}>
            NyayaSetu provides educational legal information only. It does not constitute professional legal advice or an attorney-client relationship. Always consult a qualified lawyer for your specific case.
          </p>
          <p style={{ fontSize: 10, color: '#3a3a4e', margin: 0 }}>© 2026 NyayaSetu. All rights reserved.</p>
        </div>
      </footer>

      {/* ─────────────────────────────────────
          AUTH MODAL
      ───────────────────────────────────── */}
      {authOpen && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setAuthOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>

            {/* Modal Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Landmark size={16} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>
                  {authMode === 'login' ? 'Sign in to NyayaSetu' : 'Create your account'}
                </span>
              </div>
              <button onClick={() => setAuthOpen(false)} style={{ background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}>
                <X size={14} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setAuthMode(m); setAuthError(null); }}
                  style={{ flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: authMode === m ? '2px solid #7c6af7' : '2px solid transparent', color: authMode === m ? '#a78bfa' : '#6b6b82', transition: 'all 0.2s' }}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {authError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.2)', color: '#ff4d4f', fontSize: 12, fontWeight: 500 }}>
                  {authError}
                </div>
              )}

              {authMode === 'register' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b82' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a4a5e', pointerEvents: 'none' }} />
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Verma" className="form-input" />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b82' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a4a5e', pointerEvents: 'none' }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="citizen@email.com" className="form-input" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b82' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a4a5e', pointerEvents: 'none' }} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="form-input" />
                </div>
              </div>

              <button type="submit" className="btn-glow" disabled={authLoading}
                style={{ width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: authLoading ? 0.7 : 1 }}>
                {authLoading ? (
                  <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
                ) : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Responsive helpers */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-chat { display: none !important; }
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
