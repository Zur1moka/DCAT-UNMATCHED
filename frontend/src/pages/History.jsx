// src/pages/History.jsx
import React, { useState, useEffect } from 'react';
import { getMatchHistory } from '../services/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Lấy userId từ localStorage (lưu khi login)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await getMatchHistory(userId);
        setHistory(res.data || []);
      } catch (err) {
        console.error('Lỗi lấy lịch sử:', err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Lọc dữ liệu
  const filteredHistory = history.filter((item) => {
    const myHero = item.player1_hero || item.player2_hero || '';
    const opponentName = item.player2_name || item.player1_name || '';
    const matchSearch =
      myHero.toLowerCase().includes(search.toLowerCase()) ||
      opponentName.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchSearch;
    if (filter === 'win') return matchSearch && item.winner_id === userId;
    if (filter === 'lose') return matchSearch && item.winner_id !== userId;
    return matchSearch;
  });

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gold mb-6">🕒 Lịch sử hoạt động</h1>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm tướng hoặc đối thủ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg p-2 text-white placeholder-gray-500 focus:border-gold focus:outline-none"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
        >
          <option value="all">Tất cả</option>
          <option value="win">Thắng</option>
          <option value="lose">Thua</option>
        </select>
      </div>

      {/* Bảng */}
      <div className="bg-card-dark/80 border border-gray-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50 text-gray-300 border-b border-gray-700">
            <tr>
              <th className="p-4 text-left">Thời gian</th>
              <th className="p-4 text-left">Tướng</th>
              <th className="p-4 text-left">Đối thủ</th>
              <th className="p-4 text-left">Kết quả</th>
              <th className="p-4 text-right text-gold">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  Không tìm thấy kết quả
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => {
                const isWin = item.winner_id === userId;
                const myHero = item.player1_id === userId ? item.player1_hero : item.player2_hero;
                const opponentName =
                  item.player1_id === userId ? item.player2_name : item.player1_name;
                return (
                  <tr key={item.id} className="hover:bg-gray-800/30 transition">
                    <td className="p-4 text-gray-400 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold">{myHero}</td>
                    <td className="p-4 text-gray-300">{opponentName || 'Unknown'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isWin
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-red-900/50 text-red-400'
                        }`}
                      >
                        {isWin ? 'Thắng' : 'Thua'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gold font-bold">
                      +{item.xp_awarded || 0}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;