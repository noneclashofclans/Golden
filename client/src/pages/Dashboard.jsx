import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Terminal, Hash, Plus, Users, Zap, Bot, Settings,
  LogOut, MessageSquare, Search, X, Check, Copy,
  Code2, Send, Sparkles, Circle, ChevronRight, Loader,
  Lock, Globe, Trash2, AlertCircle
} from 'lucide-react';
// ─────────────────────────────────────────────────────────────────────────────
// Background FX (matching LandingPage / Auth)
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
        ctx.fillStyle = 'rgba(234,179,8,0.3)'; ctx.fill();
      });
      for (let i = 0; i < COUNT; i++) for (let j = i + 1; j < COUNT; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(234,179,8,${0.07 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
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
        const grad = ctx.createLinearGradient(s.tail[s.tail.length - 1]?.x ?? s.x, s.tail[s.tail.length - 1]?.y ?? s.y, s.x, s.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.4, `rgba(234,179,8,${s.alpha * 0.3})`);
        grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);
        ctx.beginPath(); ctx.moveTo(s.tail[s.tail.length - 1]?.x ?? s.x, s.tail[s.tail.length - 1]?.y ?? s.y);
        s.tail.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = grad; ctx.lineWidth = s.width; ctx.lineCap = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.arc(s.x, s.y, s.width * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,220,${s.alpha})`; ctx.fill();
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 12);
        glow.addColorStop(0, `rgba(234,179,8,${s.alpha * 0.4})`); glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(s.x, s.y, 12, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
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
    <div className="fixed inset-0 pointer-events-none z-[2] opacity-[0.03]"
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
    <motion.div className="fixed pointer-events-none z-[3] w-[350px] h-[350px] rounded-full"
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%', background: 'radial-gradient(circle, rgba(234,179,8,0.05) 0%, transparent 70%)' }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dummy Data
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_ROOMS = [
  { _id: '1', name: 'react-bugs', description: 'React 18 hydration & hooks issues', members: 8, isPrivate: false, lastActivity: '2m ago', unread: 3 },
  { _id: '2', name: 'node-backend', description: 'Express + MongoDB debugging', members: 5, isPrivate: false, lastActivity: '14m ago', unread: 0 },
  { _id: '3', name: 'css-wizardry', description: 'Layout & animation problems', members: 12, isPrivate: false, lastActivity: '1h ago', unread: 7 },
  { _id: '4', name: 'auth-module', description: 'JWT & session handling', members: 3, isPrivate: true, lastActivity: '3h ago', unread: 0 },
  { _id: '5', name: 'devops-ci', description: 'Pipeline & deployment issues', members: 6, isPrivate: true, lastActivity: '1d ago', unread: 0 },
];

const DUMMY_MESSAGES = [
  { _id: 'm1', sender: { name: 'Rishit', avatar: 'R' }, text: 'Hey everyone, getting a weird hydration error in React 18. Anyone seen this before?', isAI: false, isCode: false, time: '10:32 AM' },
  { _id: 'm2', sender: { name: 'Rishit', avatar: 'R' }, text: `// Error occurs here\nuseEffect(() => {\n  setData(window.localStorage.getItem('key'));\n}, []);`, isAI: false, isCode: true, lang: 'javascript', time: '10:33 AM' },
  { _id: 'm3', sender: { name: 'Alex', avatar: 'A' }, text: 'Classic SSR mismatch. localStorage doesn\'t exist on the server side.', isAI: false, isCode: false, time: '10:35 AM' },
  { _id: 'm4', sender: { name: 'GeminiAI', avatar: '✦' }, text: 'The issue is that `localStorage` is only available in browser environments, but during SSR (Server-Side Rendering), React runs on Node.js where `window` is undefined. Guard the access inside a check:', isAI: true, isCode: false, time: '10:35 AM' },
  { _id: 'm5', sender: { name: 'GeminiAI', avatar: '✦' }, text: `const [data, setData] = useState(null);\n\nuseEffect(() => {\n  // This runs only on the client\n  if (typeof window !== 'undefined') {\n    setData(localStorage.getItem('key'));\n  }\n}, []);\n\n// Even better: use a custom hook\nfunction useLocalStorage(key) {\n  const [value, setValue] = useState(() => {\n    if (typeof window === 'undefined') return null;\n    return localStorage.getItem(key);\n  });\n  return value;\n}`, isAI: true, isCode: true, lang: 'javascript', time: '10:35 AM' },
  { _id: 'm6', sender: { name: 'Priya', avatar: 'P' }, text: 'That custom hook pattern is 🔥 — using it from now on', isAI: false, isCode: false, time: '10:38 AM' },
  { _id: 'm7', sender: { name: 'Alex', avatar: 'A' }, text: 'Also works well with Next.js dynamic imports with `ssr: false`', isAI: false, isCode: false, time: '10:40 AM' },
];

const DUMMY_MEMBERS = [
  { name: 'Rishit', role: 'Owner', status: 'online', avatar: 'R' },
  { name: 'Alex', role: 'Dev', status: 'online', avatar: 'A' },
  { name: 'Priya', role: 'Dev', status: 'online', avatar: 'P' },
  { name: 'Jordan', role: 'Dev', status: 'idle', avatar: 'J' },
  { name: 'Sam', role: 'Dev', status: 'offline', avatar: 'S' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Small Components
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ letter, size = 'md', online }) {
  const colors = { R: 'from-yellow-500 to-orange-500', A: 'from-blue-500 to-cyan-500', P: 'from-pink-500 to-purple-500', J: 'from-green-500 to-emerald-500', S: 'from-slate-500 to-slate-600', '✦': 'from-yellow-400 to-yellow-600' };
  const gradient = colors[letter] || 'from-yellow-500 to-orange-500';
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';
  return (
    <div className={`relative flex-shrink-0 ${sz}`}>
      <div className={`w-full h-full rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-black`}>{letter}</div>
      {online !== undefined && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d10] ${online === 'online' ? 'bg-green-500' : online === 'idle' ? 'bg-yellow-500' : 'bg-slate-600'}`} />
      )}
    </div>
  );
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/60 text-xs font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-yellow-500/70 uppercase tracking-widest text-[10px] font-bold">{lang || 'code'}</span>
        <motion.button onClick={copy} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-slate-400 hover:text-yellow-500 transition-colors">
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
        </motion.button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{code}</pre>
    </div>
  );
}

function MessageBubble({ msg, isOwn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 mb-5 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {msg.isAI
          ? <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}><Avatar letter="✦" /></motion.div>
          : <Avatar letter={msg.sender.avatar} />}
      </div>

      <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Name + time */}
        <div className={`flex items-center gap-2 mb-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className={`text-xs font-bold ${msg.isAI ? 'text-yellow-500' : 'text-slate-200'}`}>
            {msg.isAI ? '✦ Gemini AI' : msg.sender.name}
          </span>
          <span className="text-[10px] text-slate-600">{msg.time}</span>
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative ${
          msg.isAI
            ? 'bg-yellow-500/8 border border-yellow-500/20 text-slate-100'
            : isOwn
            ? 'bg-yellow-500 text-black font-medium rounded-tr-sm'
            : 'bg-white/6 border border-white/10 text-slate-100 rounded-tl-sm'
        }`}>
          {msg.isAI && (
            <motion.div className="absolute -left-1 -top-1 w-2 h-2 bg-yellow-500 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }} />
          )}
          {!msg.isCode && <p>{msg.text}</p>}
          {msg.isCode && <CodeBlock code={msg.text} lang={msg.lang} />}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Room Modal
// ─────────────────────────────────────────────────────────────────────────────
function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onCreate({ name: name.toLowerCase().replace(/\s+/g, '-'), description: desc, isPrivate });
      setLoading(false);
      onClose();
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#0d0d10] border border-white/10 rounded-[2rem] p-8 relative shadow-[0_0_80px_rgba(0,0,0,0.9)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Corner accents */}
        {['top-3 left-3 border-t-2 border-l-2','top-3 right-3 border-t-2 border-r-2','bottom-3 left-3 border-b-2 border-l-2','bottom-3 right-3 border-b-2 border-r-2'].map((cls, i) => (
          <motion.div key={i} className={`absolute w-4 h-4 border-yellow-500/40 ${cls}`} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} />
        ))}

        {/* Glow */}
        <div className="absolute inset-0 rounded-[2rem] bg-yellow-500/3 blur-xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                CREATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">ROOM</span>
              </h3>
              <p className="text-slate-500 text-xs tracking-widest uppercase mt-1">New Developer Space</p>
            </div>
            <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}
              className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-slate-400">
              <X size={14} />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Room Name */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Room Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/60 text-sm font-bold">#</span>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="react-debugging"
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500/50 rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Description <span className="text-slate-600">(optional)</span></label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="What will this room be used for?"
                rows={3}
                className="w-full bg-black/50 border border-white/10 focus:border-yellow-500/50 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Private toggle */}
            <div className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPrivate ? 'bg-yellow-500/15 text-yellow-500' : 'bg-white/5 text-slate-500'}`}>
                  {isPrivate ? <Lock size={15} /> : <Globe size={15} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{isPrivate ? 'Private Room' : 'Public Room'}</p>
                  <p className="text-[11px] text-slate-500">{isPrivate ? 'Invite-only access' : 'Anyone can join'}</p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-11 h-6 rounded-full relative transition-colors ${isPrivate ? 'bg-yellow-500' : 'bg-white/10'}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-4 h-4 bg-white rounded-full absolute top-1"
                  animate={{ x: isPrivate ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              </motion.button>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !name.trim()}
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(234,179,8,0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {loading
                ? <><Loader size={14} className="animate-spin" /> Initializing...</>
                : <><Zap size={14} /> Launch Room</>
              }
            </motion.button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate = useNavigate();

  // ── Read real logged-in user from localStorage ──
  const storedUser = JSON.parse(localStorage.getItem('devrooms_user') || '{}');
  const currentUser = storedUser.username || 'You';
  const currentAvatar = (storedUser.username?.[0] || 'Y').toUpperCase();
  const [rooms, setRooms] = useState(DUMMY_ROOMS);
  const [activeRoom, setActiveRoom] = useState(DUMMY_ROOMS[0]);
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [input, setInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const filteredRooms = rooms.filter(r => r.name.includes(search.toLowerCase()));

  const sendMessage = (e) => {
    e.preventDefault();
    const text = showCode ? codeInput : input;
    if (!text.trim()) return;

    const newMsg = {
      _id: `m${Date.now()}`,
      sender: { name: currentUser, avatar: currentAvatar },
      text: text.trim(),
      isAI: false,
      isCode: showCode,
      lang: 'javascript',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput(''); setCodeInput(''); setShowCode(false);

    // Simulate AI reply
    if (text.toLowerCase().includes('@ai') || showCode) {
      setAiTyping(true);
      setTimeout(() => {
        setAiTyping(false);
        setMessages(prev => [...prev, {
          _id: `ai${Date.now()}`,
          sender: { name: 'GeminiAI', avatar: '✦' },
          text: showCode
            ? `I've analyzed your code. Here are a few observations:\n\n1. Consider adding error boundaries for better fault isolation\n2. The logic looks structurally sound but could benefit from memoization\n3. Add JSDoc comments to improve maintainability\n\nWant me to refactor this with best practices applied?`
            : `That's a great question! Based on the context of your room, I'd suggest checking the documentation and ensuring your dependencies are up to date. Let me know if you'd like a deeper analysis.`,
          isAI: true,
          isCode: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      }, 1800);
    }
  };

  const createRoom = (data) => {
    const newRoom = { _id: `r${Date.now()}`, ...data, members: 1, lastActivity: 'just now', unread: 0 };
    setRooms(prev => [newRoom, ...prev]);
    setActiveRoom(newRoom);
    setMessages([]);
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&display=swap');`}</style>

      <div className="h-screen bg-[#07070a] text-white overflow-hidden flex flex-col" style={{ fontFamily: "'Space Mono', monospace" }}>

        {/* BG */}
        <ParticleField />
        <ShootingStars />
        <NoiseOverlay />
        <CursorGlow />
        <div className="fixed inset-0 pointer-events-none z-0">
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.14, 0.08] }} transition={{ duration: 10, repeat: Infinity }} className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-yellow-500/15 blur-[160px] rounded-full" />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.09, 0.05] }} transition={{ duration: 13, repeat: Infinity, delay: 4 }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[140px] rounded-full" />
        </div>

        {/* ── TOP NAV ──────────────────────────────────────────────── */}
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-40 flex items-center justify-between px-6 py-3.5 border-b border-white/8 bg-black/40 backdrop-blur-xl flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <motion.div className="bg-yellow-500 p-1.5 rounded-lg" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Terminal size={18} className="text-black" />
            </motion.div>
            <span className="text-lg font-black tracking-tighter">DevRooms<span className="text-yellow-500">AI</span></span>
          </div>

          {/* Active room indicator */}
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <Hash size={13} className="text-yellow-500" />
            <span className="text-sm font-bold text-slate-200">{activeRoom?.name}</span>
            <span className="text-xs text-slate-500">· {DUMMY_MEMBERS.filter(m => m.status === 'online').length} online</span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-yellow-500/30 px-3 py-2 rounded-xl transition-colors text-slate-400 hover:text-white text-xs">
              <Settings size={14} />
            </motion.button>
            <motion.button onClick={() => { localStorage.removeItem('devrooms_token'); localStorage.removeItem('devrooms_user'); navigate('/'); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-red-500/30 px-3 py-2 rounded-xl transition-colors text-slate-400 hover:text-red-400 text-xs">
              <LogOut size={14} />
            </motion.button>
            <Avatar letter={currentAvatar} size="sm" online="online" />
          </div>
        </motion.header>

        {/* ── MAIN LAYOUT ──────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden relative z-10">

          {/* ── LEFT SIDEBAR: Rooms ─────────────────────────────────── */}
          <motion.aside
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-64 flex-shrink-0 flex flex-col border-r border-white/8 bg-black/30 backdrop-blur-xl"
          >
            {/* Search */}
            <div className="p-4 border-b border-white/8">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search rooms..."
                  className="w-full bg-white/5 border border-white/8 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/40 transition-all"
                />
              </div>
            </div>

            {/* Room list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Rooms · {filteredRooms.length}</span>
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 rounded-md flex items-center justify-center text-yellow-500 transition-colors"
                >
                  <Plus size={11} />
                </motion.button>
              </div>

              {filteredRooms.map((room, i) => (
                <motion.button
                  key={room._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                  onClick={() => { setActiveRoom(room); setMessages(DUMMY_MESSAGES); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group relative ${activeRoom?._id === room._id ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  {activeRoom?._id === room._id && (
                    <motion.div layoutId="activeRoomBg" className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500 rounded-full" />
                  )}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm ${room.isPrivate ? 'text-slate-500' : 'text-slate-500'}`}>
                      {room.isPrivate ? <Lock size={11} /> : <Hash size={11} />}
                    </span>
                    <span className={`text-sm font-bold truncate flex-1 ${activeRoom?._id === room._id ? 'text-yellow-400' : 'text-slate-300 group-hover:text-white'}`}>
                      {room.name}
                    </span>
                    {room.unread > 0 && (
                      <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        className="w-4 h-4 bg-yellow-500 text-black text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">
                        {room.unread}
                      </motion.span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-[10px] text-slate-600 truncate">{room.description}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-4 mt-0.5">
                    <Users size={9} className="text-slate-700" />
                    <span className="text-[9px] text-slate-700">{room.members}</span>
                    <span className="text-[9px] text-slate-700">· {room.lastActivity}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* User profile strip */}
            <div className="p-4 border-t border-white/8 bg-black/20">
              <div className="flex items-center gap-3">
                <Avatar letter={currentAvatar} size="sm" online="online" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{currentUser}</p>
                  <p className="text-[10px] text-slate-600 truncate">@{currentUser.toLowerCase()}</p>
                </div>
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
            </div>
          </motion.aside>

          {/* ── CHAT MAIN ───────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Room header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-black/20 backdrop-blur-sm flex-shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
                  {activeRoom?.isPrivate ? <Lock size={14} className="text-yellow-500" /> : <Hash size={14} className="text-yellow-500" />}
                </div>
                <div>
                  <h2 className="font-black text-white text-sm">{activeRoom?.name}</h2>
                  <p className="text-[11px] text-slate-500">{activeRoom?.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 bg-yellow-500/8 border border-yellow-500/15 px-3 py-1.5 rounded-full">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={11} className="text-yellow-500" />
                  </motion.div>
                  <span className="text-[10px] text-yellow-500 font-bold tracking-wider">GEMINI ACTIVE</span>
                </div>
                <motion.button
                  onClick={() => setShowMembers(!showMembers)}
                  whileHover={{ scale: 1.05 }}
                  className={`p-2 rounded-xl border transition-colors ${showMembers ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                  <Users size={14} />
                </motion.button>
              </div>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <MessageBubble key={msg._id} msg={msg} isOwn={msg.sender?.name === currentUser && !msg.isAI} />
                ))}
              </AnimatePresence>

              {/* AI typing indicator */}
              <AnimatePresence>
                {aiTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="flex gap-3 mb-4"
                  >
                    <Avatar letter="✦" />
                    <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                      {[0, 0.2, 0.4].map((d, i) => (
                        <motion.div key={i} className="w-1.5 h-1.5 bg-yellow-500 rounded-full"
                          animate={{ y: [0, -5, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
                      ))}
                      <span className="text-xs text-yellow-500/70 ml-2 font-bold">Gemini is analyzing...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/8 bg-black/30 backdrop-blur-xl flex-shrink-0">
              <AnimatePresence>
                {showCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mb-3 overflow-hidden"
                  >
                    <div className="bg-black/60 border border-yellow-500/20 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/5 border-b border-yellow-500/10">
                        <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Code Snippet</span>
                        <button onClick={() => setShowCode(false)} className="text-slate-500 hover:text-white transition-colors"><X size={13} /></button>
                      </div>
                      <textarea
                        value={codeInput}
                        onChange={e => setCodeInput(e.target.value)}
                        placeholder="// Paste your code here..."
                        rows={6}
                        className="w-full bg-transparent px-4 py-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none"
                        autoFocus
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={sendMessage} className="flex items-end gap-3">
                {/* Code toggle */}
                <motion.button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-3 rounded-xl border transition-colors flex-shrink-0 ${showCode ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-500' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
                >
                  <Code2 size={16} />
                </motion.button>

                {/* Text input */}
                {!showCode && (
                  <div className="flex-1 relative">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder={`Message #${activeRoom?.name}  ·  mention @ai for Gemini`}
                      className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/40 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all pr-12"
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }}}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Bot size={13} className="text-yellow-500/50" />
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* Send */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(234,179,8,0.4)' }}
                  whileTap={{ scale: 0.94 }}
                  className="bg-yellow-500 text-black p-3 rounded-xl flex-shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.2)] relative overflow-hidden group"
                >
                  <motion.div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 rounded-xl transition-transform duration-300" />
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Send size={16} />
                  </motion.div>
                </motion.button>
              </form>

              <p className="text-[10px] text-slate-700 mt-2 ml-1">
                Tip: paste code with <kbd className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-600">⌘</kbd> button · mention <span className="text-yellow-500/50">@ai</span> to invoke Gemini
              </p>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR: Members ───────────────────────────────── */}
          <AnimatePresence>
            {showMembers && (
              <motion.aside
                initial={{ x: 80, opacity: 0, width: 0 }}
                animate={{ x: 0, opacity: 1, width: 220 }}
                exit={{ x: 80, opacity: 0, width: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex-shrink-0 flex flex-col border-l border-white/8 bg-black/30 backdrop-blur-xl overflow-hidden"
              >
                <div className="p-4 border-b border-white/8">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Members · {DUMMY_MEMBERS.length}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
                  {/* Online */}
                  <p className="text-[9px] text-slate-700 uppercase tracking-widest px-2 mb-2">Online — {DUMMY_MEMBERS.filter(m => m.status === 'online').length}</p>
                  {DUMMY_MEMBERS.filter(m => m.status !== 'offline').map((m, i) => (
                    <motion.div
                      key={m.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.3 }}
                      whileHover={{ x: -2 }}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group cursor-default"
                    >
                      <Avatar letter={m.avatar} size="sm" online={m.status} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-200 truncate">{m.name}</p>
                        <p className="text-[9px] text-slate-600 truncate">{m.role}</p>
                      </div>
                    </motion.div>
                  ))}
                  <div className="h-px bg-white/5 my-2" />
                  <p className="text-[9px] text-slate-700 uppercase tracking-widest px-2 mb-2">Offline — {DUMMY_MEMBERS.filter(m => m.status === 'offline').length}</p>
                  {DUMMY_MEMBERS.filter(m => m.status === 'offline').map((m, i) => (
                    <motion.div key={m.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + 0.5 }}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-xl opacity-40">
                      <Avatar letter={m.avatar} size="sm" online="offline" />
                      <div><p className="text-xs font-bold text-slate-400 truncate">{m.name}</p></div>
                    </motion.div>
                  ))}
                </div>

                {/* AI assistant promo */}
                <motion.div
                  animate={{ borderColor: ['rgba(234,179,8,0.1)', 'rgba(234,179,8,0.3)', 'rgba(234,179,8,0.1)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="m-3 p-3 bg-yellow-500/5 border rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles size={13} className="text-yellow-500" />
                    </motion.div>
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">Gemini AI</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Mention <span className="text-yellow-500">@ai</span> or share a code snippet to get instant bug resolution.</p>
                </motion.div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoomModal onClose={() => setShowCreateModal(false)} onCreate={createRoom} />
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardPage;