import { useNavigate } from 'react-router-dom';
import {
  FaFacebook, FaTwitter, FaInstagram, FaLinkedin,
  FaYoutube, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaBed, FaWifi, FaShieldAlt, FaStar,
} from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';

import room1Img from '../../assets/landing/room1.jpg';
import room2Img from '../../assets/landing/room2.jpg';
import room3Img from '../../assets/landing/room3.jpg';
import room4Img from '../../assets/landing/room4.jpg';
import room5Img from '../../assets/landing/room5.jpg';
import room6Img from '../../assets/landing/room6.jpg';
import receptionImg from '../../assets/landing/reception.jpg';

const SOCIAL = [
  { Icon: FaFacebook,  href: '#', label: 'Facebook',  hover: 'hover:bg-blue-600'  },
  { Icon: FaTwitter,   href: '#', label: 'Twitter',   hover: 'hover:bg-sky-500'   },
  { Icon: FaInstagram, href: '#', label: 'Instagram', hover: 'hover:bg-pink-600'  },
  { Icon: FaLinkedin,  href: '#', label: 'LinkedIn',  hover: 'hover:bg-blue-500'  },
  { Icon: FaYoutube,   href: '#', label: 'YouTube',   hover: 'hover:bg-red-600'   },
];

const QUICK_LINKS = [
  { label: 'About Us',      href: '#about'        },
  { label: 'Facilities',    href: '#facilities'   },
  { label: 'Testimonials',  href: '#testimonials' },
  { label: 'Apply Now',     href: '/register'     },
  { label: 'Sign In',       href: '/login'        },
  { label: 'Contact',       href: '#footer'       },
];

const POLICIES = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Refund Policy', href: '#' },
];

const HIGHLIGHTS = [
  { icon: FaBed,       text: '200+ Furnished Rooms'    },
  { icon: FaWifi,      text: '100 Mbps Free Wi-Fi'     },
  { icon: FaShieldAlt, text: '24/7 Security'           },
];

export default function Footer() {
  const navigate = useNavigate();

  const handleLink = (href) => {
    if (href.startsWith('#')) {
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(href);
    }
  };

  return (
    <footer id="footer" className="bg-slate-950 text-white overflow-hidden">

      {/* ── Top highlight bar ── */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-600 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center sm:justify-between items-center gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white text-sm font-semibold">
                <Icon size={14} className="opacity-80" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Col 1: Brand ── */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                <FaBed className="text-white" size={20} />
              </div>
              <div>
                <p className="font-extrabold text-white text-xl leading-none">Crown</p>
                <p className="text-indigo-400 text-xs tracking-widest uppercase font-bold">Hostel</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Premium student accommodation since 2009. A place where comfort,
              community, and academic excellence come together.
            </p>

            {/* Social icons */}
            <div className="flex gap-2 flex-wrap">
              {SOCIAL.map(({ Icon, href, label, hover }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white ${hover} hover:border-transparent transition-all duration-200`}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>

            {/* Mini image gallery */}
            <div className="grid grid-cols-3 gap-1.5 mt-6">
              {[room1Img, room2Img, room3Img, room4Img, room5Img, room6Img].map((src, i) => (
                <div key={i} className="img-hover rounded-lg h-14">
                  <img
                    src={src}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Col 2: Quick links ── */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <button
                    onClick={() => handleLink(href)}
                    className="group text-slate-400 hover:text-white text-sm transition-colors duration-200 flex items-center gap-2"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-indigo-400 transition-all duration-200 overflow-hidden" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Contact ── */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Contact Us</h4>
            <ul className="space-y-5">
              <li className="flex gap-3 items-start">
                <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <FaMapMarkerAlt className="text-indigo-400" size={13} />
                </div>
                <span className="text-slate-400 text-sm leading-relaxed">
                  12, University Road,<br />Sahowal, Pakistan — 110075
                </span>
              </li>
              <li className="flex gap-3 items-center">
                <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center shrink-0">
                  <FaPhone className="text-indigo-400" size={13} />
                </div>
                <a href="tel:+911234567890" className="text-slate-400 hover:text-white text-sm transition-colors">
                  +91 12345 67890
                </a>
              </li>
              <li className="flex gap-3 items-center">
                <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center shrink-0">
                  <FaEnvelope className="text-indigo-400" size={13} />
                </div>
                <a href="mailto:info@crownhostel.in" className="text-slate-400 hover:text-white text-sm transition-colors">
                  info@crownhostel.in
                </a>
              </li>
            </ul>

            {/* Map thumbnail */}
            <div className="mt-6 img-hover rounded-2xl h-32 border border-white/10">
              <img
                src={receptionImg}
                alt="Location map"
                className="w-full h-full object-cover rounded-2xl opacity-60 hover:opacity-90 transition-opacity"
              />
            </div>
          </div>

          {/* ── Col 4: Newsletter ── */}
          <div>
 

            {/* Office hours */}
            <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-white text-xs font-bold mb-2">🕘 Office Hours</p>
              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex justify-between"><span>Mon–Fri</span><span className="text-slate-300">9 AM – 6 PM</span></div>
                <div className="flex justify-between"><span>Saturday</span><span className="text-slate-300">10 AM – 4 PM</span></div>
                <div className="flex justify-between"><span>Security</span><span className="text-teal-400 font-bold">24/7</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center sm:text-left">
            © {new Date().getFullYear()} Crown Hostel Management System. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            {POLICIES.map(p => (
              <a
                key={p.label}
                href={p.href}
                className="text-slate-600 hover:text-slate-300 text-xs transition-colors"
              >
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
