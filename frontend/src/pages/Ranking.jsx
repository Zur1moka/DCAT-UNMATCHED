import React, { useState, useEffect } from 'react';
import { getExpRanking } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const Ranking = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
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
    socket.on('newMatch', () => {
      fetchRanking();
    });
    return () => socket.off('newMatch');
  }, [socket]);

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;

  const totalPages = Math.ceil(rankings.length / ITEMS_PER_PAGE);
  const currentItems = rankings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
            {currentItems.map((player, index) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
              return (
                <tr key={player.id} className="hover:bg-gray-800/30 transition duration-200">
                  <td className="p-4 text-2xl font-bold text-gold">
                    {globalIndex === 0 ? '🥇' : globalIndex === 1 ? '🥈' : globalIndex === 2 ? '🥉' : `#${globalIndex + 1}`}
                  </td>
                  <td className="p-4 font-semibold text-white">{player.username}</td>
                  <td className="p-4">{player.level}</td>
                  <td className="p-4 text-gold font-mono">{player.xp.toLocaleString()}</td>
                  <td className="p-4 text-green-400">{player.wins}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50 text-white"
          >
            ←
          </button>
          <span className="text-sm text-gray-400">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50 text-white"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default Ranking;