import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Terminal, Cpu, Users, Sparkles, Zap, Shield, Code2, Globe } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

// ── Scramble Text Hook ─────────────────────────────────────────────────────────
const CHARS = '!<>-_\\/[]{}—=+*^?#@$%&ABCDEFabcdef0123456789';
function useScramble(target, trigger) {
  const [text, setText] = useState(target);
  useEffect(() => {
    if (!trigger) return;
    let frame = 0;
    const len = target.length;
    const id = setInterval(() => {
      setText(
        target.split('').map((c, i) =>
          i < Math.floor((frame / 18) * len) ? c : CHARS[Math.floor(Math.random() * CHARS.length)]
        ).join('')
      );
      frame++;
      if (frame > 18) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [trigger, target]);
  return text;
}

// ── Magnetic Button ────────────────────────────────────────────────────────────
function MagneticButton({ children, className, onClick, strength = 0.4 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      className={className}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}

// ── Particle Canvas ────────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const COUNT = 80;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(234,179,8,0.5)';
        ctx.fill();
      });
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(234,179,8,${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ── Shooting Stars ─────────────────────────────────────────────────────────────
function ShootingStars() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const MAX = 6;
    const stars = [];

    function spawn() {
      const angle = Math.random() * Math.PI * 0.25 + Math.PI * 0.1;
      const speed = Math.random() * 10 + 8;
      stars.push({
        x: Math.random() * W * 1.2 - W * 0.1,
        y: Math.random() * H * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: Math.random() * 120 + 80,
        alpha: 1,
        width: Math.random() * 1.5 + 0.5,
        tail: [],
      });
    }

    let raf;
    let tick = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      tick++;
      if (tick % 55 === 0 && stars.length < MAX) spawn();

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.tail.unshift({ x: s.x, y: s.y });
        if (s.tail.length > 18) s.tail.pop();
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.012;

        if (s.alpha <= 0 || s.x > W + 200 || s.y > H + 200) {
          stars.splice(i, 1);
          continue;
        }

        const grad = ctx.createLinearGradient(
          s.tail[s.tail.length - 1]?.x ?? s.x, s.tail[s.tail.length - 1]?.y ?? s.y,
          s.x, s.y
        );
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.4, `rgba(234,179,8,${s.alpha * 0.3})`);
        grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);

        ctx.beginPath();
        ctx.moveTo(s.tail[s.tail.length - 1]?.x ?? s.x, s.tail[s.tail.length - 1]?.y ?? s.y);
        s.tail.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.width * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,220,${s.alpha})`;
        ctx.fill();

        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 12);
        glow.addColorStop(0, `rgba(234,179,8,${s.alpha * 0.4})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

// ── Noise Texture Overlay ──────────────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[3] opacity-[0.04]"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px' }} />
  );
}
// ── Animated Parallax Planets ────────────────────────────────────────────────
function PlanetsBackground() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -400]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
      {/* Large Yellow/Orange Planet - Top Right */}
      <motion.div
        style={{ y: y1 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
      >
        {/* Increased opacity to 80, added outer glow, made the dark side blend into the background */}
        <div className="w-full h-full rounded-full bg-gradient-to-bl from-yellow-400 via-orange-500 to-[#07070a] opacity-80 shadow-[inset_-30px_-30px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(234,179,8,0.15)]" />
        {/* Brighter Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[40%] border-[2px] border-yellow-500/30 rounded-[100%] rotate-[-20deg]" />
      </motion.div>

      {/* Medium Deep Orange Planet - Mid Left */}
      <motion.div
        style={{ y: y2 }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.9, x: 0 }}
        transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
        className="absolute top-[40%] -left-20 w-[300px] h-[300px] rounded-full"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-600 via-yellow-500 to-[#07070a] opacity-75 shadow-[inset_-20px_-20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(249,115,22,0.1)]" />
      </motion.div>

      {/* Small Bright Planet - Bottom Right */}
      <motion.div
        style={{ y: y3 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 3, ease: "easeOut", delay: 0.6 }}
        className="absolute bottom-[-10%] right-[20%] w-[150px] h-[150px] rounded-full"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-t from-yellow-200 to-orange-500 opacity-90 shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.8),0_0_30px_rgba(253,224,71,0.2)]" />
      </motion.div>
    </div>
  );
}

// ── Glitch Text ────────────────────────────────────────────────────────────────
function GlitchText({ children, className }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        aria-hidden
        className="absolute inset-0 text-yellow-400"
        animate={{ x: [0, -3, 3, -2, 0], opacity: [0, 1, 1, 1, 0], clipPath: ['inset(40% 0 50% 0)', 'inset(10% 0 80% 0)', 'inset(70% 0 10% 0)', 'inset(20% 0 60% 0)', 'inset(0% 0 100% 0)'] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 4, ease: 'steps(1)' }}
      >{children}</motion.span>
      <motion.span
        aria-hidden
        className="absolute inset-0 text-orange-500"
        animate={{ x: [0, 3, -3, 2, 0], opacity: [0, 1, 1, 1, 0], clipPath: ['inset(60% 0 20% 0)', 'inset(80% 0 5% 0)', 'inset(30% 0 50% 0)', 'inset(5% 0 85% 0)', 'inset(0% 0 100% 0)'] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 4, delay: 0.05, ease: 'steps(1)' }}
      >{children}</motion.span>
    </span>
  );
}

// ── Scroll Marquee ─────────────────────────────────────────────────────────────
function Marquee() {
  const items = ['REAL-TIME COLLABORATION', 'AI BUG RESOLUTION', 'ZERO LATENCY', 'SYNTAX HIGHLIGHTING', '50+ LANGUAGES', 'WEBSOCKET POWERED'];
  return (
    <div className="relative overflow-hidden py-5 border-y border-yellow-500/20 bg-yellow-500/5">
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-yellow-500/70 font-black tracking-[0.25em] text-xs uppercase flex items-center gap-4">
            {item} <span className="text-yellow-500/30">◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Counter Number ─────────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, { duration: 1.8, ease: 'easeOut', onUpdate: v => setVal(Math.round(v)) });
    return ctrl.stop;
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Step Card ──────────────────────────────────────────────────────────────────
function Step({ icon, title, desc, index }) {
  const [hovered, setHovered] = useState(false);
  const scrambled = useScramble(title, hovered);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.6 }}
      viewport={{ once: true }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="text-center group relative cursor-default"
    >
      <motion.div
        animate={hovered ? { rotateY: 360 } : { rotateY: 0 }}
        transition={{ duration: 0.6 }}
        className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:border-yellow-500/60 group-hover:bg-yellow-500/10 transition-colors"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
        >
          {React.cloneElement(icon, { size: 28, className: "text-yellow-500" })}
        </motion.div>
      </motion.div>
      <h3 className="text-xl font-black mb-2 font-mono tracking-tight">{scrambled}</h3>
      <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
      {index < 3 && (
        <motion.div
          className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-8 h-px bg-gradient-to-r from-yellow-500/40 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ delay: index * 0.12 + 0.4 }}
        />
      )}
    </motion.div>
  );
}

// ── Feature Card ───────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      whileHover={{ y: -6, scale: 1.02 }} // Reduced bounce/rotation significantly
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative p-10 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-xl hover:border-yellow-500/30 transition-all overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="absolute -right-8 -bottom-8 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"
        animate={{ scale: hovered ? 1.2 : 1, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />
      <motion.div
        className="text-yellow-500 mb-6 relative z-10"
        animate={{ rotate: hovered ? [0, -5, 5, 0] : 0 }} // Subtle wiggle instead of aggressive spin
        transition={{ duration: hovered ? 0.4 : 2.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
      >
        {React.cloneElement(icon, { size: 32 })}
      </motion.div>
      <h3 className="text-2xl font-black mb-4 relative z-10 tracking-tight">{title}</h3>
      <p className="text-slate-200 leading-relaxed relative z-10">{desc}</p>
    </motion.div>
  );
}

// ── Cursor Glow ────────────────────────────────────────────────────────────────
function CursorGlow() {
  const cx = useMotionValue(-200);
  const cy = useMotionValue(-200);
  const sx = useSpring(cx, { stiffness: 80, damping: 18 });
  const sy = useSpring(cy, { stiffness: 80, damping: 18 });

  useEffect(() => {
    const move = (e) => { cx.set(e.clientX); cy.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [cx, cy]);

  return (
    <motion.div
      className="fixed pointer-events-none z-[4] w-[400px] h-[400px] rounded-full"
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%', background: 'radial-gradient(circle, rgba(234,179,8,0.06) 0%, transparent 70%)' }}
    />
  );
}

// ── Spinning Ring ──────────────────────────────────────────────────────────────
function SpinRing({ size, duration, opacity, dashed }) {
  return (
    <motion.div
      className="absolute rounded-full border border-yellow-500/20"
      style={{ width: size, height: size, borderStyle: dashed ? 'dashed' : 'solid', opacity }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <PageWrapper>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&display=swap');`}</style>

      <div className="min-h-screen bg-[#07070a] text-white selection:bg-yellow-500/40 overflow-x-hidden" style={{ fontFamily: "'Space Mono', monospace" }}>

        {/* Progress Bar */}
        <motion.div className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-yellow-500 to-orange-500 z-[100] origin-left" style={{ width: progressWidth }} />

        {/* Layered Backgrounds */}
        <PlanetsBackground />
        <ParticleField />
        <ShootingStars />
        <NoiseOverlay />
        <CursorGlow />

        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-50 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto backdrop-blur-sm"
        >
          <motion.div
            className="flex items-center gap-2 text-2xl font-black tracking-tighter cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="bg-yellow-500 p-1.5 rounded-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Terminal size={20} className="text-black" />
            </motion.div>
            <span>DevRooms</span><span className="text-yellow-500">AI</span>
          </motion.div>

          <div className="flex gap-6 items-center">
            <motion.button
              onClick={() => navigate('/login')}
              className="text-slate-400 hover:text-white transition-colors text-sm"
              whileHover={{ y: -2 }}
            >Login</motion.button>
            <MagneticButton
              onClick={() => navigate('/register')}
              className="bg-white/10 hover:bg-white/20 border border-white/10 hover:border-yellow-500/40 px-6 py-2.5 rounded-full transition-colors text-sm font-bold tracking-wide backdrop-blur-md"
            >
              Sign Up
            </MagneticButton>
          </div>
        </motion.nav>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative z-10 max-w-7xl mx-auto px-8 pt-28 pb-48 text-center">
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            {/* Spinning rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <SpinRing size={500} duration={30} opacity={0.15} />
              <SpinRing size={700} duration={50} opacity={0.08} dashed />
              <SpinRing size={900} duration={80} opacity={0.05} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 px-5 py-2 rounded-full text-yellow-500 text-xs font-bold tracking-widest uppercase mb-10 backdrop-blur-md"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                <Sparkles size={14} />
              </motion.div>
              Now with Real-time Bug Resolution
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(5rem,16vw,13rem)] font-black leading-[0.85] tracking-[-0.04em] mb-2 drop-shadow-2xl"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              CODE
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 60, skewX: -8 }}
              animate={{ opacity: 1, y: 0, skewX: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(5rem,16vw,13rem)] font-black leading-[0.85] tracking-[-0.04em] mb-8"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              <GlitchText className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-600">TOGETHER.</GlitchText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="text-slate-200 text-lg max-w-xl mx-auto mb-12 leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            >
              The ultimate real-time collaborative workspace. Resolve complex bugs instantly with our context-aware AI assistant.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.85, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <MagneticButton
                onClick={() => navigate('/auth')}
                strength={0.3}
                className="relative bg-yellow-500 text-black font-black text-base px-10 py-5 rounded-2xl shadow-[0_0_60px_rgba(234,179,8,0.3)] overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <motion.span
                  className="relative z-10 flex items-center gap-2"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <motion.span animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>⚡</motion.span>
                  Launch Workspace
                </motion.span>
              </MagneticButton>
              <motion.button
                onClick={() => navigate('/auth')}
                className="text-slate-400 hover:text-white text-sm font-bold underline underline-offset-4 transition-colors relative z-10"
                whileHover={{ letterSpacing: '0.05em' }}
                transition={{ duration: 0.2 }}
              >
                View Demo →
              </motion.button>
            </motion.div>
          </motion.div>
        </section>

        {/* ── MARQUEE ───────────────────────────────────────────────────── */}
        <Marquee />

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <section className="relative z-10 py-20 max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { val: 50, suffix: '+', label: 'Languages' },
              { val: 99, suffix: '%', label: 'Uptime SLA' },
              { val: 12, suffix: 'ms', label: 'Avg Latency' },
            ].map(({ val, suffix, label }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <motion.div
                  className="text-5xl md:text-6xl font-black text-yellow-500 mb-2 tabular-nums"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                >
                  <Counter to={val} suffix={suffix} />
                </motion.div>
                <div className="text-slate-300 text-xs tracking-widest uppercase font-bold">{label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section className="relative z-10 py-32 bg-black/40 backdrop-blur-sm border-y border-white/5 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(234,179,8,0.02)_40px,rgba(234,179,8,0.02)_41px)]"
            animate={{ backgroundPositionY: ['0px', '41px'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <div className="max-w-7xl mx-auto px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <p className="text-yellow-500 text-xs tracking-[0.3em] uppercase font-bold mb-4">Process</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Unified Workflow</h2>
              <p className="text-slate-300 mt-4 max-w-md mx-auto text-sm leading-relaxed">Stop switching between tabs. Keep your team and AI in one place.</p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-10 relative">
              <Step icon={<Globe />} title="Create Room" desc="Setup dedicated spaces for different projects." index={0} />
              <Step icon={<Users />} title="Invite Team" desc="Collaborate in real-time with other developers." index={1} />
              <Step icon={<Code2 />} title="Share Snippets" desc="Post code directly into the chat stream." index={2} />
              <Step icon={<Zap />} title="AI Resolves" desc="The AI fixes bugs and explains the logic." index={3} />
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section className="relative z-10 py-40 max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-yellow-500 text-xs tracking-[0.3em] uppercase font-bold mb-4">Features</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Built Different</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={<Shield />} title="Context Aware" desc="The AI understands your chat history to provide accurate fixes with full project context." index={0} />
            <FeatureCard icon={<Terminal />} title="Syntax Support" desc="Beautiful code highlighting for 50+ programming languages with zero configuration." index={1} />
            <FeatureCard icon={<Cpu />} title="Real-time Sync" desc="Zero-latency messaging powered by advanced WebSockets and edge infrastructure." index={2} />
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="relative z-10 py-32 px-8 text-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-4xl mx-auto bg-gradient-to-br from-yellow-500/10 via-black/50 to-orange-500/10 p-20 rounded-[3rem] border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl"
          >
            {/* Pulsing corner accents */}
            {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
              <motion.div
                key={i}
                className={`absolute ${pos} w-6 h-6 border-yellow-500`}
                style={{ borderTopWidth: i < 2 ? 2 : 0, borderBottomWidth: i >= 2 ? 2 : 0, borderLeftWidth: i % 2 === 0 ? 2 : 0, borderRightWidth: i % 2 === 1 ? 2 : 0 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}

            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-20 -right-20 w-64 h-64 border border-yellow-500/10 rounded-full"
            />
            <motion.div
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-20 -left-20 w-72 h-72 border border-orange-500/10 rounded-full"
            />

            <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tight relative z-10" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Ready to fix<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">that bug?</span>
            </h2>
            <p className="text-slate-200 mb-10 relative z-10 text-sm max-w-md mx-auto">Join thousands of developers shipping faster with AI-powered collaboration.</p>
            <div className="relative z-10">
              <MagneticButton
                onClick={() => navigate('/auth')}
                strength={0.25}
                className="bg-white text-black font-black text-base px-14 py-5 rounded-2xl hover:bg-yellow-400 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                <motion.span
                  className="inline-block"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: [0.34, 1.56, 0.64, 1], repeatDelay: 1 }}
                >
                  Join DevRooms Now →
                </motion.span>
              </MagneticButton>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="relative z-10 py-12 border-t border-white/5 text-center text-slate-600 text-xs tracking-widest uppercase backdrop-blur-sm bg-black/40">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            © 2026 DevRoomsAI — Built for High-Performance Teams
          </motion.div>
        </footer>
      </div>
    </PageWrapper>
  );
};

export default LandingPage;