import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Terminal, Hash, Plus, Users, Zap, Bot,
  LogOut, Search, X, Check, Copy, Menu,
  Code2, Send, Sparkles, Loader,
  Lock, Globe, AlertCircle, Mail, ChevronLeft,
  RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// API Keys
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API helper
// ─────────────────────────────────────────────────────────────────────────────
async function askGemini(messageHistory, latestMessage) {
  const context = messageHistory
    .slice(-30)
    .map(m => {
      if (m.isAI) return `${m.aiModel || 'AI'}: ${m.text}`;
      const label = m.isCode ? `${m.sender.name} [CODE SNIPPET]` : m.sender.name;
      return `${label}: ${m.text}`;
    })
    .join('\n');

  const prompt = `You are Gemini AI, a helpful assistant inside DevRoomsAI — a real-time developer collaboration chat platform.
You help developers debug code, explain errors, suggest improvements, and answer questions about the ongoing conversation.
Keep responses concise and developer-friendly. Use plain text (no markdown headers, no asterisks for bold).
You have full awareness of the conversation history below and can reference it when answering questions.

=== Full Conversation History ===
${context || '(No messages yet)'}
=================================

Latest message asking for your help: ${latestMessage}

Respond helpfully as Gemini AI:`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatGPT API helper
// ─────────────────────────────────────────────────────────────────────────────
async function askChatGPT(messageHistory, latestMessage) {
  if (!OPENAI_API_KEY) throw new Error('VITE_OPENAI_API_KEY not set in .env');

  const context = messageHistory
    .slice(-30)
    .map(m => {
      if (m.isAI) return `${m.aiModel || 'AI'}: ${m.text}`;
      const label = m.isCode ? `${m.sender.name} [CODE SNIPPET]` : m.sender.name;
      return `${label}: ${m.text}`;
    })
    .join('\n');

  const systemPrompt = `You are ChatGPT, a helpful assistant inside DevRoomsAI — a real-time developer collaboration chat platform.
You help developers debug code, explain errors, suggest improvements, and answer questions.
Keep responses concise and developer-friendly. Use plain text (no markdown headers, no asterisks for bold).
You have full awareness of the conversation history below.

=== Full Conversation History ===
${context || '(No messages yet)'}
=================================`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: latestMessage },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`ChatGPT API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────
const LS_ROOMS_KEY    = 'devrooms_rooms';
const LS_UNLOCKED_KEY = 'devrooms_unlocked';
const LS_ACTIVE_KEY   = 'devrooms_active_room_id';
const LS_MSGS_PREFIX  = 'devrooms_msgs_';

function loadRooms()                    { try { return JSON.parse(localStorage.getItem(LS_ROOMS_KEY)    || '[]'); } catch { return []; } }
function saveRooms(r)                   { localStorage.setItem(LS_ROOMS_KEY, JSON.stringify(r)); }
function loadUnlocked()                 { try { return JSON.parse(localStorage.getItem(LS_UNLOCKED_KEY) || '[]'); } catch { return []; } }
function saveUnlocked(u)                { localStorage.setItem(LS_UNLOCKED_KEY, JSON.stringify(u)); }
function loadMessages(roomId)           { try { return JSON.parse(localStorage.getItem(LS_MSGS_PREFIX + roomId) || '[]'); } catch { return []; } }
function saveMessages(roomId, msgs)     { localStorage.setItem(LS_MSGS_PREFIX + roomId, JSON.stringify(msgs)); }
function loadActiveRoomId()             { return localStorage.getItem(LS_ACTIVE_KEY) || null; }
function saveActiveRoomId(id)           { if (id) localStorage.setItem(LS_ACTIVE_KEY, id); else localStorage.removeItem(LS_ACTIVE_KEY); }

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp-style SVG doodle background for chat area
// ─────────────────────────────────────────────────────────────────────────────
function ChatDoodleBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.045]" style={{ zIndex: 0 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="doodle" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* Chat bubble */}
            <path d="M10 8 Q10 4 14 4 L34 4 Q38 4 38 8 L38 18 Q38 22 34 22 L20 22 L14 28 L16 22 L14 22 Q10 22 10 18 Z" fill="none" stroke="#eab308" strokeWidth="1.2"/>
            {/* Code brackets */}
            <text x="52" y="20" fontFamily="monospace" fontSize="16" fill="#eab308">{'</>'}</text>
            {/* Terminal prompt */}
            <text x="8" y="50" fontFamily="monospace" fontSize="11" fill="#eab308">{'$ _'}</text>
            {/* Dots / typing indicator */}
            <circle cx="60" cy="45" r="2.5" fill="#eab308"/>
            <circle cx="68" cy="45" r="2.5" fill="#eab308"/>
            <circle cx="76" cy="45" r="2.5" fill="#eab308"/>
            {/* Small chat bubble right */}
            <path d="M82 8 Q82 4 86 4 L108 4 Q112 4 112 8 L112 18 Q112 22 108 22 L100 22 L106 28 L104 22 Q82 22 82 18 Z" fill="none" stroke="#eab308" strokeWidth="1.2"/>
            {/* Lock icon */}
            <rect x="10" y="72" width="14" height="12" rx="2" fill="none" stroke="#eab308" strokeWidth="1.2"/>
            <path d="M13 72 Q13 66 17 66 Q21 66 21 72" fill="none" stroke="#eab308" strokeWidth="1.2"/>
            {/* Wifi / signal bars */}
            <rect x="52" y="78" width="3" height="6" rx="1" fill="#eab308"/>
            <rect x="57" y="74" width="3" height="10" rx="1" fill="#eab308"/>
            <rect x="62" y="70" width="3" height="14" rx="1" fill="#eab308"/>
            {/* Star / sparkle */}
            <path d="M95 65 L97 71 L103 71 L98 75 L100 81 L95 77 L90 81 L92 75 L87 71 L93 71 Z" fill="none" stroke="#eab308" strokeWidth="1.1"/>
            {/* Hash */}
            <text x="8" y="105" fontFamily="monospace" fontSize="18" fill="#eab308" fontWeight="bold">#</text>
            {/* At sign */}
            <text x="38" y="105" fontFamily="monospace" fontSize="15" fill="#eab308">@</text>
            {/* Send arrow */}
            <path d="M60 95 L80 100 L60 105 L65 100 Z" fill="none" stroke="#eab308" strokeWidth="1.2"/>
            {/* Semicolon (code vibe) */}
            <text x="90" y="105" fontFamily="monospace" fontSize="14" fill="#eab308">;</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#doodle)"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Background FX
// ─────────────────────────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    const COUNT = 50;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.3,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(234,179,8,0.35)'; ctx.fill();
      });
      for (let i = 0; i < COUNT; i++) for (let j = i + 1; j < COUNT; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(234,179,8,${0.09 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

function ShootingStars() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    const MAX = 4; const stars = [];
    function spawn() {
      const angle = Math.random() * Math.PI * 0.25 + Math.PI * 0.1;
      const speed = Math.random() * 9 + 7;
      stars.push({ x: Math.random() * W * 1.2 - W * 0.1, y: Math.random() * H * 0.5, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, alpha: 1, width: Math.random() * 1.5 + 0.5, tail: [] });
    }
    let raf; let tick = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H); tick++;
      if (tick % 60 === 0 && stars.length < MAX) spawn();
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.tail.unshift({ x: s.x, y: s.y });
        if (s.tail.length > 18) s.tail.pop();
        s.x += s.vx; s.y += s.vy; s.alpha -= 0.013;
        if (s.alpha <= 0 || s.x > W + 200 || s.y > H + 200) { stars.splice(i, 1); continue; }
        const grad = ctx.createLinearGradient(s.tail[s.tail.length-1]?.x??s.x, s.tail[s.tail.length-1]?.y??s.y, s.x, s.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.4, `rgba(234,179,8,${s.alpha*0.3})`);
        grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);
        ctx.beginPath(); ctx.moveTo(s.tail[s.tail.length-1]?.x??s.x, s.tail[s.tail.length-1]?.y??s.y);
        s.tail.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = grad; ctx.lineWidth = s.width; ctx.lineCap = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.arc(s.x, s.y, s.width*1.4, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,220,${s.alpha})`; ctx.fill();
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 12);
        glow.addColorStop(0, `rgba(234,179,8,${s.alpha*0.4})`); glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(s.x, s.y, 12, 0, Math.PI*2); ctx.fillStyle = glow; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

function NoiseOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[2] opacity-[0.025]"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px' }} />
  );
}

function CursorGlow() {
  const cx = useMotionValue(-200); const cy = useMotionValue(-200);
  const sx = useSpring(cx, { stiffness: 80, damping: 18 });
  const sy = useSpring(cy, { stiffness: 80, damping: 18 });
  useEffect(() => {
    const move = (e) => { cx.set(e.clientX); cy.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [cx, cy]);
  return (
    <motion.div className="fixed pointer-events-none z-[3] w-[400px] h-[400px] rounded-full hidden md:block"
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%', background: 'radial-gradient(circle, rgba(234,179,8,0.06) 0%, transparent 70%)' }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ letter, size = 'md', online, isGPT }) {
  const gradients = [
    'from-yellow-500 to-orange-500', 'from-blue-500 to-cyan-500',
    'from-pink-500 to-purple-500',   'from-green-500 to-emerald-500',
    'from-red-500 to-rose-500',      'from-indigo-500 to-violet-500',
  ];
  const gradient = letter === '✦'
    ? 'from-yellow-400 to-yellow-600'
    : isGPT
    ? 'from-emerald-400 to-teal-600'
    : gradients[(letter?.charCodeAt(0) || 0) % gradients.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-11 h-11 text-lg' : 'w-9 h-9 text-base';
  return (
    <div className={`relative flex-shrink-0 ${sz}`}>
      <div className={`w-full h-full rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-black`}>{letter}</div>
      {online !== undefined && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0d10] ${online === 'online' ? 'bg-green-500' : online === 'idle' ? 'bg-yellow-500' : 'bg-slate-600'}`} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CodeBlock
// ─────────────────────────────────────────────────────────────────────────────
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/70 text-sm font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-yellow-500/70 uppercase tracking-widest text-xs font-bold">{lang || 'code'}</span>
        <motion.button onClick={copy} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-slate-400 hover:text-yellow-500 transition-colors">
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </motion.button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed whitespace-pre-wrap break-words text-sm">{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageBubble — with "Ask ChatGPT instead" button on AI messages
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, onAskChatGPT, canAskChatGPT }) {
  const [expanded, setExpanded] = useState(true);
  const isGemini = msg.isAI && msg.aiModel === 'gemini';
  const isGPT    = msg.isAI && msg.aiModel === 'chatgpt';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 mb-5 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      <div className="flex-shrink-0 mt-1">
        {msg.isAI
          ? <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
              <Avatar letter={isGPT ? '⬡' : '✦'} isGPT={isGPT} />
            </motion.div>
          : <Avatar letter={msg.sender.avatar} />}
      </div>

      <div className={`max-w-[78%] sm:max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`flex items-center gap-2 mb-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className={`text-sm font-bold ${isGPT ? 'text-emerald-400' : msg.isAI ? 'text-yellow-500' : 'text-slate-200'}`}>
            {isGPT ? '⬡ ChatGPT' : isGemini ? '✦ Gemini AI' : msg.sender.name}
          </span>
          <span className="text-xs text-slate-600">{msg.time}</span>
        </div>

        <div className={`rounded-2xl px-4 py-3 text-base leading-relaxed relative ${
          isGPT
            ? 'bg-emerald-500/10 border border-emerald-500/25 text-slate-100'
            : isGemini
            ? 'bg-yellow-500/10 border border-yellow-500/25 text-slate-100'
            : isOwn
            ? 'bg-yellow-500 text-black font-medium rounded-tr-sm'
            : 'bg-white/10 border border-white/15 text-slate-100 rounded-tl-sm'
        }`}>
          {isGemini && (
            <motion.div className="absolute -left-1 -top-1 w-2 h-2 bg-yellow-500 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          )}
          {isGPT && (
            <motion.div className="absolute -left-1 -top-1 w-2 h-2 bg-emerald-500 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          )}

          {msg.isCode ? <CodeBlock code={msg.text} lang={msg.lang} /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
        </div>

        {/* Ask ChatGPT instead — shown only on Gemini responses */}
        {isGemini && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-2 flex items-center gap-2">
            {canAskChatGPT ? (
              <motion.button
                onClick={() => onAskChatGPT(msg)}
                whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(52,211,153,0.2)' }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-lg transition-all uppercase tracking-wider"
              >
                <RefreshCw size={11} />
                Ask ChatGPT instead
              </motion.button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/3 border border-white/8 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider cursor-default select-none" title="Add VITE_OPENAI_API_KEY to .env to enable ChatGPT">
                <RefreshCw size={11} />
                ChatGPT unavailable · add API key
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal shell + header
// ─────────────────────────────────────────────────────────────────────────────
function ModalShell({ onClose, children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 24 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#0d0d10] border border-white/10 rounded-[2rem] p-6 sm:p-8 relative shadow-[0_0_100px_rgba(0,0,0,0.95)]"
        onClick={e => e.stopPropagation()}>
        {['top-3 left-3 border-t-2 border-l-2','top-3 right-3 border-t-2 border-r-2','bottom-3 left-3 border-b-2 border-l-2','bottom-3 right-3 border-b-2 border-r-2'].map((cls, i) => (
          <motion.div key={i} className={`absolute w-4 h-4 border-yellow-500/40 ${cls}`}
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} />
        ))}
        <div className="absolute inset-0 rounded-[2rem] bg-yellow-500/2 blur-xl pointer-events-none" />
        <div className="relative">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function ModalHeader({ title, accent, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h3 className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          {title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{accent}</span>
        </h3>
        <p className="text-slate-500 text-sm tracking-widest uppercase mt-1">{subtitle}</p>
      </div>
      <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
        className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-slate-400">
        <X size={15} />
      </motion.button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Join Public Room Modal
// ─────────────────────────────────────────────────────────────────────────────
function JoinPublicRoomModal({ room, onClose, onJoin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    if (!isValidEmail(email.trim())) { setError('Enter a valid email address'); return; }
    setLoading(true);
    setTimeout(() => { onJoin(room, email.trim()); onClose(); }, 700);
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="JOIN" accent="ROOM" subtitle={`Public · #${room.name}`} onClose={onClose} />
      <div className="text-center mb-6">
        <motion.div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          <Globe size={26} className="text-green-400" />
        </motion.div>
        <p className="text-slate-400 text-sm leading-relaxed">
          <span className="text-white font-bold">#{room.name}</span> is open to everyone.<br />
          Just enter your email to join.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2 block">Your Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="dev@example.com" autoFocus
              style={{ colorScheme: 'dark' }}
              className={`w-full bg-black/60 border rounded-xl py-3.5 pl-10 pr-4 text-base focus:outline-none transition-all text-white placeholder:text-slate-600 ${error ? 'border-red-500/60' : 'border-white/10 focus:border-yellow-500/50'}`} />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-sm mt-2 flex items-center gap-1.5">
                <AlertCircle size={13} /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <motion.button type="submit" disabled={loading}
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(234,179,8,0.25)' }} whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {loading ? <><Loader size={15} className="animate-spin" /> Joining...</> : <><Zap size={15} /> Enter Room</>}
        </motion.button>
        <p className="text-xs text-slate-600 text-center">Your email is only used to identify you in the room.</p>
      </form>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Room Modal
// ─────────────────────────────────────────────────────────────────────────────
function generateInviteCode() {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${seg()}-${seg()}-${seg()}`;
}

function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const inviteCode = isPrivate ? generateInviteCode() : null;
    setTimeout(() => {
      onCreate({ name: name.toLowerCase().replace(/\s+/g, '-'), description: desc, isPrivate, inviteCode });
      setLoading(false); onClose();
    }, 700);
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="CREATE" accent="ROOM" subtitle="New Developer Space" onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2 block">Room Name</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/60 text-base font-bold">#</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="react-debugging"
              style={{ colorScheme: 'dark' }}
              className="w-full bg-black/60 border border-white/10 focus:border-yellow-500/50 rounded-xl py-3.5 pl-8 pr-4 text-base text-white placeholder:text-slate-600 focus:outline-none transition-all" required />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2 block">Description <span className="text-slate-600">(optional)</span></label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What will this room be used for?" rows={2}
            style={{ colorScheme: 'dark' }}
            className="w-full bg-black/60 border border-white/10 focus:border-yellow-500/50 rounded-xl py-3 px-4 text-base text-white placeholder:text-slate-600 focus:outline-none transition-all resize-none" />
        </div>
        <div className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${isPrivate ? 'bg-yellow-500/15 text-yellow-500' : 'bg-white/5 text-slate-500'}`}>
              {isPrivate ? <Lock size={16} /> : <Globe size={16} />}
            </div>
            <div>
              <p className="text-base font-bold text-slate-200">{isPrivate ? 'Private Room' : 'Public Room'}</p>
              <p className="text-xs text-slate-500">{isPrivate ? 'Entry via invite code only' : 'Anyone with email can join'}</p>
            </div>
          </div>
          <motion.button type="button" onClick={() => setIsPrivate(!isPrivate)}
            className={`w-11 h-6 rounded-full relative transition-colors ${isPrivate ? 'bg-yellow-500' : 'bg-white/10'}`} whileTap={{ scale: 0.95 }}>
            <motion.div className="w-4 h-4 bg-white rounded-full absolute top-1"
              animate={{ x: isPrivate ? 24 : 4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} />
          </motion.button>
        </div>
        <AnimatePresence>
          {isPrivate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex items-start gap-3 p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles size={15} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                </motion.div>
                <p className="text-sm text-yellow-200/70 leading-relaxed">
                  A unique <span className="text-yellow-400 font-bold">invite code</span> will be generated. Share it with developers — no code, no entry.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button type="submit" disabled={loading || !name.trim()}
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(234,179,8,0.3)' }} whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {loading ? <><Loader size={15} className="animate-spin" /> Initializing...</> : <><Zap size={15} /> Launch Room</>}
        </motion.button>
      </form>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Invite Code Modal
// ─────────────────────────────────────────────────────────────────────────────
function InviteCodeModal({ room, onClose }) {
  const [copied, setCopied] = useState(false);
  const copyCode = () => { navigator.clipboard.writeText(room.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="INVITE" accent="CODE" subtitle={`Private room · #${room.name}`} onClose={onClose} />
      <div className="text-center">
        <motion.div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6"
          animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          <Lock size={30} className="text-yellow-500" />
        </motion.div>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Share this code with developers you want in <span className="text-yellow-400 font-bold">#{room.name}</span>.<br />
          Anyone without it will be denied entry.
        </p>
        <motion.div className="relative bg-black/60 border border-yellow-500/30 rounded-2xl p-6 mb-4 cursor-pointer group"
          whileHover={{ borderColor: 'rgba(234,179,8,0.6)' }} onClick={copyCode}>
          <motion.div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"
            animate={{ top: ['20%', '80%', '20%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <p className="text-3xl font-black tracking-[0.3em] text-yellow-400 font-mono">{room.inviteCode}</p>
          <p className="text-xs text-slate-600 mt-2 uppercase tracking-widest">Click to copy</p>
        </motion.div>
        <motion.button onClick={copyCode} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest transition-all ${copied ? 'bg-green-500/15 border border-green-500/30 text-green-400' : 'bg-yellow-500 text-black'}`}>
          {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Invite Code</>}
        </motion.button>
        <div className="flex items-center gap-2 mt-4 p-3 bg-white/3 border border-white/8 rounded-xl">
          <AlertCircle size={13} className="text-slate-500 flex-shrink-0" />
          <p className="text-xs text-slate-500 text-left">Keep this code private. Anyone with it can join your room.</p>
        </div>
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Join Private Room Modal
// ─────────────────────────────────────────────────────────────────────────────
function JoinPrivateRoomModal({ room, onClose, onJoin }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleInput = (e) => {
    let val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
    if (val.length > 8) val = `${val.slice(0,4)}-${val.slice(4,8)}-${val.slice(8)}`;
    else if (val.length > 4) val = `${val.slice(0,4)}-${val.slice(4)}`;
    setCode(val); setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.replace(/-/g, '').length < 12) { setError('Code must be 12 characters'); return; }
    setLoading(true);
    setTimeout(() => {
      if (code === room.inviteCode) { onJoin(room); onClose(); }
      else {
        setLoading(false);
        setError('Invalid invite code. Access denied.');
        setShake(true); setTimeout(() => setShake(false), 600);
      }
    }, 800);
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="JOIN" accent="ROOM" subtitle={`Private · #${room.name}`} onClose={onClose} />
      <div className="text-center mb-6">
        <motion.div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <Lock size={26} className="text-red-400" />
        </motion.div>
        <p className="text-slate-400 text-sm leading-relaxed">
          <span className="text-white font-bold">#{room.name}</span> is a private room.<br />
          Enter the invite code shared by the room owner.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2 block">Invite Code</label>
          <motion.div animate={shake ? { x: [-8,8,-6,6,-4,4,0] } : {}} transition={{ duration: 0.5 }}>
            <input value={code} onChange={handleInput} placeholder="XXXX-XXXX-XXXX" autoFocus
              style={{ colorScheme: 'dark' }}
              className={`w-full bg-black/60 border rounded-xl py-4 px-4 text-center text-xl font-black tracking-[0.3em] font-mono focus:outline-none transition-all text-white placeholder:text-slate-700 placeholder:text-base placeholder:tracking-widest ${error ? 'border-red-500/60 text-red-300' : 'border-white/10 focus:border-yellow-500/50'}`} />
          </motion.div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-sm mt-2 flex items-center gap-1.5 justify-center">
                <AlertCircle size={13} /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <motion.button type="submit" disabled={loading || code.replace(/-/g,'').length < 12}
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(234,179,8,0.25)' }} whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group">
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {loading ? <><Loader size={15} className="animate-spin" /> Verifying...</> : <><Zap size={15} /> Request Access</>}
        </motion.button>
      </form>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate = useNavigate();

  const storedUser    = JSON.parse(localStorage.getItem('devrooms_user') || '{}');
  const currentUser   = storedUser.username || 'You';
  const currentAvatar = (storedUser.username?.[0] || 'Y').toUpperCase();
  const isLoggedIn    = !!storedUser.username;

  const [rooms, setRooms]                     = useState(() => loadRooms());
  const [unlockedRooms, setUnlockedRooms]     = useState(() => loadUnlocked());

  useEffect(() => { saveRooms(rooms); }, [rooms]);
  useEffect(() => { saveUnlocked(unlockedRooms); }, [unlockedRooms]);

  const [activeRoom, setActiveRoom] = useState(() => {
    const savedId = loadActiveRoomId();
    const allRooms = loadRooms();
    return savedId ? allRooms.find(r => r._id === savedId) || null : null;
  });

  const [messages, setMessages] = useState(() => {
    const savedId = loadActiveRoomId();
    return savedId ? loadMessages(savedId) : [];
  });

  useEffect(() => { if (activeRoom) saveMessages(activeRoom._id, messages); }, [messages, activeRoom]);
  useEffect(() => { saveActiveRoomId(activeRoom?._id || null); }, [activeRoom]);

  const [input, setInput]                         = useState('');
  const [showCode, setShowCode]                   = useState(false);
  const [codeInput, setCodeInput]                 = useState('');
  const [showCreateModal, setShowCreateModal]     = useState(false);
  const [inviteCodeModal, setInviteCodeModal]     = useState(null);
  const [joinPrivateModal, setJoinPrivateModal]   = useState(null);
  const [joinPublicModal, setJoinPublicModal]     = useState(null);
  const [search, setSearch]                       = useState('');
  const [aiTyping, setAiTyping]                   = useState(false);
  const [aiTypingModel, setAiTypingModel]         = useState('gemini');
  const [showRightPanel, setShowRightPanel]       = useState(false);
  const [showSidebar, setShowSidebar]             = useState(false);
  const [geminiError, setGeminiError]             = useState('');
  const messagesEndRef = useRef(null);

  const canUseChatGPT = !!OPENAI_API_KEY;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setShowSidebar(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const filteredRooms = rooms.filter(r => r.name.includes(search.toLowerCase()));

  // ── Gemini trigger ──
  const triggerGemini = async (text, isCode, currentMessages) => {
    if (!GEMINI_API_KEY) { setGeminiError('VITE_GEMINI_API_KEY not set in .env'); return; }
    setAiTyping(true); setAiTypingModel('gemini'); setGeminiError('');
    try {
      const prompt = isCode
        ? `Please review this code snippet and give specific, concise feedback — bugs, improvements, best practices:\n\n${text}`
        : text;
      const reply = await askGemini(currentMessages, prompt);
      setMessages(prev => [...prev, {
        _id: `ai${Date.now()}`,
        sender: { name: 'GeminiAI', avatar: '✦' },
        text: reply, isAI: true, aiModel: 'gemini', isCode: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourcePrompt: text,
      }]);
    } catch (err) {
      setGeminiError('Gemini failed to respond. Check your API key or model availability.');
      console.error(err);
    } finally { setAiTyping(false); }
  };

  // ── ChatGPT trigger ──
  const triggerChatGPT = async (text, currentMessages) => {
    setAiTyping(true); setAiTypingModel('chatgpt'); setGeminiError('');
    try {
      const reply = await askChatGPT(currentMessages, text);
      setMessages(prev => [...prev, {
        _id: `gpt${Date.now()}`,
        sender: { name: 'ChatGPT', avatar: '⬡' },
        text: reply, isAI: true, aiModel: 'chatgpt', isCode: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      setGeminiError(err.message || 'ChatGPT failed to respond. Check your OpenAI API key.');
      console.error(err);
    } finally { setAiTyping(false); }
  };

  // ── "Ask ChatGPT instead" handler ──
  const handleAskChatGPT = (geminiMsg) => {
    if (!canUseChatGPT) return;
    const prompt = geminiMsg.sourcePrompt || geminiMsg.text;
    triggerChatGPT(prompt, messages);
  };

  // ── Send message ──
  const sendMessage = (e) => {
    e.preventDefault();
    const text = showCode ? codeInput : input;
    if (!text.trim()) return;

    const newMsg = {
      _id: `m${Date.now()}`,
      sender: { name: currentUser, avatar: currentAvatar },
      text: text.trim(), isAI: false, isCode: showCode, lang: 'javascript',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    if (text.toLowerCase().includes('@ai') || showCode) {
      triggerGemini(text.trim(), showCode, updatedMessages);
    }

    setInput(''); setCodeInput(''); setShowCode(false);
  };

  const enterRoom = (room) => {
    const saved = loadMessages(room._id);
    setActiveRoom(room);
    setMessages(saved);
    setShowSidebar(false);
  };

  const createRoom = (data) => {
    const newRoom = { _id: `r${Date.now()}`, ...data, members: 1, lastActivity: 'just now', unread: 0, isOwner: true };
    setRooms(prev => { const u = [newRoom, ...prev]; saveRooms(u); return u; });
    setUnlockedRooms(prev => { const u = [...prev, newRoom._id]; saveUnlocked(u); return u; });
    enterRoom(newRoom);
    if (data.isPrivate && data.inviteCode) setInviteCodeModal(newRoom);
  };

  const handleRoomClick = (room) => {
    if (unlockedRooms.includes(room._id)) { enterRoom(room); return; }
    if (room.isPrivate) {
      setJoinPrivateModal(room);
    } else {
      if (isLoggedIn) {
        setUnlockedRooms(prev => { const u = [...prev, room._id]; saveUnlocked(u); return u; });
        enterRoom(room);
      } else {
        setJoinPublicModal(room);
      }
    }
  };

  const handleJoinPublic  = (room) => { setUnlockedRooms(prev => { const u = [...prev, room._id]; saveUnlocked(u); return u; }); enterRoom(room); };
  const handleJoinPrivate = (room) => { setUnlockedRooms(prev => { const u = [...prev, room._id]; saveUnlocked(u); return u; }); enterRoom(room); };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="h-screen h-[100dvh] bg-[#07070a] text-white overflow-hidden flex flex-col" style={{ fontFamily: "'Space Mono', monospace" }}>

        <ParticleField />
        <ShootingStars />
        <NoiseOverlay />
        <CursorGlow />
        <div className="fixed inset-0 pointer-events-none z-0">
          <motion.div animate={{ scale: [1,1.3,1], opacity: [0.1,0.18,0.1] }} transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-yellow-500/20 blur-[160px] rounded-full" />
          <motion.div animate={{ scale: [1,1.2,1], opacity: [0.06,0.12,0.06] }} transition={{ duration: 13, repeat: Infinity, delay: 4 }}
            className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/15 blur-[140px] rounded-full" />
        </div>

        {/* ── TOP NAV ── */}
        <motion.header
          initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
          className="relative z-40 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/60 backdrop-blur-xl flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <motion.button onClick={() => setShowSidebar(s => !s)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="md:hidden p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 mr-1">
              <Menu size={16} />
            </motion.button>
            <motion.div className="bg-yellow-500 p-1.5 rounded-lg" animate={{ rotate: [0,5,-5,0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Terminal size={18} className="text-black" />
            </motion.div>
            <span className="text-lg sm:text-xl font-black tracking-tighter">DevRooms<span className="text-yellow-500">AI</span></span>
          </div>

          {activeRoom && (
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <motion.div animate={{ scale: [1,1.4,1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 bg-green-500 rounded-full" />
              <Hash size={14} className="text-yellow-500" />
              <span className="text-base font-bold text-slate-200">{activeRoom.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* AI status pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold ${GEMINI_API_KEY ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                <motion.div animate={GEMINI_API_KEY ? { scale: [1,1.3,1] } : {}} transition={{ duration: 2, repeat: Infinity }} className={`w-1.5 h-1.5 rounded-full ${GEMINI_API_KEY ? 'bg-yellow-500' : 'bg-slate-600'}`} />
                Gemini
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold ${canUseChatGPT ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                <motion.div animate={canUseChatGPT ? { scale: [1,1.3,1] } : {}} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className={`w-1.5 h-1.5 rounded-full ${canUseChatGPT ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                GPT
              </div>
            </div>
            <motion.button
              onClick={() => { localStorage.removeItem('devrooms_token'); localStorage.removeItem('devrooms_user'); navigate('/'); }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="p-2 bg-white/5 border border-white/10 hover:border-red-500/30 rounded-xl transition-colors text-slate-400 hover:text-red-400">
              <LogOut size={15} />
            </motion.button>
            <Avatar letter={currentAvatar} size="sm" online="online" />
          </div>
        </motion.header>

        {/* ── MAIN LAYOUT ── */}
        <div className="flex flex-1 overflow-hidden relative z-10">

          <AnimatePresence>
            {showSidebar && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-black/70 z-30 backdrop-blur-sm"
                onClick={() => setShowSidebar(false)} />
            )}
          </AnimatePresence>

          {/* ── LEFT SIDEBAR ── */}
          <aside className={`
            w-72 sm:w-64 flex-shrink-0 flex flex-col border-r border-white/10 bg-[#0a0a0d]/95 backdrop-blur-xl
            fixed md:relative inset-y-0 left-0 z-40 md:z-auto
            transition-transform duration-300 ease-in-out
            ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/8">
              <span className="text-base font-black text-slate-300 uppercase tracking-widest">Rooms</span>
              <motion.button onClick={() => setShowSidebar(false)} whileTap={{ scale: 0.9 }}
                className="p-1.5 bg-white/5 rounded-lg text-slate-400">
                <X size={15} />
              </motion.button>
            </div>

            <div className="p-4 border-b border-white/8">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms..."
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/40 transition-all" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Rooms · {filteredRooms.length}</span>
                <motion.button onClick={() => setShowCreateModal(true)} whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}
                  className="w-6 h-6 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 rounded-md flex items-center justify-center text-yellow-500 transition-colors">
                  <Plus size={13} />
                </motion.button>
              </div>

              {filteredRooms.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2 py-10 text-center">
                  <p className="text-sm text-slate-600 leading-relaxed">No rooms yet.<br />Create one to get started.</p>
                </motion.div>
              )}

              {filteredRooms.map((room, i) => {
                const isUnlocked = unlockedRooms.includes(room._id);
                const isActive   = activeRoom?._id === room._id;
                return (
                  <motion.div key={room._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + 0.1 }}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all group relative ${isActive ? 'bg-yellow-500/12 border border-yellow-500/25' : 'hover:bg-white/6 border border-transparent'}`}>
                    {isActive && <motion.div layoutId="activeRoomBg" className="absolute left-0 top-2 bottom-2 w-0.5 bg-yellow-500 rounded-full" />}
                    <button className="w-full text-left" onClick={() => handleRoomClick(room)}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span>
                          {room.isPrivate
                            ? <Lock size={12} className={isUnlocked ? 'text-yellow-500/70' : 'text-red-400/70'} />
                            : <Hash size={12} className={isUnlocked ? 'text-green-500/70' : 'text-slate-500'} />}
                        </span>
                        <span className={`text-base font-bold truncate flex-1 ${isActive ? 'text-yellow-400' : 'text-slate-300 group-hover:text-white'}`}>
                          {room.name}
                        </span>
                        {room.unread > 0 && (
                          <motion.span animate={{ scale: [1,1.2,1] }} transition={{ duration: 2, repeat: Infinity }}
                            className="w-5 h-5 bg-yellow-500 text-black text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0">
                            {room.unread}
                          </motion.span>
                        )}
                        {room.isPrivate && !isUnlocked && <span className="text-[10px] text-red-400/70 font-bold">LOCKED</span>}
                        {!room.isPrivate && !isUnlocked && !isLoggedIn && <span className="text-[10px] text-slate-500 font-bold">EMAIL</span>}
                      </div>
                      <div className="flex items-center gap-2 pl-5">
                        <span className="text-xs text-slate-500 truncate">{room.description}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-5 mt-0.5">
                        <Users size={10} className="text-slate-700" />
                        <span className="text-xs text-slate-600">{room.members} · {room.lastActivity}</span>
                      </div>
                    </button>
                    {room.isPrivate && room.isOwner && room.inviteCode && (
                      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onClick={() => setInviteCodeModal(room)}
                        className="mt-1.5 ml-5 flex items-center gap-1.5 text-xs text-yellow-500/70 hover:text-yellow-400 transition-colors font-bold uppercase tracking-wider"
                        whileHover={{ x: 2 }}>
                        <Copy size={10} /> View Code
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/8 bg-black/30">
              <div className="flex items-center gap-3">
                <Avatar letter={currentAvatar} size="sm" online="online" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{currentUser}</p>
                  <p className="text-xs text-slate-600 truncate">@{currentUser.toLowerCase()}</p>
                </div>
                <motion.div animate={{ y: [0,-3,0] }} transition={{ duration: 2, repeat: Infinity }} className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              </div>
            </div>
          </aside>

          {/* ── CHAT MAIN ── */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {activeRoom ? (
              <>
                {/* Room header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-[#0a0a0d]/90 backdrop-blur-xl flex-shrink-0 relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.button onClick={() => setShowSidebar(true)} className="md:hidden p-1.5 text-slate-400 hover:text-white transition-colors" whileTap={{ scale: 0.9 }}>
                      <ChevronLeft size={20} />
                    </motion.button>
                    <div className="w-9 h-9 bg-yellow-500/12 border border-yellow-500/25 rounded-xl flex items-center justify-center">
                      {activeRoom.isPrivate ? <Lock size={15} className="text-yellow-500" /> : <Hash size={15} className="text-yellow-500" />}
                    </div>
                    <div>
                      <h2 className="font-black text-white text-base sm:text-lg leading-tight">{activeRoom.name}</h2>
                      <p className="text-xs text-slate-500 hidden sm:block">{activeRoom.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* AI model pills in header */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-black/40 border border-white/8 px-3 py-1.5 rounded-full gap-2">
                      <div className={`flex items-center gap-1 text-xs font-bold ${GEMINI_API_KEY ? 'text-yellow-500' : 'text-slate-600'}`}>
                        <Sparkles size={10} /> Gemini
                      </div>
                      <span className="text-slate-700 text-xs">·</span>
                      <div className={`flex items-center gap-1 text-xs font-bold ${canUseChatGPT ? 'text-emerald-400' : 'text-slate-600'}`}>
                        <Bot size={10} /> ChatGPT
                      </div>
                    </div>
                    <motion.button onClick={() => setShowRightPanel(!showRightPanel)} whileHover={{ scale: 1.05 }}
                      className={`hidden md:flex p-2 rounded-xl border transition-colors ${showRightPanel ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                      <Users size={15} />
                    </motion.button>
                  </div>
                </div>

                {/* Error banner */}
                <AnimatePresence>
                  {geminiError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 px-6 py-2 bg-red-500/15 border-b border-red-500/20 text-red-400 text-sm flex-shrink-0 relative z-10">
                      <AlertCircle size={13} /> {geminiError}
                      <button onClick={() => setGeminiError('')} className="ml-auto"><X size={13} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages area with doodle background */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-hide relative"
                  style={{ background: 'linear-gradient(to bottom, rgba(7,7,10,0.80) 0%, rgba(7,7,10,0.85) 100%)' }}>

                  {/* WhatsApp-style doodle background */}
                  <ChatDoodleBackground />

                  <div className="relative z-10">
                    <AnimatePresence initial={false}>
                      {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center h-full text-center py-20">
                          <motion.div animate={{ y: [0,-6,0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-16 h-16 bg-yellow-500/12 border border-yellow-500/25 rounded-2xl flex items-center justify-center mb-4">
                            <Bot size={30} className="text-yellow-500" />
                          </motion.div>
                          <p className="text-slate-300 text-base font-bold mb-2">#{activeRoom.name}</p>
                          <p className="text-slate-500 text-sm">Start the conversation or mention <span className="text-yellow-500">@ai</span> to invoke Gemini</p>
                          {!canUseChatGPT && (
                            <p className="text-slate-700 text-xs mt-2">Add <code className="text-slate-600">VITE_OPENAI_API_KEY</code> to .env to enable ChatGPT fallback</p>
                          )}
                        </motion.div>
                      )}
                      {messages.map((msg) => (
                        <MessageBubble
                          key={msg._id}
                          msg={msg}
                          isOwn={msg.sender?.name === currentUser && !msg.isAI}
                          onAskChatGPT={handleAskChatGPT}
                          canAskChatGPT={canUseChatGPT}
                        />
                      ))}
                    </AnimatePresence>

                    {/* AI typing indicator */}
                    <AnimatePresence>
                      {aiTyping && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex gap-3 mb-4">
                          <Avatar letter={aiTypingModel === 'chatgpt' ? '⬡' : '✦'} isGPT={aiTypingModel === 'chatgpt'} />
                          <div className={`border rounded-2xl px-4 py-3 flex items-center gap-1.5 ${aiTypingModel === 'chatgpt' ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-yellow-500/10 border-yellow-500/25'}`}>
                            {[0, 0.2, 0.4].map((d, i) => (
                              <motion.div key={i} className={`w-2 h-2 rounded-full ${aiTypingModel === 'chatgpt' ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                                animate={{ y: [0,-5,0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
                            ))}
                            <span className={`text-sm ml-2 font-bold ${aiTypingModel === 'chatgpt' ? 'text-emerald-400/80' : 'text-yellow-500/80'}`}>
                              {aiTypingModel === 'chatgpt' ? 'ChatGPT is thinking...' : 'Gemini is thinking...'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input area */}
                <div className="px-3 sm:px-4 py-3 border-t border-white/10 bg-[#0a0a0d]/95 backdrop-blur-xl flex-shrink-0 relative z-10">
                  <AnimatePresence>
                    {showCode && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden">
                        <div className="bg-black/70 border border-yellow-500/20 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/5 border-b border-yellow-500/10">
                            <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest">Code Snippet · Auto-reviewed by Gemini</span>
                            <button onClick={() => setShowCode(false)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
                          </div>
                          <textarea value={codeInput} onChange={e => setCodeInput(e.target.value)}
                            placeholder="// Paste your code here..." rows={5}
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-transparent px-4 py-3 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none" autoFocus />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={sendMessage} className="flex items-end gap-2 sm:gap-3">
                    <motion.button type="button" onClick={() => setShowCode(!showCode)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className={`p-3 rounded-xl border transition-colors flex-shrink-0 ${showCode ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-500' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}>
                      <Code2 size={17} />
                    </motion.button>

                    {!showCode && (
                      <div className="flex-1 relative">
                        <input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          placeholder={`Message #${activeRoom.name} · @ai for Gemini`}
                          style={{ colorScheme: 'dark', backgroundColor: 'rgba(0,0,0,0.55)' }}
                          className="w-full border border-white/10 focus:border-yellow-500/40 rounded-xl py-3 px-4 text-base text-white placeholder:text-slate-600 focus:outline-none transition-all pr-10"
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }}}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Bot size={14} className="text-yellow-500/50" />
                          </motion.div>
                        </div>
                      </div>
                    )}

                    <motion.button type="submit"
                      whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(234,179,8,0.4)' }} whileTap={{ scale: 0.94 }}
                      className="bg-yellow-500 text-black p-3 rounded-xl flex-shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.2)] relative overflow-hidden group">
                      <motion.div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 rounded-xl transition-transform duration-300" />
                      <motion.div animate={{ y: [0,-2,0] }} transition={{ duration: 1.5, repeat: Infinity, ease: [0.34,1.56,0.64,1] }}>
                        <Send size={17} />
                      </motion.div>
                    </motion.button>
                  </form>

                  <p className="text-xs text-slate-700 mt-2 ml-1 hidden sm:block">
                    Paste code <kbd className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-600">⌘</kbd> · mention <span className="text-yellow-500/50">@ai</span> for Gemini · click <span className="text-emerald-500/50">Ask ChatGPT</span> on any reply to compare
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative" style={{ background: 'rgba(7,7,10,0.6)' }}>
                <ChatDoodleBackground />
                <div className="relative z-10">
                  <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center justify-center mb-6">
                    <Terminal size={38} className="text-yellow-500" />
                  </motion.div>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Select a <span className="text-yellow-500">Room</span>
                  </h3>
                  <p className="text-slate-400 text-base max-w-xs leading-relaxed">
                    Choose a room from the sidebar to start collaborating.<br />
                    Mention <span className="text-yellow-500">@ai</span> for Gemini or compare answers with <span className="text-emerald-400">ChatGPT</span>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <motion.button onClick={() => setShowCreateModal(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/15 text-yellow-500 text-sm font-bold px-5 py-3 rounded-xl transition-colors uppercase tracking-widest">
                      <Plus size={15} /> Create Room
                    </motion.button>
                    <motion.button onClick={() => setShowSidebar(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="md:hidden flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-400 text-sm font-bold px-5 py-3 rounded-xl transition-colors uppercase tracking-widest">
                      <Hash size={15} /> Browse Rooms
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <AnimatePresence>
            {showRightPanel && activeRoom && (
              <motion.aside
                initial={{ x: 80, opacity: 0, width: 0 }}
                animate={{ x: 0, opacity: 1, width: 220 }}
                exit={{ x: 80, opacity: 0, width: 0 }}
                transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
                className="hidden md:flex flex-shrink-0 flex-col border-l border-white/10 bg-[#0a0a0d]/90 backdrop-blur-xl overflow-hidden"
              >
                <div className="p-4 border-b border-white/8">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Room Info</p>
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-widest px-2 mb-2 font-bold">You</p>
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                      <Avatar letter={currentAvatar} size="sm" online="online" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-200 truncate">{currentUser}</p>
                        <p className="text-xs text-green-500 font-bold">Online</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-2 py-3 bg-white/3 border border-white/8 rounded-xl space-y-2">
                    <p className="text-xs text-slate-600 uppercase tracking-widest font-bold">Room</p>
                    <div className="flex items-center gap-2">
                      {activeRoom.isPrivate ? <Lock size={12} className="text-yellow-500" /> : <Globe size={12} className="text-green-500" />}
                      <span className="text-sm text-slate-400 font-bold">{activeRoom.isPrivate ? 'Private' : 'Public'}</span>
                    </div>
                    {activeRoom.description && <p className="text-xs text-slate-600 leading-relaxed">{activeRoom.description}</p>}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-slate-700">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* AI Models panel */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 uppercase tracking-widest px-2 font-bold">AI Models</p>

                    <motion.div animate={{ borderColor: ['rgba(234,179,8,0.1)','rgba(234,179,8,0.3)','rgba(234,179,8,0.1)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="p-3 bg-yellow-500/5 border rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                          <Sparkles size={12} className="text-yellow-500" />
                        </motion.div>
                        <span className="text-xs font-black text-yellow-500 uppercase tracking-wider">Gemini 2.5</span>
                        <motion.div animate={{ scale: [1,1.3,1] }} transition={{ duration: 2, repeat: Infinity }}
                          className={`w-2 h-2 rounded-full ml-auto ${GEMINI_API_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Primary AI. Mention <span className="text-yellow-500">@ai</span> or paste code.
                      </p>
                      {!GEMINI_API_KEY && <p className="text-xs text-red-400/70 mt-1 flex items-center gap-1"><AlertCircle size={10} /> API key missing</p>}
                    </motion.div>

                    <motion.div animate={{ borderColor: canUseChatGPT ? ['rgba(52,211,153,0.1)','rgba(52,211,153,0.3)','rgba(52,211,153,0.1)'] : ['rgba(255,255,255,0.05)','rgba(255,255,255,0.05)','rgba(255,255,255,0.05)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className={`p-3 border rounded-xl ${canUseChatGPT ? 'bg-emerald-500/5' : 'bg-white/2'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Bot size={12} className={canUseChatGPT ? 'text-emerald-400' : 'text-slate-600'} />
                        <span className={`text-xs font-black uppercase tracking-wider ${canUseChatGPT ? 'text-emerald-400' : 'text-slate-600'}`}>ChatGPT</span>
                        <motion.div animate={canUseChatGPT ? { scale: [1,1.3,1] } : {}} transition={{ duration: 2, repeat: Infinity }}
                          className={`w-2 h-2 rounded-full ml-auto ${canUseChatGPT ? 'bg-green-500' : 'bg-slate-700'}`} />
                      </div>
                      <p className={`text-xs leading-relaxed ${canUseChatGPT ? 'text-slate-500' : 'text-slate-700'}`}>
                        {canUseChatGPT
                          ? <>Fallback AI. Click <span className="text-emerald-400">Ask ChatGPT</span> on any Gemini reply.</>
                          : <>Add <code className="text-slate-600">VITE_OPENAI_API_KEY</code> to .env to enable.</>}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showCreateModal  && <CreateRoomModal  onClose={() => setShowCreateModal(false)}  onCreate={createRoom} />}
      </AnimatePresence>
      <AnimatePresence>
        {inviteCodeModal  && <InviteCodeModal  room={inviteCodeModal}  onClose={() => setInviteCodeModal(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {joinPrivateModal && <JoinPrivateRoomModal room={joinPrivateModal} onClose={() => setJoinPrivateModal(null)} onJoin={handleJoinPrivate} />}
      </AnimatePresence>
      <AnimatePresence>
        {joinPublicModal  && <JoinPublicRoomModal  room={joinPublicModal}  onClose={() => setJoinPublicModal(null)}  onJoin={handleJoinPublic} />}
      </AnimatePresence>
    </>
  );
};

export default DashboardPage;