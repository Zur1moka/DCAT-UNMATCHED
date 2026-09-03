import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token không hợp lệ');
        setVerifying(false);
        return;
      }
      try {
        const res = await verifyResetToken(token);
        if (res.data.valid) {
          setTokenValid(true);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Token không hợp lệ hoặc đã hết hạn');
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await resetPassword(token, password);
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
        <div className="text-gray-400 text-lg">Đang xác thực token...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
      <div className="bg-card-dark border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold">⚔️ Unmatched</h1>
          <p className="text-gray-400 mt-2">Đặt lại mật khẩu</p>
        </div>

        {error && !tokenValid && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {tokenValid ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-gold focus:outline-none transition"
                placeholder="Nhập mật khẩu mới"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-gold focus:outline-none transition"
                placeholder="Xác nhận mật khẩu"
                required
                minLength={6}
              />
            </div>

            {message && (
              <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm">
                {message}
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
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition">
                ← Quay lại đăng nhập
              </Link>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-red-400 mb-4">Token không hợp lệ hoặc đã hết hạn.</p>
            <Link to="/login" className="text-sm text-gold hover:underline">
              ← Quay lại đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;