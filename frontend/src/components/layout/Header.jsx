// frontend/src/components/layout/Header.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-white';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/history', label: 'Lịch sử' },
    { path: '/ranking', label: 'Tiến trình Pass' },
    { path: '/tierlist', label: 'Tier List' },
    { path: '/honor', label: 'Bảng Vàng' },
  ];

  return (
    <header className="bg-card-dark/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gold tracking-wider drop-shadow-lg">
          <img
            src="/logo quán.png"
            alt="Logo quán Boardgame"
            className="h-8 sm:h-10 w-auto object-contain"
          />
          <span className="hidden sm:inline">Unmatched</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-3 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 rounded-lg transition-all ${isActive(link.path)}`}
            >
              {link.label}
            </Link>
          ))}
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-lg transition-all text-neon-green hover:text-green-300 ${isActive('/admin')}`}
            >
              ⚙️ Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg transition-all text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            Đăng xuất
          </button>
        </nav>

        {/* Hamburger button (mobile) */}
        <button
          className="md:hidden text-gray-400 hover:text-white focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-card-dark/95 border-t border-gray-800 px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg transition-all text-sm ${isActive(link.path)}`}
            >
              {link.label}
            </Link>
          ))}
          {user.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 rounded-lg transition-all text-sm text-neon-green hover:text-green-300"
            >
              ⚙️ Admin
            </Link>
          )}
          <button
            onClick={() => {
              handleLogout();
              setIsMenuOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-lg transition-all text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;