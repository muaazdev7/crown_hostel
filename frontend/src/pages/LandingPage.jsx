import { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import About from '../components/landing/About';
import Facilities from '../components/landing/Facilities';
import Testimonials from '../components/landing/Testimonials';
import CallToAction from '../components/landing/CallToAction';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  /* Enable smooth scrolling globally for this page */
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#ffffff' }}>
      <Navbar />
      <Hero />
      <About />
      <Facilities />
      <Testimonials />
      <CallToAction />
      <Footer />
    </div>
  );
}
