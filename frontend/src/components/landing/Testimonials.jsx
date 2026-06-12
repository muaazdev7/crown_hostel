import { useEffect, useRef, useState, useCallback } from 'react';
import { FaQuoteLeft, FaStar, FaChevronLeft, FaChevronRight, FaGoogle } from 'react-icons/fa';
import { HiCheckBadge } from 'react-icons/hi2';

import room1Img from '../../assets/landing/room1.jpg';
import room2Img from '../../assets/landing/room2.jpg';
import room3Img from '../../assets/landing/room3.jpg';
import room4Img from '../../assets/landing/room4.jpg';
import room5Img from '../../assets/landing/room5.jpg';
import room6Img from '../../assets/landing/room6.jpg';

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Testimonial data ── */
const TESTIMONIALS = [
  {
    name:    'Ahmed Khan',
    role:    'BS Computer Science — Semester 6',
    college: 'COMSATS University Islamabad, Sahiwal Campus',
    rating:  5,
    comment: "Staying at Crown Hostel has made my university life so much easier. The study environment is peaceful, and the high-speed internet is perfect for coding and assignments. I feel completely secure even during late-night study sessions.",
    img:     room1Img,
    tag:     'Resident since 2022',
  },
  {
    name:    'Fatima Noor',
    role:    'MBBS — Year 3',
    college: 'COMSATS University Islamabad, Sahiwal Campus',
    rating:  5,
    comment: "Medical studies are hectic, but this hostel provides everything I need — clean rooms, healthy food, and a quiet study area. The management is very responsive to complaints. Highly recommended for serious students.",
    img:     room2Img,
    tag:     'Resident since 2023',
  },
  {
    name:    'Usman Ali',
    role:    'BBA — Semester 5',
    college: 'COMSATS University Islamabad, Sahiwal Campus',
    rating:  5,
    comment: "The facilities here are top-class. From Wi-Fi to recreation areas, everything is well maintained. The hostel portal makes fee payments and room applications super easy. It really feels like a premium living experience.",
    img:     room3Img,
    tag:     'Resident since 2021',
  },
  {
    name:    'Ayesha Malik',
    role:    'BS Software Engineering — Semester 4',
    college: 'COMSATS University Islamabad, Sahiwal Campus',
    rating:  5,
    comment: "Moving from another city was stressful, but this hostel felt like home instantly. The environment is friendly, and the security system gives peace of mind to both students and parents.",
    img:     room4Img,
    tag:     'Resident since 2024',
  },
  {
    name:    'Bilal Hussain',
    role:    'BSc Electrical Engineering — Year 2',
    college: 'COMSATS University Islamabad, Sahiwal Campus',
    rating:  5,
    comment: "The rooms are spacious and well-maintained. Electricity backup is a huge plus during load shedding. The study rooms and Wi-Fi help a lot during exams. Definitely one of the best hostels in the city.",
    img:     room5Img,
    tag:     'Resident since 2023',
  },
  {
    name:    'Zainab Tariq',
    role:    'BS Architecture — Semester 5',
    college: 'COMSATS University Islamabad, Sahiwal Campus',
    rating:  5,
    comment: "As an architecture student, I need space and good lighting to work — and this hostel delivers perfectly. The environment is clean, peaceful, and very supportive for late-night work sessions.",
    img:     room6Img,
    tag:     'Resident since 2022',
  },
];

/* ── Single card ── */
function TestimonialCard({ t, active }) {
  return (
    <div
      className={`relative rounded-3xl p-7 transition-all duration-500 flex flex-col justify-between min-h-[320px] ${
        active
          ? 'bg-white shadow-2xl scale-[1.02]'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      {/* Quote icon */}
      <FaQuoteLeft
        className={active ? 'text-indigo-400' : 'text-white/20'}
        size={28}
      />

      {/* Stars */}
      <div className="flex gap-1 mt-3">
        {[...Array(t.rating)].map((_, i) => (
          <FaStar key={i} className="text-amber-400" size={13} />
        ))}
      </div>

      {/* Comment */}
      <p className={`mt-3 text-sm leading-relaxed flex-1 ${active ? 'text-slate-700' : 'text-white/70'}`}>
        "{t.comment}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-100/20">
        <div className="relative">
          <img
            src={t.img}
            alt={t.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
          />
          <HiCheckBadge
            className="absolute -bottom-1 -right-1 text-indigo-500 bg-white rounded-full"
            size={16}
          />
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-sm truncate ${active ? 'text-slate-900' : 'text-white'}`}>{t.name}</p>
          <p className={`text-xs truncate ${active ? 'text-slate-500' : 'text-white/50'}`}>{t.role}</p>
          <p className="text-xs font-semibold text-indigo-400 truncate">{t.college}</p>
        </div>
        <span className="ml-auto text-xs text-white/30 hidden lg:block">{t.tag}</span>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { ref, inView } = useInView();
  const [current, setCurrent]     = useState(0);
  const [animating, setAnimating] = useState(false);
  const total = TESTIMONIALS.length;

  const goTo = useCallback(
    (idx) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => { setCurrent(idx); setAnimating(false); }, 350);
    },
    [animating]
  );

  const prev = () => goTo((current - 1 + total) % total);
  const next = useCallback(() => goTo((current + 1) % total), [current, goTo, total]);

  useEffect(() => {
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next]);

  /* Visible indices for desktop 3-up layout */
  const visibleIdx = [
    (current - 1 + total) % total,
    current,
    (current + 1) % total,
  ];

  return (
    <section
      id="testimonials"
      className="relative py-28 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f2027 100%)',
      }}
    >
      {/* ── Background texture ── */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Decorative blobs ── */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${inView ? 'lp-fade-up' : 'opacity-0'}`}
        >
          

          <span className="section-pill bg-white/10 text-indigo-300 border border-indigo-500/30">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            Student Stories
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mt-3 leading-tight">
            Hear from Our{' '}
            <span className="gradient-text">Happy Residents</span>
          </h2>
          <p className="mt-4 text-white/60 text-lg">
            Don't take our word for it — hear from the students who call Crown home.
          </p>
        </div>

        {/* ── Desktop: 3-column ── */}
        <div
          className={`hidden lg:grid grid-cols-3 gap-5 mb-10 transition-all duration-500 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        >
          {visibleIdx.map((idx, pos) => (
            <TestimonialCard key={idx} t={TESTIMONIALS[idx]} active={pos === 1} />
          ))}
        </div>

        {/* ── Mobile: single card ── */}
        <div
          className={`lg:hidden mb-8 transition-all duration-350 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        >
          <TestimonialCard t={TESTIMONIALS[current]} active />
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={prev}
            className="w-11 h-11 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-all duration-200 flex items-center justify-center hover:scale-105"
          >
            <FaChevronLeft size={14} />
          </button>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-400 ${
                  i === current ? 'w-8 h-2.5 bg-indigo-400' : 'w-2.5 h-2.5 bg-white/25 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-11 h-11 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-all duration-200 flex items-center justify-center hover:scale-105"
          >
            <FaChevronRight size={14} />
          </button>
        </div>

        {/* ── Preview strip ── */}
        <div className="hidden lg:flex justify-center gap-4 mt-8">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 ${i === current ? 'scale-110 ring-2 ring-indigo-400 rounded-full' : 'opacity-50 hover:opacity-80'}`}
            >
              <img
                src={t.img}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
