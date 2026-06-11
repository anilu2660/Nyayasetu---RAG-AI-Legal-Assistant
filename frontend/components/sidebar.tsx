'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  Plus, MessageSquare, Trash2, Folder,
  Settings, LogOut, FileText,
  X, ChevronLeft, BookOpen, Search
} from 'lucide-react';
import gsap from 'gsap';

export default function Sidebar() {
  const {
    chats, activeChatId, documents, isSidebarOpen,
    setChats, addChat, deleteChatStore, setActiveChatId,
    setMessages, setDocuments, addDocumentStore, deleteDocumentStore,
    setSidebarOpen, toggleSettings, user, setUser,
  } = useStore();

  const [activeTab,    setActiveTab]    = useState<'chats' | 'docs'>('chats');
  const [searchQuery,  setSearchQuery]  = useState('');
  const sidebarRef = useRef<HTMLDivElement>(null);

  /* GSAP slide-in on mount */
  useLayoutEffect(() => {
    if (isSidebarOpen && sidebarRef.current) {
      gsap.fromTo(sidebarRef.current,
        { x: -280, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [isSidebarOpen]);

  /* Load data */
  useEffect(() => { fetchChats(); fetchDocuments(); }, []);

  const fetchChats = async () => {
    try {
      const res  = await fetch('/api/chat');
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
        if (data.chats.length > 0 && !activeChatId) handleSelectChat(data.chats[0].id);
      }
    } catch {}
  };

  const fetchDocuments = async () => {
    try {
      const res  = await fetch('/api/documents');
      const data = await res.json();
      if (data.documents) setDocuments(data.documents);
    } catch {}
  };

  const handleCreateChat = async () => {
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title: `Legal Query ${chats.length + 1}` }),
      });
      const data = await res.json();
      if (data.chat) { addChat(data.chat); handleSelectChat(data.chat.id); }
    } catch {}
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    try {
      const res  = await fetch(`/api/chat?chatId=${chatId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {}
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      const res  = await fetch(`/api/chat?chatId=${chatId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { deleteChatStore(chatId); if (activeChatId === chatId) setMessages([]); }
    } catch {}
  };


  const handleDeleteDoc = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      const res  = await fetch(`/api/documents?docId=${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) deleteDocumentStore(docId);
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      setUser(null);
      window.location.href = '/';
    } catch {}
  };

  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSidebarOpen) return null;

  const S: React.CSSProperties = {}; // just for type

  return (
    <div ref={sidebarRef} style={{
      width: 260,
      height: '100%',
      background: 'var(--card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      zIndex: 20,
    }}>

      {/* ── Logo row ── */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7c6af7,#5b50d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, boxShadow: '0 4px 12px rgba(124,106,247,0.35)' }}>⚖️</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, lineHeight: 1, color: 'var(--foreground)' }}>NyayaSetu</p>
            <p style={{ fontSize: 9,  fontWeight: 600, color: 'var(--muted-foreground)', margin: 0, marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Indian Legal AI</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)}
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted-foreground)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}>
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* ── New Chat button ── */}
      <div style={{ padding: '0 12px 10px' }}>
        <button onClick={handleCreateChat}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)', color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.18)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.1)';  e.currentTarget.style.borderColor = 'rgba(124,106,247,0.2)'; }}>
          <Plus size={15} />
          New Legal Query
        </button>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '0 12px 8px', position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search queries…"
          style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 9, background: 'var(--input)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
          onFocus={e => (e.target.style.borderColor = 'rgba(124,106,247,0.4)')}
          onBlur={e =>  (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* ── Recents label ── */}
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', padding: '0 16px 6px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Recents</p>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted-foreground)', fontSize: 12 }}>
              {searchQuery ? 'No results found' : 'No query sessions yet'}
            </div>
          ) : (
            filteredChats.map(chat => (
              <div key={chat.id} onClick={() => handleSelectChat(chat.id)}
                className="sidebar-chat-item"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  background: activeChatId === chat.id ? 'var(--secondary)' : 'transparent',
                }}
                onMouseEnter={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'var(--muted)'; (e.currentTarget.querySelector('.delete-btn') as HTMLElement)?.style && ((e.currentTarget.querySelector('.delete-btn') as HTMLElement).style.opacity = '1'); }}
                onMouseLeave={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'transparent'; (e.currentTarget.querySelector('.delete-btn') as HTMLElement)?.style && ((e.currentTarget.querySelector('.delete-btn') as HTMLElement).style.opacity = '0'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <BookOpen size={13} style={{ color: activeChatId === chat.id ? '#a78bfa' : 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: activeChatId === chat.id ? 600 : 400, color: activeChatId === chat.id ? 'var(--foreground)' : 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
                </div>
                <button className="delete-btn" onClick={e => handleDeleteChat(e, chat.id)}
                  style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--muted-foreground)', opacity: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Footer / User ── */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
            {user ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user ? user.name : 'Citizen Guest'}</p>
            <p style={{ fontSize: 10, margin: 0, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user ? user.email : 'Local session'}</p>
          </div>
          <button onClick={toggleSettings} title="Settings"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted-foreground)', transition: 'all 0.2s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.15)'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <Settings size={14} />
          </button>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'var(--secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <LogOut size={13} />
          {user ? 'Sign Out' : 'Clear Session'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
