'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useStore, Message } from '../store/useStore';
import {
  ArrowUp, Copy, Check, RotateCw,
  ThumbsUp, ThumbsDown, Menu, Sparkles,
  Info, Mic, Paperclip, Square, Loader2, X, FileText,
} from 'lucide-react';
import gsap from 'gsap';

/* ─── Markdown parser ─── */
function parseBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ fontWeight: 700, color: 'var(--foreground)' }}>{p.slice(2, -2)}</strong>
      : p
  );
}

function renderContent(content: string) {
  if (!content) return null;
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    const t = line.trim();
    if (t.startsWith('### ')) return (
      <h3 key={idx} style={{ fontSize: '0.95em', fontWeight: 700, color: '#a78bfa', marginTop: 18, marginBottom: 6, borderBottom: '1px solid rgba(124,106,247,0.15)', paddingBottom: 4 }}>
        {t.slice(4)}
      </h3>
    );
    if (t.startsWith('## ')) return (
      <h2 key={idx} style={{ fontSize: '1.05em', fontWeight: 800, color: 'var(--foreground)', marginTop: 22, marginBottom: 8 }}>
        {t.slice(3)}
      </h2>
    );
    if (t.startsWith('> ')) return (
      <div key={idx} style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(240,165,0,0.06)', borderLeft: '3px solid #f0a500', borderRadius: '0 8px 8px 0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Info size={13} style={{ color: '#f0a500', flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.85em', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
          {t.slice(2).replace('**Disclaimer**:', '').trim()}
        </p>
      </div>
    );
    if (t.startsWith('- ') || t.startsWith('* ')) return (
      <li key={idx} style={{ marginLeft: 18, marginBottom: 4, fontSize: '0.9em', color: 'var(--foreground)', lineHeight: 1.7, opacity: 0.9 }}>
        {parseBold(t.slice(2))}
      </li>
    );
    if (/^\d+\.\s/.test(t)) return (
      <li key={idx} style={{ marginLeft: 18, marginBottom: 4, fontSize: '0.9em', color: 'var(--foreground)', lineHeight: 1.7, opacity: 0.9, listStyleType: 'decimal' }}>
        {parseBold(t.replace(/^\d+\.\s/, ''))}
      </li>
    );
    if (t === '') return <div key={idx} style={{ height: 6 }} />;
    return (
      <p key={idx} style={{ fontSize: '0.9em', color: 'var(--foreground)', opacity: 0.9, margin: '4px 0', lineHeight: 1.75 }}>
        {parseBold(line)}
      </p>
    );
  });
}

/* ─── Starter prompts ─── */
const STARTERS = [
  { icon: '🚔', title: 'FIR & Police Procedure',   text: 'How can I register an e-FIR under the new BNSS criminal code?' },
  { icon: '🛒', title: 'Consumer Complaint',        text: 'What steps should I follow to file a complaint against a defective product?' },
  { icon: '⚖️', title: 'Fundamental Rights',        text: 'What protections are guaranteed under Article 21 (Right to Life)?' },
  { icon: '🆓', title: 'Free Legal Assistance',     text: 'Who is eligible for free legal aid in India, and how do I apply?' },
];

/* ─── Follow-ups ─── */
function getFollowUps(content: string): string[] {
  const c = content.toLowerCase();
  if (c.includes('consumer'))                          return ['How do I file on E-Daakhil?', 'What is the filing fee for consumer court?'];
  if (c.includes('fir') || c.includes('nagarik'))      return ['What is the difference between FIR and Zero FIR?', 'Can police refuse to file an FIR?'];
  if (c.includes('fundamental') || c.includes('constitution')) return ['What is Article 21 in detail?', 'How do I file a writ petition under Article 32?'];
  if (c.includes('legal aid') || c.includes('nalsa')) return ['How do I apply for free legal aid?', 'Is there a salary limit for free legal aid?'];
  return ['What are the next legal steps?', 'Which sections govern this case?'];
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function ChatInterface() {
  const {
    activeChatId, messages, isLoadingResponse,
    isSidebarOpen, setSidebarOpen,
    addMessage, updateMessageFeedbackStore,
    setLoadingResponse, setMessages,
    fontSize, theme, addDocumentStore,
    chats, setChats,
  } = useStore();

  const [input,     setInput]     = useState('');
  const [copiedId,  setCopiedId]  = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ id?: string; name: string; type: string; isUploading: boolean } | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const headerRef      = useRef<HTMLDivElement>(null);
  const inputAreaRef   = useRef<HTMLDivElement>(null);

  /* Auto scroll */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoadingResponse]);

  /* Auto resize textarea */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  /* GSAP header and input entrance */
  useLayoutEffect(() => {
    const tl = gsap.timeline();
    if (headerRef.current)   tl.fromTo(headerRef.current,   { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
    if (inputAreaRef.current) tl.fromTo(inputAreaRef.current, { y: 20, opacity: 0 },  { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.2');
  }, []);

  /* Animate new messages */
  useEffect(() => {
    const msgs = document.querySelectorAll('.msg-item:not(.animated)');
    msgs.forEach(el => {
      el.classList.add('animated');
      gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError('File exceeds 10 MB limit.'); return; }
    
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    setPendingFile({ name: file.name, type: fileExt, isUploading: true });
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (activeChatId) {
      formData.append('chatId', activeChatId);
    }
    try {
      const res  = await fetch('/api/documents', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.document) {
        addDocumentStore(data.document);
        setPendingFile({ id: data.document.id, name: data.document.name, type: fileExt, isUploading: false });
      } else {
        setUploadError(data.error || 'Upload failed.');
        setPendingFile(null);
      }
    } catch {
      setUploadError('Network error uploading document.');
      setPendingFile(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePendingFile = async () => {
    if (pendingFile && pendingFile.id) {
      try {
        await fetch(`/api/documents?docId=${pendingFile.id}`, { method: 'DELETE' });
      } catch {}
    }
    setPendingFile(null);
  };

  /* ── Handlers ── */
  const handleSend = async (text: string) => {
    if ((!text.trim() && !pendingFile) || !activeChatId || isLoadingResponse) return;

    const docName = pendingFile && !pendingFile.isUploading ? pendingFile.name : undefined;
    const docType = pendingFile && !pendingFile.isUploading ? pendingFile.type : undefined;

    let finalMsgText = text;
    if (!finalMsgText.trim() && docName) {
      finalMsgText = `Analyze the uploaded document: ${docName}`;
    }

    const isFirstMsg = messages.length === 0;

    setInput('');
    setPendingFile(null);
    setLoadingResponse(true);

    const userMsg: Message = { 
      id: Math.random().toString(), 
      chatId: activeChatId, 
      role: 'user', 
      content: finalMsgText, 
      timestamp: new Date().toISOString(),
      documentName: docName,
      documentType: docType
    };
    addMessage(userMsg);

    const aiId = Math.random().toString();
    addMessage({ id: aiId, chatId: activeChatId, role: 'assistant', content: '', timestamp: new Date().toISOString() });

    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          action: 'send', 
          chatId: activeChatId, 
          message: finalMsgText,
          documentName: docName,
          documentType: docType
        }) 
      });
      if (!res.body) throw new Error('No stream');

      // Re-fetch chat list asynchronously if it is the first message to update the sidebar title
      if (isFirstMsg) {
        fetch('/api/chat')
          .then(r => r.json())
          .then(data => {
            if (data.chats) setChats(data.chats);
          })
          .catch(() => {});
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false, acc = '';
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        acc += decoder.decode(value, { stream: !done });
        useStore.setState(s => ({ messages: s.messages.map(m => m.id === aiId ? { ...m, content: acc } : m) }));
      }
      const final = await fetch(`/api/chat?chatId=${activeChatId}`);
      const data  = await final.json();
      if (data.messages) setMessages(data.messages);
    } catch {
      useStore.setState(s => ({ messages: s.messages.map(m => m.id === aiId ? { ...m, content: 'Sorry, I encountered an issue. Please try again.' } : m) }));
    } finally { setLoadingResponse(false); }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, rating: 'thumbs_up' | 'thumbs_down' | null) => {
    try {
      const res  = await fetch('/api/chat/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId, feedback: rating }) });
      const data = await res.json();
      if (data.success) updateMessageFeedbackStore(messageId, rating);
    } catch {}
  };

  const handleRegenerate = async (msgIndex: number) => {
    let lastUser = '';
    for (let i = msgIndex - 1; i >= 0; i--) { if (messages[i].role === 'user') { lastUser = messages[i].content; break; } }
    if (lastUser) { setMessages(messages.slice(0, msgIndex)); handleSend(lastUser); }
  };

  /* ── Icon btn style ── */
  const iconBtn = (active?: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
    borderRadius: 7, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
    color: active ? '#a78bfa' : 'var(--muted-foreground)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background)', overflow: 'hidden', position: 'relative' }}>

      {/* ── Header ── */}
      <div ref={headerRef} style={{ height: 56, borderBottom: '1px solid var(--border)', background: theme === 'dark' ? 'rgba(17,17,24,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isSidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted-foreground)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}>
              <Menu size={15} />
            </button>
          )}
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--foreground)', lineHeight: 1 }}>NyayaSetu AI</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e', animation: 'pulse-green 2s infinite' }} />
              <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Legal AI Active · BNS / BNSS / BSA</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 9999, background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.18)' }}>
          <Sparkles size={11} style={{ color: '#f0a500' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f0a500' }}>Indian Law Advisor</span>
        </div>
      </div>

      {/* ── Message area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
        {!activeChatId ? (
          /* ── Welcome screen ── */
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', maxWidth: 680, margin: '0 auto', gap: 32 }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 20, background: 'linear-gradient(135deg,#7c6af7,#5b50d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 12px 32px rgba(124,106,247,0.4)' }}>⚖️</div>
              <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2.1rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: 0, lineHeight: 1.1, color: 'var(--foreground)' }}>
                How can I assist your<br />
                <span style={{ background: 'linear-gradient(135deg,#a78bfa,#7c6af7,#f0a500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>legal inquiry?</span>
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted-foreground)', maxWidth: 400, lineHeight: 1.7, margin: 0 }}>
                Ask about Indian laws, upload legal documents, or explore rights under BNS, BNSS, Constitution, and more.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
              {STARTERS.map((p, i) => (
                <button key={i} onClick={() => handleSend(p.text)}
                  style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 90 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.07)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{p.title}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.text}</p>
                </button>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* ── Empty chat ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--muted-foreground)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#7c6af7,#5b50d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 8px 24px rgba(124,106,247,0.3)' }}>⚖️</div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Start your legal consultation</p>
            <p style={{ fontSize: 12, margin: 0, opacity: 0.7 }}>Ask any question about Indian laws and regulations.</p>
          </div>
        ) : (
          /* ── Messages ── */
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {messages.map((msg, idx) => {
              const isAi = msg.role === 'assistant';
              const isTyping = !msg.content && isAi && isLoadingResponse && idx === messages.length - 1;

              return (
                <div key={msg.id} className="msg-item" style={{ display: 'flex', gap: 14, padding: '18px 0', borderBottom: idx < messages.length - 1 ? '1px solid var(--border)' : 'none' }}>

                  {/* Avatar */}
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {isAi ? (
                      <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg,#7c6af7,#5b50d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 4px 12px rgba(124,106,247,0.35)' }}>⚖️</div>
                    ) : (
                      <div style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>
                        {useStore.getState().user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{isAi ? 'NyayaSetu' : 'You'}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Message body */}
                    {isTyping ? (
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 0' }}>
                        {[0, 150, 300].map(d => (
                          <span key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--muted-foreground)', display: 'inline-block', animation: 'dotBounce 1.2s infinite', animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    ) : isAi ? (
                      <div style={{ lineHeight: 1.7 }}>{renderContent(msg.content)}</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {msg.documentName && (
                          <div style={{
                            alignSelf: 'flex-start',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 12,
                            minWidth: 220,
                            maxWidth: 320,
                            boxSizing: 'border-box'
                          }}>
                            {/* Red Icon Box */}
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FileText size={18} style={{ color: '#ffffff' }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={msg.documentName}>
                                {msg.documentName}
                              </p>
                              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', margin: 0, marginTop: 2, textTransform: 'uppercase' }}>
                                {msg.documentType || 'FILE'}
                              </p>
                            </div>
                          </div>
                        )}
                        {msg.content && (
                          <p style={{ fontSize: '0.9em', color: 'var(--foreground)', margin: 0, lineHeight: 1.75, whiteSpace: 'pre-wrap', opacity: 0.92 }}>{msg.content}</p>
                        )}
                      </div>
                    )}

                    {/* Sources */}
                    {isAi && msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {msg.sources.map((src, si) => (
                          <span key={si} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 9999, background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.18)', color: '#a78bfa', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            📄 {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action row for AI */}
                    {isAi && msg.content && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 10, paddingTop: 8, flexWrap: 'wrap' }}>
                        <button style={iconBtn(copiedId === msg.id)} onClick={() => handleCopy(msg.id, msg.content)}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                          onMouseLeave={e => (e.currentTarget.style.color = copiedId === msg.id ? '#a78bfa' : 'var(--muted-foreground)')}>
                          {copiedId === msg.id ? <><Check size={13} style={{ color: '#22c55e' }} /> Copied</> : <><Copy size={13} /> Copy</>}
                        </button>
                        <button style={iconBtn()} onClick={() => handleRegenerate(idx)}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}>
                          <RotateCw size={13} /> Regenerate
                        </button>
                        <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px' }} />
                        <button style={iconBtn(msg.feedback === 'thumbs_up')} onClick={() => handleFeedback(msg.id, msg.feedback === 'thumbs_up' ? null : 'thumbs_up')}
                          onMouseEnter={e => (e.currentTarget.style.color = '#22c55e')}
                          onMouseLeave={e => (e.currentTarget.style.color = msg.feedback === 'thumbs_up' ? '#a78bfa' : 'var(--muted-foreground)')}>
                          <ThumbsUp size={13} />
                        </button>
                        <button style={iconBtn(msg.feedback === 'thumbs_down')} onClick={() => handleFeedback(msg.id, msg.feedback === 'thumbs_down' ? null : 'thumbs_down')}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = msg.feedback === 'thumbs_down' ? '#a78bfa' : 'var(--muted-foreground)')}>
                          <ThumbsDown size={13} />
                        </button>
                      </div>
                    )}

                    {/* Follow-ups */}
                    {isAi && msg.content && idx === messages.length - 1 && !isLoadingResponse && (
                      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {getFollowUps(msg.content).map((q, qi) => (
                          <button key={qi} onClick={() => handleSend(q)}
                            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 9999, background: 'rgba(124,106,247,0.07)', border: '1px solid rgba(124,106,247,0.18)', color: '#a78bfa', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.16)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.07)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.18)'; }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input area ── */}
      <div ref={inputAreaRef} style={{ flexShrink: 0, padding: '12px 24px 20px', position: 'relative', zIndex: 10 }}>
        <form
          onSubmit={e => { e.preventDefault(); if (activeChatId) handleSend(input); }}
          style={{ maxWidth: 760, margin: '0 auto' }}>

          {uploadError && (
            <div style={{
              padding: '6px 12px', borderRadius: 8, background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.15)', color: '#ff4d4f', fontSize: 11, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
            }}>
              <span>{uploadError}</span>
              <button type="button" onClick={() => setUploadError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#ff4d4f', display: 'flex', alignItems: 'center' }}>
                <X size={12} />
              </button>
            </div>
          )}

          {/* Main input box — GPT style */}
          <div style={{ 
            background: 'var(--input)', 
            border: '1px solid var(--border)', 
            borderRadius: 16, 
            padding: '10px 12px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 10, 
            transition: 'border-color 0.2s, box-shadow 0.2s', 
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)' 
          }}
            onFocusCapture={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(124,106,247,0.4)'; el.style.boxShadow = '0 0 0 3px rgba(124,106,247,0.08), 0 4px 24px rgba(0,0,0,0.15)'; }}
            onBlurCapture={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)'; }}>

            {/* File upload preview card (top) */}
            {pendingFile && (
              <div style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 12,
                minWidth: 220,
                maxWidth: 280,
                boxSizing: 'border-box',
                position: 'relative'
              }}>
                {/* Red Icon Box */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {pendingFile.isUploading ? (
                    <Loader2 size={16} style={{ color: '#ffffff', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <FileText size={16} style={{ color: '#ffffff' }} />
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pendingFile.name}>
                    {pendingFile.name}
                  </p>
                  <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted-foreground)', margin: 0, marginTop: 1, textTransform: 'uppercase' }}>
                    {pendingFile.type}
                  </p>
                </div>
                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleRemovePendingFile}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    padding: 0,
                    marginLeft: 6
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {/* Bottom row for input and buttons */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, width: '100%' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={isUploading || !activeChatId}
              />

              {/* Upload attachment button */}
              <button
                type="button"
                disabled={!activeChatId || isUploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted-foreground)',
                  transition: 'all 0.2s',
                  marginBottom: 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                title="Upload legal document (PDF, DOCX, TXT, Image)">
                {isUploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#a78bfa' }} /> : <Paperclip size={16} />}
              </button>

              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (activeChatId) handleSend(input); } }}
                placeholder={activeChatId ? 'Ask a legal question…' : 'Select or create a query session first…'}
                disabled={!activeChatId || isLoadingResponse}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: '0.9em', color: 'var(--foreground)', lineHeight: 1.6, maxHeight: 200, fontFamily: 'var(--font-sans)', padding: 0, paddingBottom: 6 }}
              />

              {/* Send / Stop button */}
              <button
                type="submit"
                disabled={!activeChatId || (!input.trim() && !pendingFile && !isLoadingResponse)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: 'none',
                  background: isLoadingResponse ? 'var(--secondary)' : (input.trim() || pendingFile) ? (theme === 'dark' ? '#ffffff' : '#111118') : 'var(--secondary)',
                  color: (input.trim() || pendingFile) || isLoadingResponse ? (theme === 'dark' ? '#000000' : '#ffffff') : 'var(--muted-foreground)',
                  boxShadow: (input.trim() || pendingFile) && !isLoadingResponse ? '0 4px 12px rgba(124,106,247,0.2)' : 'none',
                  marginBottom: 1,
                }}>
                {isLoadingResponse ? <Square size={12} /> : <ArrowUp size={16} />}
              </button>
            </div>
          </div>

          {/* Footer hint */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, gap: 6, alignItems: 'center' }}>
            <Info size={11} style={{ color: 'var(--muted-foreground)', opacity: 0.6 }} />
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', opacity: 0.6 }}>
              Responses conform to BNS, BNSS, BSA codes. Always consult a qualified lawyer. · Enter to send, Shift+Enter for new line.
            </span>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes dotBounce { 0%,80%,100% { transform:translateY(0);opacity:0.4; } 40% { transform:translateY(-6px);opacity:1; } }
        @keyframes pulse-green { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}
