import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowDown, FaPlay, FaStar, FaShieldAlt, FaWifi, FaUtensils,
} from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';

import heroImg from '../../assets/landing/hero.jpg';
import room1Img from '../../assets/landing/room1.jpg';
import room2Img from '../../assets/landing/room2.jpg';

const BG_SLIDES = [heroImg, room1Img, room2Img];

const STATS = [
  { value: '500+', label: 'Happy Students',  icon: '🎓' },
  { value: '200+', label: 'Modern Rooms',    icon: '🛏️' },
  { value: '15+',  label: 'Years of Trust',  icon: '🏆' },
  { value: '98%',  label: 'Satisfaction',    icon: '⭐' },
];

const BADGES = [
  { icon: FaShieldAlt, text: '24/7 Security'   },
  { icon: FaWifi,      text: '100 Mbps Wi‑Fi'  },
  { icon: FaUtensils,  text: 'Hygienic Meals'  },
];

export default function Hero() {
  const navigate = useNavigate();
  const [slide, setSlide]       = useState(0);
  const [visible, setVisible]   = useState(false);
  const [scrollY, setScrollY]   = useState(0);
  const heroRef                 = useRef(null);

  /* entrance animation */
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  /* parallax */
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* auto-slide */
  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % BG_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const scrollDown = () =>
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* ── Background slides ── */}
      {BG_SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: i === slide ? 1 : 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${scrollY * 0.3}px) scale(1.05)`,
            willChange: 'transform',
          }}
        />
      ))}

      {/* ── Multi-layer overlay ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-indigo-950/75 to-slate-900/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />

      {/* ── Decorative orbs ── */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Slide dots ── */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {BG_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`transition-all duration-500 rounded-full ${
              i === slide ? 'w-8 h-2 bg-indigo-400' : 'w-2 h-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto pt-20">


        {/* Headline */}
        <h1
          className={`text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight transition-all duration-700 delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Your{' '}
          <span className="relative inline-block">
            <span className="gradient-text">Premium</span>
            <svg
              className="absolute -bottom-3 left-0 w-full"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 10 C80 2, 220 2, 298 10" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
          <br />
          Home Away from Home
        </h1>

        {/* Sub-text */}
        <p
          className={`mt-8 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Experience world-class hostel living with modern amenities, vibrant
          community, and 24/7 support — crafted for students who aim higher.
        </p>

        {/* Feature pills */}
        <div
          className={`flex flex-wrap justify-center gap-3 mt-8 transition-all duration-700 delay-400 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {BADGES.map(({ icon: Icon, text }) => (
            <div key={text} className="glass flex items-center gap-2 px-4 py-2 rounded-full text-white/80 text-sm">
              <Icon className="text-indigo-400" size={14} />
              {text}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center mt-10 transition-all duration-700 delay-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <button
            onClick={() => navigate('/register')}
            className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-lg rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/50 hover:shadow-indigo-700/60 transition-all duration-300 hover:-translate-y-1"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started Free
              <HiArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="group flex items-center gap-3 px-10 py-4 glass text-white font-bold text-lg rounded-2xl hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
          >
            <span className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-indigo-500 transition-colors duration-300">
              <FaPlay size={10} />
            </span>
            Sign In
          </button>
        </div>

        {/* Stats row */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden mt-16 backdrop-blur-sm transition-all duration-700 delay-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {STATS.map(({ value, label, icon }) => (
            <div key={label} className="bg-white/5 hover:bg-white/10 transition-colors duration-300 py-6 px-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-3xl font-black text-white">{value}</div>
              <div className="text-xs text-white/50 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>


      {/* ── Scroll indicator ── */}
      <button
        onClick={scrollDown}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors duration-300 z-20"
        aria-label="Scroll down"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <FaArrowDown className="animate-bounce" size={16} />
        </div>
      </button>
    </section>
  );
}
