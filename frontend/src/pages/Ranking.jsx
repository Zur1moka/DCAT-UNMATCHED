// src/pages/Ranking.jsx
import React, { useState, useEffect } from 'react';
import { getExpRanking } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const Ranking = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchRanking = async () => {
    try {
      const res = await getExpRanking();
      setRankings(res.data || []);
    } catch (err) {
      console.error('Lỗi lấy ranking EXP:', err);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('newMatch', (data) => {
      console.log('📡 New match received:', data);
      fetchRanking(); // Tự động refresh
    });
    return () => socket.off('newMatch');
  }, [socket]);

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gold mb-6 flex items-center gap-3">
        🏆 Bảng xếp hạng EXP
        <span className="text-sm font-normal text-gray-400">(Tie-breaker: số trận thắng)</span>
      </h1>

      <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full">
          <thead className="bg-gray-800/50 text-gray-300 text-sm uppercase tracking-wider">
            <tr>
              <th className="p-4 text-left">Hạng</th>
              <th className="p-4 text-left">Người chơi</th>
              <th className="p-4 text-left">Cấp</th>
              <th className="p-4 text-left">EXP</th>
              <th className="p-4 text-left">Thắng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rankings.map((player, index) => (
              <tr key={player.id} className="hover:bg-gray-800/30 transition duration-200">
                <td className="p-4 text-2xl font-bold text-gold">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </td>
                <td className="p-4 font-semibold text-white">{player.username}</td>
                <td className="p-4">{player.level}</td>
                <td className="p-4 text-gold font-mono">{player.xp.toLocaleString()}</td>
                <td className="p-4 text-green-400">{player.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ranking;