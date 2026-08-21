// src/components/layout/Header.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path) =>
    location.pathname === path ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-white';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <header className="bg-card-dark/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-2">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-gold tracking-wider drop-shadow-lg">
          ⚔️ <span className="hidden sm:inline">Unmatched</span>
        </Link>

        <nav className="flex items-center gap-1 md:gap-3 text-sm font-medium flex-wrap">
          <Link to="/" className={`px-3 py-2 rounded-lg transition-all ${isActive('/')}`}>Dashboard</Link>
          <Link to="/history" className={`px-3 py-2 rounded-lg transition-all ${isActive('/history')}`}>Lịch sử</Link>
          <Link to="/ranking" className={`px-3 py-2 rounded-lg transition-all ${isActive('/ranking')}`}>Xếp hạng</Link>
          <Link to="/tierlist" className={`px-3 py-2 rounded-lg transition-all ${isActive('/tierlist')}`}>Tier List</Link>
          <Link to="/honor" className={`px-3 py-2 rounded-lg transition-all ${isActive('/honor')}`}>Bảng Vàng</Link>

          {user.role === 'admin' && (
            <Link to="/admin" className={`px-3 py-2 rounded-lg transition-all text-neon-green hover:text-green-300 ${isActive('/admin')}`}>
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
      </div>
    </header>
  );
};

export default Header;