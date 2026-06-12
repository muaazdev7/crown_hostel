import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaCheckCircle, FaStar, FaUsers } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';

import heroImg from '../../assets/landing/hero.jpg';
import room1Img from '../../assets/landing/room1.jpg';
import room2Img from '../../assets/landing/room2.jpg';
import room3Img from '../../assets/landing/room3.jpg';
import receptionImg from '../../assets/landing/reception.jpg';
import commonAreaImg from '../../assets/landing/common-area.jpg';
import kitchenImg from '../../assets/landing/kitchen.jpg';

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

const PERKS = [
  'Free Wi-Fi and electricity included',
  'Three nutritious meals daily',
  'Secure, monitored 24/7 campus',
  'Online fee & leave management',
  'Dedicated study and rec zones',
  'Responsive warden support team',
];

const GALLERY = [room1Img, receptionImg, commonAreaImg, kitchenImg];

export default function CallToAction() {
  const navigate = useNavigate();
  const { ref, inView } = useInView();

  return (
    <>
      {/* ── Visual Gallery Strip ── */}
      <section className="relative h-72 sm:h-96 overflow-hidden">
        <div className="flex h-full">
          {GALLERY.map((src, i) => (
            <div key={src} className="flex-1 relative img-hover">
              <img
                src={src}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-950/60 group-hover:opacity-50 transition-opacity" />
            </div>
          ))}
        </div>
        {/* Overlay text on the strip */}
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/40 backdrop-blur-[1px]">
          <div className="text-center">
            <p className="text-white/60 text-sm font-semibold tracking-widest uppercase mb-2">Life at Sunrise</p>
            <h3 className="text-white font-extrabold text-3xl sm:text-4xl">A Community. A Home.</h3>
          </div>
        </div>
      </section>

      {/* ── Main CTA Section ── */}
      <section id="cta" className="relative py-24 overflow-hidden bg-white">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-50 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — image collage */}
            <div
              ref={ref}
              className={`relative transition-all duration-700 ${inView ? 'lp-fade-left' : 'opacity-0'}`}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Tall image */}
                <div className="row-span-2 img-hover rounded-3xl shadow-2xl h-full min-h-[320px]">
                  <img
                    src={heroImg}
                    alt="Student living"
                    className="w-full h-full object-cover rounded-3xl"
                    style={{ minHeight: '320px' }}
                  />
                </div>
                {/* Top-right */}
                <div className="img-hover rounded-2xl shadow-lg h-36">
                  <img
                    src={room2Img}
                    alt="Study room"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                {/* Bottom-right */}
                <div className="img-hover rounded-2xl shadow-lg h-36">
                  <img
                    src={room3Img}
                    alt="Cafeteria"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>


              {/* Social proof chips */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 hidden sm:flex">
                <div className="flex -space-x-2">
                  {[room1Img, room2Img, room3Img].map((src, i) => (
                    <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">+48 joined</p>
                  <p className="text-xs text-slate-400">this month</p>
                </div>
              </div>
            </div>

            {/* Right — text */}
            <div
              className={`transition-all duration-700 delay-300 ${inView ? 'lp-fade-right' : 'opacity-0'}`}
            >
              <span className="section-pill bg-indigo-50 text-indigo-600 border border-indigo-100">
                <HiSparkles size={14} />
                Start Your Journey
              </span>

              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-3 mb-5 leading-tight">
                Join Our{' '}
                <span className="gradient-text">Hostel Community</span>{' '}
                Today
              </h2>

              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                Hundreds of students already enjoy world-class facilities, a vibrant
                community, and a stress-free living experience. Your spot is just a
                click away.
              </p>

              {/* Perks list */}
              <ul className="grid sm:grid-cols-2 gap-2.5 mb-10">
                {PERKS.map(p => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <FaCheckCircle className="text-emerald-500 shrink-0" size={16} />
                    {p}
                  </li>
                ))}
              </ul>


              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="group flex items-center justify-center gap-2 px-9 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all duration-300"
                >
                  Create Free Account
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={16} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-9 py-4 bg-slate-100 text-slate-700 font-bold text-lg rounded-2xl border border-slate-200 hover:bg-slate-200 hover:-translate-y-1 transition-all duration-300"
                >
                  Sign In
                </button>
              </div>

              <p className="mt-4 text-slate-400 text-sm">
                No credit card needed · Free registration · Instant portal access
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
