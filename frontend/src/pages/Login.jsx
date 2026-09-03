// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, verifyOTP, resendOTP } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await login(form.username, form.password);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/');
      } else {
        const res = await register(form.username, form.password, form.email);
        if (res.data.userId) {
          setTempEmail(res.data.email);
          setShowOTP(true);
          setOtpMessage('✅ Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.');
        } else {
          setError('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      await verifyOTP(tempEmail, otp);
      setOtpMessage('✅ Xác thực thành công! Bạn có thể đăng nhập.');
      setShowOTP(false);
      setIsLogin(true);
    } catch (err) {
      setOtpMessage('❌ ' + (err.response?.data?.error || 'Mã OTP không hợp lệ'));
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(tempEmail);
      setOtpMessage('📧 Đã gửi lại mã OTP. Kiểm tra email của bạn.');
    } catch (err) {
      setOtpMessage('❌ ' + (err.response?.data?.error || 'Không thể gửi lại OTP'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
      <div className="bg-card-dark border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold">⚔️ Unmatched</h1>
          <p className="text-gray-400 mt-2">Quản lý giải đấu boardgame</p>
        </div>

        {!showOTP ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-gold focus:outline-none transition"
                placeholder="Nhập username"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mật khẩu</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-gold focus:outline-none transition"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-gold focus:outline-none transition"
                  placeholder="Nhập email"
                  required
                />
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </button>

            <div className="mt-4 text-center">
              {isLogin ? (
                <p className="text-sm text-gray-400">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="font-bold text-gold hover:underline focus:outline-none"
                  >
                    Đăng ký
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="font-bold text-gold hover:underline focus:outline-none"
                  >
                    Đăng nhập
                  </button>
                </p>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">{otpMessage}</p>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mã OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-gold focus:outline-none"
                placeholder="Nhập mã OTP"
              />
            </div>
            <button
              onClick={handleVerifyOTP}
              className="w-full bg-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition"
            >
              Xác thực
            </button>
            <button
              onClick={handleResendOTP}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition"
            >
              Gửi lại mã OTP
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Demo: khoa / 123456</p>
          <p>Admin: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;