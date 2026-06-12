import { useEffect, useRef, useState } from 'react';
import {
  FaBed, FaUtensils, FaWifi, FaShieldAlt, FaBook,
  FaDumbbell, FaBus, FaFirstAid, FaGamepad, FaSnowflake,
} from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';

import room1Img from '../../assets/landing/room1.jpg';
import room2Img from '../../assets/landing/room2.jpg';
import room3Img from '../../assets/landing/room3.jpg';
import room4Img from '../../assets/landing/room4.jpg';
import room5Img from '../../assets/landing/room5.jpg';
import room6Img from '../../assets/landing/room6.jpg';
import kitchenImg from '../../assets/landing/kitchen.jpg';
import commonAreaImg from '../../assets/landing/common-area.jpg';
import receptionImg from '../../assets/landing/reception.jpg';
import bathroomImg from '../../assets/landing/bathroom.jpg';

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

/* ── Facilities data with fixed Picsum seeds ── */
const FACILITIES = [
  {
    icon: FaBed,
    title: 'Comfortable Rooms',
    desc: 'Fully furnished single, double & triple rooms with AC, attached baths, and daily housekeeping.',
    img: room1Img,
    badge: 'Most Popular',
    badgeColor: 'bg-indigo-600',
    accent: 'from-indigo-600 to-violet-700',
    featured: true,
  },
  {
    icon: FaUtensils,
    title: 'Mess & Cafeteria',
    desc: 'Hygienic, chef-curated meals three times daily. Veg & non-veg options. Special diet menus available.',
    img: kitchenImg,
    badge: null,
    accent: 'from-orange-500 to-red-600',
    featured: false,
  },
  {
    icon: FaWifi,
    title: 'High-Speed Wi‑Fi',
    desc: '100 Mbps dedicated fibre broadband covering every room and common area. Zero dead zones.',
    img: room2Img,
    badge: 'Free Included',
    badgeColor: 'bg-teal-600',
    accent: 'from-cyan-500 to-teal-600',
    featured: false,
  },
  {
    icon: FaBook,
    title: '24/7 Study Rooms',
    desc: 'Air-conditioned, ultra-quiet study halls with individual carrels, whiteboards, and charging points.',
    img: commonAreaImg,
    badge: 'Open 24/7',
    badgeColor: 'bg-emerald-600',
    accent: 'from-emerald-500 to-green-700',
    featured: false,
  },
  {
    icon: FaShieldAlt,
    title: '24/7 Security',
    desc: 'Biometric entry, round-the-clock guards, full-campus CCTV, and smart visitor management.',
    img: receptionImg,
    badge: null,
    accent: 'from-slate-600 to-slate-800',
    featured: false,
  },
  {
    icon: FaDumbbell,
    title: 'Fitness Center',
    desc: 'State-of-the-art gym with cardio machines, free weights, and certified trainers.',
    img: room3Img,
    badge: null,
    accent: 'from-purple-600 to-indigo-700',
    featured: false,
  },
  {
    icon: FaBus,
    title: 'Transport Service',
    desc: 'Daily shuttle to top universities, colleges, and metro stations. No more missing buses.',
    img: room4Img,
    badge: null,
    accent: 'from-yellow-500 to-orange-500',
    featured: false,
  },
  {
    icon: FaFirstAid,
    title: 'Medical Support',
    desc: 'On-campus nurse, tie-up with a nearby hospital, and a fully stocked medical room.',
    img: bathroomImg,
    badge: null,
    accent: 'from-rose-500 to-pink-700',
    featured: false,
  },
  {
    icon: FaGamepad,
    title: 'Recreation Zone',
    desc: 'TV lounge, indoor games, table tennis, pool table, rooftop seating, and monthly events.',
    img: room5Img,
    badge: null,
    accent: 'from-lime-500 to-emerald-600',
    featured: false,
  },
];

export default function Facilities() {
  const { ref, inView } = useInView();
  const [hovered, setHovered] = useState(null);

  return (
    <section id="facilities" className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${inView ? 'lp-fade-up' : 'opacity-0'}`}
        >
          <span className="section-pill bg-teal-50 text-teal-600 border border-teal-100">
            <span className="w-2 h-2 bg-teal-500 rounded-full" />
            World-Class Facilities
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-2 leading-tight">
            Everything You Need,{' '}
            <span className="gradient-text">Under One Roof</span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            From sunrise to midnight study sessions — our campus has you covered
            every hour of the day.
          </p>
        </div>

        {/* ── Featured card (full-width hero card) ── */}
        {FACILITIES.filter(f => f.featured).map(f => (
          <div
            key={f.title}
            className={`relative rounded-3xl overflow-hidden mb-8 h-72 sm:h-80 shadow-2xl transition-all duration-700 delay-200 ${inView ? 'lp-zoom-in' : 'opacity-0'}`}
          >
            <img
              src={f.img}
              alt={f.title}
              className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-700"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${f.accent} opacity-70`} />
            <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${f.badgeColor}`}>{f.badge}</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <f.icon className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">{f.title}</h3>
                  <p className="text-white/80 text-base mt-1 max-w-xl">{f.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── 8-card grid ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FACILITIES.filter(f => !f.featured).map((f, i) => (
            <div
              key={f.title}
              onMouseEnter={() => setHovered(f.title)}
              onMouseLeave={() => setHovered(null)}
              className={`group relative rounded-2xl overflow-hidden cursor-default shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${inView ? 'lp-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              {/* Image */}
              <div className="relative h-48 img-hover">
                <img
                  src={f.img}
                  alt={f.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-b ${f.accent} opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />

                {/* Icon */}
                <div className="absolute bottom-3 left-3 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <f.icon className="text-white" size={18} />
                </div>

                {/* Badge */}
                {f.badge && (
                  <div className={`absolute top-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full ${f.badgeColor}`}>
                    {f.badge}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 bg-white">
                <h4 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-indigo-600 transition-colors">
                  {f.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{f.desc}</p>
              </div>

              {/* Hover bottom accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${f.accent} scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left`} />
            </div>
          ))}
        </div>

        {/* ── CTA banner ── */}
        <div
          className={`mt-14 relative rounded-3xl overflow-hidden transition-all duration-700 delay-500 ${inView ? 'lp-fade-up' : 'opacity-0'}`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${room6Img})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 to-indigo-800/80" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 px-8 sm:px-12 py-10">
            <div>
              <h3 className="text-white font-extrabold text-2xl sm:text-3xl">
                Ready to experience it all?
              </h3>
              <p className="text-indigo-200 mt-1 text-base">
                Seats are limited — secure yours before they fill up.
              </p>
            </div>
            <a
              href="/register"
              className="group flex-shrink-0 flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 text-base"
            >
              Apply Now
              <HiArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={18} />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
