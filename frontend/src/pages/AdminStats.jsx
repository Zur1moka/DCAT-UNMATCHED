import React, { useState, useEffect } from 'react';
import { getOverviewStats, getDailyStats, getLevelDistribution } from '../services/api';

const AdminStats = () => {
  const [overview, setOverview] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [levelDist, setLevelDist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, dailyRes, levelRes] = await Promise.all([
          getOverviewStats(),
          getDailyStats(7),
          getLevelDistribution(),
        ]);
        setOverview(overviewRes.data);
        setDailyStats(dailyRes.data || []);
        setLevelDist(levelRes.data || []);
      } catch (err) {
        console.error('Lỗi tải thống kê:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Đang tải thống kê...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gold mb-6">📊 Thống kê hệ thống</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card-dark/80 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">Người chơi</p>
          <p className="text-3xl font-bold text-white">{overview?.totalUsers || 0}</p>
        </div>
        <div className="bg-card-dark/80 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">Trận đấu</p>
          <p className="text-3xl font-bold text-neon-green">{overview?.totalMatches || 0}</p>
        </div>
        <div className="bg-card-dark/80 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">Check-in</p>
          <p className="text-3xl font-bold text-gold">{overview?.totalCheckins || 0}</p>
        </div>
        <div className="bg-card-dark/80 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">Nhiệm vụ hoàn thành</p>
          <p className="text-3xl font-bold text-purple-400">{overview?.totalQuestsCompleted || 0}</p>
        </div>
      </div>

      <div className="bg-card-dark/80 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">🔥 Top tướng được sử dụng</h2>
        {overview?.topHeroes?.length === 0 ? (
          <p className="text-gray-500">Chưa có dữ liệu</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Tướng</th>
                  <th className="text-left py-2 px-3">Tier</th>
                  <th className="text-left py-2 px-3">Sử dụng</th>
                  <th className="text-left py-2 px-3">Thắng/Thua</th>
                  <th className="text-left py-2 px-3">Winrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {overview?.topHeroes?.map((hero, index) => (
                  <tr key={hero.name} className="hover:bg-gray-800/30 transition">
                    <td className="py-2 px-3 text-gold font-bold">{index + 1}</td>
                    <td className="py-2 px-3 font-medium text-white">{hero.name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        hero.tier === 'S' ? 'bg-purple-900/60 text-purple-300' :
                        hero.tier === 'A' ? 'bg-red-900/60 text-red-300' :
                        hero.tier === 'B' ? 'bg-blue-900/60 text-blue-300' :
                        hero.tier === 'C' ? 'bg-green-900/60 text-green-300' :
                        'bg-gray-700/60 text-gray-300'
                      }`}>
                        {hero.tier}
                      </span>
                    </td>
                    <td className="py-2 px-3">{hero.usage_count}</td>
                    <td className="py-2 px-3">
                      <span className="text-green-400">{hero.wins}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-red-400">{hero.losses}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        hero.winrate >= 60 ? 'bg-green-900/40 text-green-400' :
                        hero.winrate >= 45 ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-red-900/40 text-red-400'
                      }`}>
                        {hero.winrate || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card-dark/80 border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">📈 Phân bố cấp độ</h2>
        {levelDist.length === 0 ? (
          <p className="text-gray-500">Chưa có dữ liệu</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {levelDist.map((item) => (
              <div key={item.level} className="bg-gray-800/50 p-3 rounded-xl text-center min-w-[60px]">
                <p className="text-xs text-gray-400">Lv.{item.level}</p>
                <p className="text-xl font-bold text-white">{item.count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStats;