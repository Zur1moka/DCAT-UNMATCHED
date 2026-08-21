// src/pages/HonorRanking.jsx
import React, { useState, useEffect } from 'react';
import { getHonorRanking } from '../services/api';

const HonorRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getHonorRanking();
        setRankings(res.data || []);
      } catch (err) {
        console.error('Lỗi lấy bảng vàng:', err);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gold">👑 Bảng Vàng Vinh Danh</h1>
        <span className="bg-yellow-900/40 border border-gold/30 text-gold text-xs px-2 py-0.5 rounded-full">ELO</span>
      </div>

      <div className="bg-gradient-to-br from-card-dark to-gray-900/80 border border-gold/20 rounded-2xl overflow-hidden shadow-2xl shadow-gold/5">
        <table className="w-full">
          <thead className="bg-gray-800/70 text-gray-300 text-sm uppercase tracking-wider">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">Chiến binh</th>
              <th className="p-4 text-left">Điểm Honor</th>
              <th className="p-4 text-left">Thắng/Thua</th>
              <th className="p-4 text-left">Winrate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {rankings.map((player, index) => {
              const winrate = player.wins + player.losses > 0 
                ? Math.round((player.wins / (player.wins + player.losses)) * 100) 
                : 0;
              return (
                <tr key={player.id} className="hover:bg-gray-800/30 transition">
                  <td className="p-4 font-bold text-gold">
                    {index === 0 ? '👑' : index === 1 ? '⚜️' : index === 2 ? '🏅' : `#${index + 1}`}
                  </td>
                  <td className="p-4 font-semibold text-white">{player.username}</td>
                  <td className="p-4 text-neon-green font-mono text-lg font-bold">{player.honor_points}</td>
                  <td className="p-4 text-sm">
                    <span className="text-green-400">{player.wins}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-red-400">{player.losses}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      winrate >= 70 ? 'bg-green-900/40 text-green-300' : 
                      winrate >= 50 ? 'bg-yellow-900/40 text-yellow-300' : 
                      'bg-red-900/40 text-red-300'
                    }`}>
                      {winrate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HonorRanking;