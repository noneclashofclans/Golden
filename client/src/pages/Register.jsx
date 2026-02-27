import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Sparkles, Terminal } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

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

    const COUNT = 60;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.4,
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
        ctx.fillStyle = 'rgba(234,179,8,0.45)';
        ctx.fill();
      });
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(234,179,8,${0.1 * (1 - d / 110)})`;
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

    const MAX = 5;
    const stars = [];

    function spawn() {
      const angle = Math.random() * Math.PI * 0.25 + Math.PI * 0.1;
      const speed = Math.random() * 10 + 8;
      stars.push({
        x: Math.random() * W * 1.2 - W * 0.1,
        y: Math.random() * H * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
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

        if (s.alpha <= 0 || s.x > W + 200 || s.y > H + 200) { stars.splice(i, 1); continue; }

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

// ── Noise Overlay ──────────────────────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[3] opacity-[0.04]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px',
      }}
    />
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
      style={{
        x: sx, y: sy, translateX: '-50%', translateY: '-50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.07) 0%, transparent 70%)',
      }}
    />
  );
}

// ── Spinning Ring ──────────────────────────────────────────────────────────────
function SpinRing({ size, duration, opacity, dashed, reverse }) {
  return (
    <motion.div
      className="absolute rounded-full border border-yellow-500/20 left-1/2 top-1/2"
      style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderStyle: dashed ? 'dashed' : 'solid', opacity }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ── Input Field ────────────────────────────────────────────────────────────────
function InputField({ icon, type, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      className="relative group"
      animate={focused ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
        animate={{ color: focused ? 'rgb(234,179,8)' : 'rgb(100,116,139)' }}
      >
        {icon}
      </motion.div>
      <input
        type={type}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-black/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-yellow-500/50 transition-all text-sm placeholder:text-slate-600 text-white"
      />
      {/* Focus glow line at bottom */}
      <motion.div
        className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
        animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ originX: 0 }}
      />
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&display=swap');`}</style>

      <div
        className="min-h-screen flex items-center justify-center p-6 bg-[#07070a] text-white selection:bg-yellow-500/40 relative overflow-hidden"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {/* ── Background Layers ── */}
        <ParticleField />
        <ShootingStars />
        <NoiseOverlay />
        <CursorGlow />

        {/* Ambient blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], opacity: [0.12, 0.2, 0.12] }}
            transition={{ duration: 9, repeat: Infinity }}
            className="absolute -top-[20%] -left-[15%] w-[600px] h-[600px] bg-yellow-500/20 blur-[150px] rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], x: [0, -30, 0], opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 12, repeat: Infinity, delay: 3 }}
            className="absolute bottom-[0%] -right-[15%] w-[700px] h-[700px] bg-orange-600/10 blur-[180px] rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.08, 0.04] }}
            transition={{ duration: 7, repeat: Infinity, delay: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-yellow-400/10 blur-[100px] rounded-full"
          />
        </div>

        {/* Spinning orbital rings centered on page */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="relative w-0 h-0">
            <SpinRing size={520} duration={35} opacity={0.08} />
            <SpinRing size={750} duration={55} opacity={0.05} dashed reverse />
            <SpinRing size={980} duration={85} opacity={0.03} />
          </div>
        </div>

        {/* ── Register Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-10"
        >
          {/* Glow behind card */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-yellow-500/5 blur-2xl scale-110 pointer-events-none" />

          <div className="relative bg-white/[0.04] border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_0_120px_rgba(0,0,0,0.95)]">

            {/* Corner accents */}
            {[
              'top-4 left-4 border-t-2 border-l-2',
              'top-4 right-4 border-t-2 border-r-2',
              'bottom-4 left-4 border-b-2 border-l-2',
              'bottom-4 right-4 border-b-2 border-r-2',
            ].map((cls, i) => (
              <motion.div
                key={i}
                className={`absolute w-5 h-5 border-yellow-500/50 ${cls}`}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}

            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                className="bg-yellow-500/10 w-fit p-4 rounded-2xl mx-auto mb-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ rotate: 180, scale: 1.1 }}
              >
                <Terminal size={32} className="text-yellow-500" />
              </motion.div>

              <motion.h2
                className="text-5xl font-black mb-2 tracking-tight"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                SIGN <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">UP</span>
              </motion.h2>
              <motion.p
                className="text-slate-400 text-[10px] uppercase tracking-[0.3em] font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                New Developer Setup
              </motion.p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <InputField icon={<User size={18} />} type="text" placeholder="DEV_USERNAME" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <InputField icon={<Mail size={18} />} type="email" placeholder="EMAIL_ADDRESS" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                <InputField icon={<Lock size={18} />} type="password" placeholder="SECURE_KEY" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="pt-4"
              >
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03, boxShadow: '0 0 60px rgba(234,179,8,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(234,179,8,0.25)] relative overflow-hidden group"
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  />
                  <motion.span
                    className="relative z-10 flex items-center gap-2"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    Execute Registration
                    <motion.span
                      animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles size={16} />
                    </motion.span>
                  </motion.span>
                </motion.button>
              </motion.div>
            </form>

            <motion.p
              className="text-center mt-10 text-slate-400 text-[10px] tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Already Synced?{' '}
              <motion.button
                onClick={() => navigate('/login')}
                className="text-yellow-500 font-bold hover:text-yellow-400 transition-colors"
                whileHover={{ letterSpacing: '0.08em' }}
              >
                Sign In
              </motion.button>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default RegisterPage;