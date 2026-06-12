import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBed, FaBars, FaTimes, FaPhone } from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';

const NAV_LINKS = [
  { label: 'About',        id: 'about'        },
  { label: 'Facilities',   id: 'facilities'   },
  { label: 'Testimonials', id: 'testimonials' },
  { label: 'Contact',      id: 'footer'       },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [activeLink,  setActiveLink]  = useState('');

  /* Scroll state + active section detection */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);

      // active section highlight
      let found = '';
      NAV_LINKS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) {
          const { top } = el.getBoundingClientRect();
          if (top <= 120) found = id;
        }
      });
      setActiveLink(found);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      

      {/* ── Main Navbar ── */}
      <nav
        className={`fixed left-0 right-0 z-50 transition-all duration-400 ${
          scrolled
            ? 'top-0 bg-slate-950/95 backdrop-blur-md shadow-xl shadow-black/20 py-3'
            : 'top-8 bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* ── Logo ── */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FaBed className="text-white" size={18} />
            </div>
            <div className="leading-none">
              <span className="block font-black text-white text-lg tracking-tight">Crown</span>
              <span className="block text-[10px] font-bold tracking-widest uppercase text-indigo-400">Hostel</span>
            </div>
          </button>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg group ${
                  activeLink === id ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
                <span
                  className={`absolute bottom-1 left-4 right-4 h-0.5 bg-indigo-400 rounded-full transition-all duration-300 ${
                    activeLink === id ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-70 group-hover:scale-x-100'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* ── Desktop CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="tel:+921234567890"
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-semibold transition-colors duration-200"
            >
              <FaPhone size={11} />
              +92 12345 67890
            </a>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-white/80 hover:text-white text-sm font-semibold border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-900/40 hover:from-indigo-500 hover:to-teal-500 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Apply Now
              <HiArrowRight className="group-hover:translate-x-0.5 transition-transform" size={14} />
            </button>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* ── Mobile drawer ── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-400 ${
            menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          } bg-slate-950/98 backdrop-blur-xl border-t border-white/5`}
        >
          <div className="px-4 py-5 space-y-1">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl text-sm font-semibold transition-all"
              >
                {label}
              </button>
            ))}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                onClick={() => { navigate('/login'); setMenuOpen(false); }}
                className="w-full px-4 py-3 text-white/80 border border-white/15 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => { navigate('/register'); setMenuOpen(false); }}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-sm font-bold hover:from-indigo-500 hover:to-teal-500 transition-all"
              >
                Apply Now — Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer so content doesn't hide behind top bar */}
      <div className={`transition-all duration-300 ${scrolled ? 'h-0' : 'h-8'}`} />
    </>
  );
}
