// src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/ToastContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(username, password);
        showToast('Đăng ký thành công!', 'success');
      } else {
        await login(username, password);
        showToast('Đăng nhập thành công!', 'success');
      }
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.error || 'Có lỗi xảy ra', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <div className="bg-card-dark p-8 rounded-2xl border border-gray-700 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gold text-center mb-6">⚔️ Unmatched</h1>
        <h2 className="text-xl text-white text-center mb-6">{isRegister ? 'Đăng ký' : 'Đăng nhập'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-gold hover:bg-yellow-500 text-black font-bold rounded-lg transition"
          >
            {isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-center text-gray-400 mt-4 text-sm">
          {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-gold hover:underline"
          >
            {isRegister ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;