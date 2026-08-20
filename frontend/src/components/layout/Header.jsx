import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-white';

  return (
    <header className="bg-card-dark/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-gold tracking-wider drop-shadow-lg">
          ⚔️ <span className="hidden sm:inline">Unmatched</span>
        </Link>

        <nav className="flex items-center gap-1 md:gap-3 text-sm font-medium">
          <Link to="/" className={`px-3 py-2 rounded-lg transition-all ${isActive('/')}`}>Dashboard</Link>
          <Link to="/history" className={`px-3 py-2 rounded-lg transition-all ${isActive('/history')}`}>Lịch sử</Link>
          <Link to="/ranking" className={`px-3 py-2 rounded-lg transition-all ${isActive('/ranking')}`}>Xếp hạng</Link>
          <Link to="/tierlist" className={`px-3 py-2 rounded-lg transition-all ${isActive('/tierlist')}`}>Tier List</Link>
          <Link to="/honor" className={`px-3 py-2 rounded-lg transition-all ${isActive('/honor')}`}>Bảng Vàng</Link>
          <Link to="/admin" className={`px-3 py-2 rounded-lg transition-all text-neon-green hover:text-green-300 ${isActive('/admin')}`}>
            ⚙️ Admin
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;