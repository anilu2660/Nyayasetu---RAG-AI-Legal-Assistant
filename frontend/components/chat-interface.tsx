'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useStore, Message } from '../store/useStore';
import {
  ArrowUp, Copy, Check, RotateCw,
  ThumbsUp, ThumbsDown, Menu, Sparkles,
  Info, Mic, Paperclip, Square, Loader2, X, FileText,
  Volume2, VolumeX,
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
    setActiveChatId, addChat,
    setUser,
  } = useStore();

  // Guest Trial Session timer check (10 minutes)
  useEffect(() => {
    const checkTrial = () => {
      if (typeof window !== 'undefined') {
        const trialStart = localStorage.getItem('nyayasetu_guest_trial_start');
        if (trialStart) {
          const elapsed = Date.now() - Number(trialStart);
          const limit = 10 * 60 * 1000; // 10 minutes
          if (elapsed >= limit) {
            localStorage.removeItem('nyayasetu_guest_trial_start');
            setUser(null);
            window.location.href = '/?trialExpired=true';
          }
        }
      }
    };
    checkTrial();
    const interval = setInterval(checkTrial, 5000);
    return () => clearInterval(interval);
  }, [setUser]);

  const [input,     setInput]     = useState('');
  const [copiedId,  setCopiedId]  = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ id?: string; name: string; type: string; isUploading: boolean } | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const headerRef      = useRef<HTMLDivElement>(null);
  const inputAreaRef   = useRef<HTMLDivElement>(null);

  /* Voice recording & transcription state & refs */
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingQueueActiveRef = useRef(false);
  const spokenTextLengthRef = useRef(0);
  const isVoiceOutputCancelledRef = useRef(false);

  // Load voice output setting on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isVoiceOutputEnabled');
      if (saved !== null) {
        setIsVoiceOutputEnabled(saved === 'true');
      }
    }
  }, []);

  const toggleVoiceOutput = () => {
    const newVal = !isVoiceOutputEnabled;
    setIsVoiceOutputEnabled(newVal);
    localStorage.setItem('isVoiceOutputEnabled', String(newVal));
    if (!newVal) {
      stopSpeaking();
    }
  };

  /* Auto scroll using GSAP for a premium, smooth deceleration curve */
  useEffect(() => {
    if (messageContainerRef.current) {
      gsap.to(messageContainerRef.current, {
        scrollTop: messageContainerRef.current.scrollHeight,
        duration: 0.6,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    }
  }, [messages, isLoadingResponse]);

  /* Auto resize textarea */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  /* GSAP entrance animations */
  useLayoutEffect(() => {
    const tl = gsap.timeline();
    if (headerRef.current)   tl.fromTo(headerRef.current,   { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
    if (inputAreaRef.current) tl.fromTo(inputAreaRef.current, { y: 20, opacity: 0 },  { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.2');
  }, []);

  /* GSAP Welcome screen animation using word staggers and 3D rotation */
  useLayoutEffect(() => {
    if (!activeChatId) {
      const tl = gsap.timeline();
      tl.fromTo('.welcome-logo', { scale: 0, rotate: -30, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.65, ease: 'back.out(1.7)' });
      tl.fromTo('.welcome-word', 
        { opacity: 0, y: 30, rotateX: -45, transformOrigin: '50% 50% -20px' }, 
        { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 
        '-=0.35'
      );
      tl.fromTo('.welcome-desc', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.35');
      tl.fromTo('.welcome-starter', { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, '-=0.25');
    }
  }, [activeChatId]);

  /* Animate new messages with staggered avatars and body bubbles */
  useEffect(() => {
    const msgs = document.querySelectorAll('.msg-item:not(.animated)');
    msgs.forEach(el => {
      el.classList.add('animated');
      
      const avatar = el.querySelector('.msg-avatar');
      const body = el.querySelector('.msg-body');
      
      const tl = gsap.timeline();
      tl.fromTo(el, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
      if (avatar) {
        tl.fromTo(avatar, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.3');
      }
      if (body) {
        tl.fromTo(body, { opacity: 0, x: el.classList.contains('ai-msg') ? -12 : 12 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25');
      }
    });
  }, [messages]);

  /* Animate followup buttons when they appear */
  useEffect(() => {
    if (!isLoadingResponse) {
      const btns = document.querySelectorAll('.followup-btn:not(.animated)');
      if (btns.length > 0) {
        btns.forEach(b => b.classList.add('animated'));
        gsap.fromTo(btns,
          { opacity: 0, y: 10, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.2)', delay: 0.1 }
        );
      }
    }
  }, [messages, isLoadingResponse]);

  /* GSAP starter hover animations */
  const handleStarterMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      y: -5,
      scale: 1.02,
      backgroundColor: theme === 'dark' ? 'rgba(124, 106, 247, 0.08)' : 'rgba(124, 106, 247, 0.04)',
      borderColor: 'rgba(124, 106, 247, 0.35)',
      boxShadow: theme === 'dark' 
        ? '0 10px 25px rgba(124, 106, 247, 0.15), 0 0 0 1px rgba(124, 106, 247, 0.2)' 
        : '0 10px 25px rgba(124, 106, 247, 0.08), 0 0 0 1px rgba(124, 106, 247, 0.1)',
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto'
    });
    const icon = e.currentTarget.querySelector('.starter-icon');
    if (icon) {
      gsap.to(icon, { scale: 1.25, rotate: 8, duration: 0.3, ease: 'back.out(1.5)', overwrite: 'auto' });
    }
  };

  const handleStarterMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      backgroundColor: 'var(--secondary)',
      borderColor: 'var(--border)',
      boxShadow: 'none',
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto'
    });
    const icon = e.currentTarget.querySelector('.starter-icon');
    if (icon) {
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    }
  };

  /* GSAP input container focus animations */
  const handleInputFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      borderColor: 'rgba(124, 106, 247, 0.5)',
      boxShadow: theme === 'dark'
        ? '0 0 0 3px rgba(124, 106, 247, 0.12), 0 8px 32px rgba(124, 106, 247, 0.08)'
        : '0 0 0 3px rgba(124, 106, 247, 0.08), 0 8px 32px rgba(124, 106, 247, 0.04)',
      y: -1,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      borderColor: 'var(--border)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      y: 0,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  /* Audio Recording functions (STT Whisper) */
  const startRecording = async () => {
    try {
      if (!isVoiceOutputEnabled) {
        setIsVoiceOutputEnabled(true);
        localStorage.setItem('isVoiceOutputEnabled', 'true');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        }
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setUploadError('Microphone access denied or audio device not found.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsRecording(false);
    audioChunksRef.current = [];
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      const res = await fetch('/api/voice', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.text) {
        setInput(data.text);
        if (inputRef.current) {
          inputRef.current.focus();
        }
        // Auto-send transcription text
        handleSend(data.text);
      } else {
        setUploadError(data.error || 'Failed to transcribe audio.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setUploadError('Network error transcribing voice.');
    } finally {
      setIsTranscribing(false);
    }
  };

  /* Audio Speak functions (TTS OpenAI / SpeechSynthesis) */
  const cleanMarkdownForSpeak = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/### (.*?)\n/g, '$1. ')
      .replace(/## (.*?)\n/g, '$1. ')
      .replace(/> (.*?)\n/g, '$1. ')
      .replace(/[-*]\s/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .trim();
  };

  const fallbackBrowserSpeak = (content: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const cleaned = cleanMarkdownForSpeak(content);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    
    utterance.onend = () => setCurrentlySpeakingId(null);
    utterance.onerror = () => setCurrentlySpeakingId(null);

    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));
    if (indianVoice) utterance.voice = indianVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const fallbackBrowserSpeakChunk = (msgId: string, sentence: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      processSpeechQueue(msgId);
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const cleaned = cleanMarkdownForSpeak(sentence);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    
    utterance.onend = () => {
      processSpeechQueue(msgId);
    };
    utterance.onerror = () => {
      processSpeechQueue(msgId);
    };
    
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));
    if (indianVoice) utterance.voice = indianVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const enqueueSentence = (msgId: string, sentence: string) => {
    speechQueueRef.current.push(sentence);
    if (!isSpeakingQueueActiveRef.current) {
      processSpeechQueue(msgId);
    }
  };

  const processSpeechQueue = async (msgId: string) => {
    if (speechQueueRef.current.length === 0) {
      isSpeakingQueueActiveRef.current = false;
      setCurrentlySpeakingId(null);
      return;
    }
    
    isSpeakingQueueActiveRef.current = true;
    setCurrentlySpeakingId(msgId);
    
    const nextSentence = speechQueueRef.current.shift()!;
    
    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanMarkdownForSpeak(nextSentence), voice: 'alloy' })
      });
      
      if (!response.ok) throw new Error('OpenAI TTS synthesis failed');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        audioElementRef.current = null;
        processSpeechQueue(msgId);
      };
      
      audio.onerror = () => {
        audioElementRef.current = null;
        console.warn('Playback error on queue chunk, trying fallback');
        fallbackBrowserSpeakChunk(msgId, nextSentence);
      };
      
      await audio.play();
    } catch (err) {
      console.warn('OpenAI TTS failed on chunk, using browser SpeechSynthesis fallback:', err);
      fallbackBrowserSpeakChunk(msgId, nextSentence);
    }
  };

  const enqueueNewSentences = (msgId: string, fullText: string) => {
    const textSegment = fullText.substring(spokenTextLengthRef.current);
    
    let searchPos = 0;
    const regex = /([.?!](?:\s+|$))|(\n+)/g;
    let match;
    
    while ((match = regex.exec(textSegment)) !== null) {
      const matchEnd = regex.lastIndex;
      const sentenceContent = textSegment.substring(searchPos, matchEnd).trim();
      
      const words = sentenceContent.replace(/[.?!]$/, '').trim().split(/\s+/);
      const lastWord = words[words.length - 1]?.toLowerCase() || '';
      const isAbbr = /^(sec|art|eg|ie|vs|dr|mr|mrs|bns|ipc|crpc|bsa|no)$/.test(lastWord);
      
      if (isAbbr) {
        continue;
      }
      
      if (sentenceContent) {
        enqueueSentence(msgId, sentenceContent);
      }
      
      spokenTextLengthRef.current += matchEnd - searchPos;
      searchPos = matchEnd;
      regex.lastIndex = searchPos;
    }
  };

  const handleSpeakResponse = async (msgId: string, content: string) => {
    if (currentlySpeakingId === msgId) {
      stopSpeaking();
      return;
    }
    stopSpeaking();
    
    isVoiceOutputCancelledRef.current = false;
    setCurrentlySpeakingId(msgId);
    spokenTextLengthRef.current = 0;
    speechQueueRef.current = [];
    
    enqueueNewSentences(msgId, content);
    
    if (spokenTextLengthRef.current < content.length) {
      const remaining = content.substring(spokenTextLengthRef.current).trim();
      if (remaining) {
        enqueueSentence(msgId, remaining);
      }
    }
  };

  const stopSpeaking = () => {
    isVoiceOutputCancelledRef.current = true;
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = [];
    isSpeakingQueueActiveRef.current = false;
    setCurrentlySpeakingId(null);
  };

  // Clean speaker audio on unmount
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
    if (typeof window !== 'undefined') {
      const trialStart = localStorage.getItem('nyayasetu_guest_trial_start');
      if (trialStart) {
        const elapsed = Date.now() - Number(trialStart);
        if (elapsed >= 10 * 60 * 1000) {
          localStorage.removeItem('nyayasetu_guest_trial_start');
          setUser(null);
          window.location.href = '/?trialExpired=true';
          return;
        }
      }
    }

    if ((!text.trim() && !pendingFile) || isLoadingResponse) return;

    let currentChatId = activeChatId;

    // Automatically create a new chat session if none is active
    if (!currentChatId) {
      setLoadingResponse(true);
      try {
        const titleText = text.trim() ? (text.trim().substring(0, 30) + (text.trim().length > 30 ? '...' : '')) : `Legal Query ${chats.length + 1}`;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', title: titleText }),
        });
        const data = await res.json();
        if (data.chat) {
          addChat(data.chat);
          setActiveChatId(data.chat.id);
          currentChatId = data.chat.id;
          setMessages([]);
        } else {
          setLoadingResponse(false);
          return;
        }
      } catch (err) {
        console.error('Failed to create automatic chat:', err);
        setLoadingResponse(false);
        return;
      }
    }

    if (!currentChatId) return;

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
      chatId: currentChatId, 
      role: 'user', 
      content: finalMsgText, 
      timestamp: new Date().toISOString(),
      documentName: docName,
      documentType: docType
    };
    addMessage(userMsg);

    const aiId = Math.random().toString();
    addMessage({ id: aiId, chatId: currentChatId, role: 'assistant', content: '', timestamp: new Date().toISOString() });

    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          action: 'send', 
          chatId: currentChatId, 
          message: finalMsgText,
          documentName: docName,
          documentType: docType
        }) 
      });
      if (!res.body) throw new Error('No stream');

      // Re-fetch chat list asynchronously if it is the first message to update the sidebar title
      if (isFirstMsg || messages.length === 0) {
        fetch('/api/chat')
          .then(r => r.json())
          .then(data => {
            if (data.chats) setChats(data.chats);
          })
          .catch(() => {});
      }

      isVoiceOutputCancelledRef.current = false;
      spokenTextLengthRef.current = 0;
      speechQueueRef.current = [];

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false, acc = '';
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        acc += decoder.decode(value, { stream: !done });
        useStore.setState(s => ({ messages: s.messages.map(m => m.id === aiId ? { ...m, content: acc } : m) }));
        
        if (isVoiceOutputEnabled && !isVoiceOutputCancelledRef.current) {
          enqueueNewSentences(aiId, acc);
        }
      }
      const final = await fetch(`/api/chat?chatId=${currentChatId}`);
      const data  = await final.json();
      if (data.messages) {
        setMessages(data.messages);
        
        if (isVoiceOutputEnabled && !isVoiceOutputCancelledRef.current && spokenTextLengthRef.current < acc.length) {
          const remaining = acc.substring(spokenTextLengthRef.current).trim();
          if (remaining) {
            enqueueSentence(aiId, remaining);
          }
        }
      }
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
    <div className="hero-mesh noise" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {/* Shadcn UI dot-grid background layer with mask */}
      <div className="dot-grid" style={{ 
        position: 'absolute', 
        inset: 0, 
        pointerEvents: 'none', 
        opacity: 0.5, 
        zIndex: 0,
        WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
        maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)'
      } as React.CSSProperties} />

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
      <div ref={messageContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 0', position: 'relative', zIndex: 1 }}>
        {!activeChatId ? (
          /* ── Welcome screen ── */
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', maxWidth: 680, margin: '0 auto', gap: 32 }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, perspective: 1000 }}>
              <div className="welcome-logo" style={{ width: 60, height: 60, borderRadius: 20, background: 'linear-gradient(135deg,#7c6af7,#5b50d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 12px 32px rgba(124,106,247,0.4)' }}>⚖️</div>
              
              <h1 className="welcome-title" style={{ fontSize: 'clamp(1.4rem,3vw,2.1rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: 0, lineHeight: 1.2, color: 'var(--foreground)' }}>
                {"How can I assist your".split(" ").map((w, i) => (
                  <span key={i} className="welcome-word" style={{ display: 'inline-block', marginRight: '8px' }}>{w}</span>
                ))}
                <br />
                <span className="welcome-word" style={{ 
                  display: 'inline-block',
                  background: 'linear-gradient(135deg,#a78bfa,#7c6af7,#f0a500)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent', 
                  backgroundClip: 'text',
                  marginTop: '4px'
                }}>
                  legal inquiry?
                </span>
              </h1>
              
              <p className="welcome-desc" style={{ fontSize: 14, color: 'var(--muted-foreground)', maxWidth: 400, lineHeight: 1.7, margin: 0 }}>
                Ask about Indian laws, upload legal documents, or explore rights under BNS, BNSS, Constitution, and more.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
              {STARTERS.map((p, i) => (
                <button key={i} onClick={() => handleSend(p.text)} className="welcome-starter"
                  onMouseEnter={handleStarterMouseEnter}
                  onMouseLeave={handleStarterMouseLeave}
                  style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 90 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="starter-icon" style={{ fontSize: 16, display: 'inline-block' }}>{p.icon}</span>
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
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, idx) => {
              const isAi = msg.role === 'assistant';
              const isTyping = !msg.content && isAi && isLoadingResponse && idx === messages.length - 1;

              return (
                <div key={msg.id} className={`msg-item ${isAi ? 'ai-msg' : 'user-msg'}`} style={{ 
                  display: 'flex', 
                  gap: 14, 
                  padding: '8px 0',
                  width: '100%',
                  justifyContent: isAi ? 'flex-start' : 'flex-end',
                }}>

                  {/* Avatar (AI on Left) */}
                  {isAi && (
                    <div className="msg-avatar" style={{ flexShrink: 0, marginTop: 2 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg,#7c6af7,#5b50d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 4px 12px rgba(124,106,247,0.35)' }}>⚖️</div>
                    </div>
                  )}

                  {/* Message body */}
                  <div className="msg-body" style={{ 
                    maxWidth: '85%', 
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAi ? 'flex-start' : 'flex-end'
                  }}>
                    {/* Name + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{isAi ? 'NyayaSetu' : 'You'}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Message bubble card */}
                    <div style={{
                      width: '100%',
                      background: isAi 
                        ? (theme === 'dark' ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.85)')
                        : (theme === 'dark' ? 'rgba(124,106,247,0.08)' : 'rgba(124,106,247,0.04)'),
                      border: isAi
                        ? '1px solid var(--border)'
                        : '1px solid rgba(124,106,247,0.25)',
                      borderRadius: isAi ? '0 16px 16px 16px' : '16px 0 16px 16px',
                      padding: isAi ? '16px 20px' : '12px 16px',
                      boxShadow: isAi ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
                      backdropFilter: isAi ? 'blur(8px)' : 'none',
                    }}>
                      {isTyping ? (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '6px 0' }}>
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
                    </div>

                    {/* Action row for AI */}
                    {isAi && msg.content && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 6, flexWrap: 'wrap' }}>
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
                        
                        {/* Audio TTS Speak button */}
                        <button style={iconBtn(currentlySpeakingId === msg.id)} onClick={() => handleSpeakResponse(msg.id, msg.content)}
                          onMouseEnter={e => (e.currentTarget.style.color = currentlySpeakingId === msg.id ? '#ef4444' : 'var(--foreground)')}
                          onMouseLeave={e => (e.currentTarget.style.color = currentlySpeakingId === msg.id ? '#a78bfa' : 'var(--muted-foreground)')}>
                          {currentlySpeakingId === msg.id ? (
                            <><VolumeX size={13} className="speak-pulse" /> Stop Listening</>
                          ) : (
                            <><Volume2 size={13} /> Listen</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Follow-ups */}
                    {isAi && msg.content && idx === messages.length - 1 && !isLoadingResponse && (
                      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {getFollowUps(msg.content).map((q, qi) => (
                          <button key={qi} onClick={() => handleSend(q)}
                            className="followup-btn"
                            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 9999, background: 'rgba(124,106,247,0.07)', border: '1px solid rgba(124,106,247,0.18)', color: '#a78bfa', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.16)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.07)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.18)'; }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Avatar (User on Right) */}
                  {!isAi && (
                    <div className="msg-avatar" style={{ flexShrink: 0, marginTop: 2 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>
                        {useStore.getState().user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)' 
          }}
            onFocusCapture={handleInputFocus}
            onBlurCapture={handleInputBlur}>

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
                disabled={isUploading}
              />

              {/* Upload attachment button */}
              <button
                type="button"
                disabled={isUploading}
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

              {/* Voice input button */}
              <button
                type="button"
                disabled={isTranscribing}
                onClick={isRecording ? stopRecording : startRecording}
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
                  background: isRecording ? '#ef4444' : 'transparent',
                  color: isRecording ? '#ffffff' : 'var(--muted-foreground)',
                  transition: 'all 0.2s',
                  marginBottom: 1,
                }}
                onMouseEnter={e => { 
                  if (!isRecording) {
                    e.currentTarget.style.background = 'var(--secondary)'; 
                    e.currentTarget.style.color = 'var(--foreground)'; 
                  }
                }}
                onMouseLeave={e => { 
                  if (!isRecording) {
                    e.currentTarget.style.background = 'transparent'; 
                    e.currentTarget.style.color = 'var(--muted-foreground)'; 
                  }
                }}
                title={isRecording ? "Stop recording" : "Record voice query"}>
                {isTranscribing ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#a78bfa' }} />
                ) : isRecording ? (
                  <Square size={14} style={{ fill: '#ffffff' }} />
                ) : (
                  <Mic size={16} />
                )}
              </button>

              {/* Voice output (read aloud) toggle button */}
              <button
                type="button"
                onClick={toggleVoiceOutput}
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
                  background: isVoiceOutputEnabled ? 'rgba(124,106,247,0.12)' : 'transparent',
                  color: isVoiceOutputEnabled ? '#a78bfa' : 'var(--muted-foreground)',
                  transition: 'all 0.2s',
                  marginBottom: 1,
                  boxShadow: isVoiceOutputEnabled ? '0 0 10px rgba(124,106,247,0.15)' : 'none',
                }}
                onMouseEnter={e => { 
                  if (!isVoiceOutputEnabled) {
                    e.currentTarget.style.background = 'var(--secondary)'; 
                    e.currentTarget.style.color = 'var(--foreground)'; 
                  } else {
                    e.currentTarget.style.background = 'rgba(124,106,247,0.2)'; 
                  }
                }}
                onMouseLeave={e => { 
                  if (!isVoiceOutputEnabled) {
                    e.currentTarget.style.background = 'transparent'; 
                    e.currentTarget.style.color = 'var(--muted-foreground)'; 
                  } else {
                    e.currentTarget.style.background = 'rgba(124,106,247,0.12)'; 
                  }
                }}
                title={isVoiceOutputEnabled ? "Mute voice responses" : "Read responses aloud"}>
                {isVoiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {isRecording ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 6, height: 32 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-red 1.5s infinite' }} />
                    Recording audio...
                  </span>
                  
                  {/* Wave Visualizer bars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 24 }}>
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                    <div className="voice-wave-bar" />
                  </div>

                  <button 
                    type="button" 
                    onClick={cancelRecording}
                    style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--muted-foreground)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={isTranscribing ? "Transcribing voice to text..." : input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
                  placeholder="Ask a legal question…"
                  disabled={isLoadingResponse || isTranscribing}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: '0.9em', color: 'var(--foreground)', lineHeight: 1.6, maxHeight: 200, fontFamily: 'var(--font-sans)', padding: 0, paddingBottom: 6 }}
                />
              )}

              {/* Send / Stop button */}
              <button
                type="submit"
                disabled={(!input.trim() && !pendingFile && !isLoadingResponse) || isTranscribing}
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
        @keyframes pulse-red { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes wave-pulse { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1.3); } }
        @keyframes speak-active { 0%, 100% { opacity: 0.7; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1.06); color: #ef4444; } }
        .voice-wave-bar {
          width: 3px;
          height: 16px;
          background-color: #a78bfa;
          border-radius: 9999px;
          animation: wave-pulse 0.8s ease-in-out infinite;
        }
        .voice-wave-bar:nth-child(1) { animation-delay: 0.1s; height: 10px; }
        .voice-wave-bar:nth-child(2) { animation-delay: 0.3s; height: 14px; }
        .voice-wave-bar:nth-child(3) { animation-delay: 0.5s; height: 18px; }
        .voice-wave-bar:nth-child(4) { animation-delay: 0.2s; height: 12px; }
        .voice-wave-bar:nth-child(5) { animation-delay: 0.4s; height: 16px; }
        .voice-wave-bar:nth-child(6) { animation-delay: 0.1s; height: 11px; }
        .voice-wave-bar:nth-child(7) { animation-delay: 0.3s; height: 7px; }
        .speak-pulse {
          animation: speak-active 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
