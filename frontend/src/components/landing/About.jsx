import { useEffect, useRef, useState } from 'react';
import {
  FaShieldAlt, FaUsers, FaMedal, FaLeaf,
  FaArrowRight, FaCheckCircle,
} from 'react-icons/fa';

import receptionImg from '../../assets/landing/reception.jpg';
import room1Img from '../../assets/landing/room1.jpg';
import commonAreaImg from '../../assets/landing/common-area.jpg';
import room3Img from '../../assets/landing/room3.jpg';
import room4Img from '../../assets/landing/room4.jpg';
import room5Img from '../../assets/landing/room5.jpg';
import kitchenImg from '../../assets/landing/kitchen.jpg';

/* ── Intersection observer hook ── */
function useInView(threshold = 0.15) {
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

/* ── Local image references ── */
const ABOUT_IMAGES = {
  main:   receptionImg,
  thumb1: room1Img,
  thumb2: commonAreaImg,
};

const PILLARS = [
  {
    icon: FaShieldAlt,
    title: 'Safe & Secure',
    desc:  'Biometric entry, 24/7 CCTV surveillance, and trained security guards keep you safe round the clock.',
    color: 'from-indigo-500 to-indigo-700',
    light: 'bg-indigo-50 text-indigo-600',
    img:   room3Img,
  },
  {
    icon: FaUsers,
    title: 'Vibrant Community',
    desc:  '500+ students from 30+ cities forming lifelong bonds through events, clubs, and collaborative living.',
    color: 'from-teal-500 to-teal-700',
    light: 'bg-teal-50 text-teal-600',
    img:   room4Img,
  },
  {
    icon: FaMedal,
    title: 'Award-Winning Quality',
    desc:  'Consistently rated #1 student hostel by independent surveys with a 4.9-star average rating.',
    color: 'from-amber-500 to-orange-600',
    light: 'bg-amber-50 text-amber-600',
    img:   room5Img,
  },
  {
    icon: FaLeaf,
    title: 'Eco‑Friendly Campus',
    desc:  'Solar-powered blocks, rainwater harvesting, and paperless management for a greener future.',
    color: 'from-emerald-500 to-green-700',
    light: 'bg-emerald-50 text-emerald-600',
    img:   kitchenImg,
  },
];

const ACHIEVEMENTS = [
  { num: '15+', text: 'Years of Excellence' },
  { num: '500+', text: 'Current Residents'  },
  { num: '200+', text: 'Modern Rooms'       },
  { num: '98%',  text: 'Satisfaction Rate'  },
];

const PROMISES = [
  'Clean, hygienic rooms cleaned daily',
  'Three nutritious meals every day',
  'High-speed internet in every room',
  'Dedicated 24/7 warden support',
  'On-campus gym & recreation zone',
  'Fully digital fee & leave management',
];

export default function About() {
  const { ref, inView } = useInView();

  return (
    <section id="about" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section label ── */}
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${inView ? 'lp-fade-up' : 'opacity-0'}`}
        >
          <span className="section-pill bg-indigo-50 text-indigo-600 border border-indigo-100">
            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
            About Crown Hostel
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-2 leading-tight">
            More Than a Place to{' '}
            <span className="gradient-text">Sleep</span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            Since 2009, we've built a living ecosystem where students thrive academically,
            grow personally, and make memories that last a lifetime.
          </p>
        </div>

        {/* ── Featured split layout ── */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">

          {/* Left — image collage */}
          <div
            className={`relative transition-all duration-700 delay-200 ${inView ? 'lp-fade-left' : 'opacity-0'}`}
          >
            {/* Main image */}
            <div className="img-hover rounded-3xl shadow-2xl h-[420px]">
              <img
                src={ABOUT_IMAGES.main}
                alt="Crown Hostel building"
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>

            {/* Thumb overlay 1 */}
            <div className="absolute -bottom-8 -right-6 w-48 h-36 img-hover rounded-2xl shadow-xl border-4 border-white hidden sm:block">
              <img
                src={ABOUT_IMAGES.thumb1}
                alt="Student room"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            {/* Thumb overlay 2 */}
            <div className="absolute -top-6 -left-6 w-36 h-28 img-hover rounded-2xl shadow-xl border-4 border-white hidden sm:block">
              <img
                src={ABOUT_IMAGES.thumb2}
                alt="Hostel common area"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

           

            {/* Decorative shape */}
            <div className="absolute -z-10 -bottom-10 -left-10 w-72 h-72 bg-indigo-100 rounded-full opacity-50" />
          </div>

          {/* Right — text content */}
          <div
            className={`transition-all duration-700 delay-400 ${inView ? 'lp-fade-right' : 'opacity-0'}`}
          >
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
              A Legacy of{' '}
              <span className="gradient-text">Comfort</span>{' '}
              & Academic Excellence
            </h3>
            <p className="text-slate-500 leading-relaxed mb-5">
              Founded with a single mission — to give every student a safe, inspiring,
              and comfortable place to call home — Crown Hostel has grown into the
              city's most trusted student accommodation since 2009.
            </p>
            <p className="text-slate-500 leading-relaxed mb-8">
              From world-class facilities to a 24/7 support system, every detail is
              designed with your success in mind. When you're comfortable and supported,
              you perform at your best.
            </p>

            {/* Promise list */}
            <ul className="grid sm:grid-cols-2 gap-2 mb-8">
              {PROMISES.map(p => (
                <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                  <FaCheckCircle className="text-emerald-500 shrink-0" size={15} />
                  {p}
                </li>
              ))}
            </ul>

            {/* Achievement grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {ACHIEVEMENTS.map(({ num, text }) => (
                <div key={text} className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                  <p className="text-2xl font-black text-indigo-600">{num}</p>
                  <p className="text-xs text-slate-500 mt-1">{text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => document.getElementById('facilities')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold px-7 py-3.5 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all duration-300"
            >
              Explore Facilities
              <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={14} />
            </button>
          </div>
        </div>

        {/* ── 4-pillar cards ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className={`group relative rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${inView ? 'lp-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: `${0.1 + i * 0.12}s` }}
            >
              {/* Pillar image */}
              <div className="relative h-44 img-hover">
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
                {/* Color tint overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${p.color} opacity-60`} />
                {/* Icon */}
                <div className="absolute top-4 left-4 w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <p.icon className="text-white" size={20} />
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 bg-white">
                <h4 className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                  {p.title}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${p.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
