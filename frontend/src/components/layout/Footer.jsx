// frontend/src/components/layout/Footer.jsx
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card-dark/90 border-t border-gray-800 mt-10 py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gold font-bold text-lg flex items-center gap-2">
            ⚔️ Unmatched
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-x-6 text-sm text-gray-400">
            <a
              href="https://maps.app.goo.gl/NJcKKCR4khUNswQ78"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors text-center"
            >
              <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs sm:text-sm">272/1/27 Lê Đức Thọ, P. An Nhơn, TP.HCM</span>
            </a>

            <a href="tel:0838050503" className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-xs sm:text-sm">0838 050 503</span>
            </a>

            <a href="mailto:dcatgamehouse.contact@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs sm:text-sm">dcatgamehouse.contact@gmail.com</span>
            </a>
          </div>

          <div className="text-xs text-gray-500">
            © {currentYear} DCAT Game House
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;