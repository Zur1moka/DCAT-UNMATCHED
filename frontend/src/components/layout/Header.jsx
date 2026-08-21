// src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await getProfile();
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Lỗi lấy profile:', err);
    }
  };
  const token = localStorage.getItem('token');
  if (token) {
    fetchUser();
  }
}, []);

  const isActive = (path) =>
    location.pathname === path ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-white';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Lấy chữ cái đầu của username để làm avatar
  const avatarLetter = user?.username?.charAt(0).toUpperCase() || 'U';

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
          
          {/* Chỉ hiển thị Admin nếu user có role admin */}
          {user?.role === 'admin' && (
            <Link 
              to="/admin" 
              className={`px-3 py-2 rounded-lg transition-all text-neon-green hover:text-green-300 ${isActive('/admin')}`}
            >
              ⚙️ Admin
            </Link>
          )}

          {/* Avatar + Logout */}
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-black font-bold text-xs">
              {avatarLetter}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-gray-800/50"
            >
              Đăng xuất
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;