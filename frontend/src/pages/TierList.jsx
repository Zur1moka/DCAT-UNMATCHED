// frontend/src/pages/TierList.jsx
import React, { useState, useEffect } from 'react';
import { getHeroes } from '../services/api';

const TierBadge = ({ tier }) => {
  const colors = {
    S: 'bg-purple-900/60 text-purple-300 border-purple-500',
    A: 'bg-red-900/60 text-red-300 border-red-500',
    B: 'bg-blue-900/60 text-blue-300 border-blue-500',
    C: 'bg-green-900/60 text-green-300 border-green-500',
    D: 'bg-gray-700/60 text-gray-300 border-gray-500'
  };
  return (
    <span className={`px-2 sm:px-3 py-0.5 rounded-full border text-xs sm:text-sm font-bold ${colors[tier]}`}>
      Tier {tier}
    </span>
  );
};

const TierList = () => {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getHeroes();
        setHeroes(res.data || []);
      } catch (err) {
        console.error('Lỗi lấy tier list:', err);
        setHeroes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-gray-400 text-center">Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gold mb-4 sm:mb-6">⚔️ Tier List tướng</h1>

      <div className="grid gap-3">
        {heroes.map((hero) => {
          const winrate = hero.usage_count > 0 ? Math.round((hero.wins / hero.usage_count) * 100) : 0;
          return (
            <div
              key={hero.id}
              className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-xl p-3 sm:p-5 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between hover:border-gold/50 transition-all hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <span className="text-base sm:text-xl font-bold text-white min-w-[80px] sm:min-w-[100px]">{hero.name}</span>
                <TierBadge tier={hero.tier} />
                <span className="bg-gray-800 px-2 sm:px-3 py-0.5 rounded-full text-xs text-gray-300">
                  Hệ số <span className="text-gold font-bold">{hero.bonus_multiplier}%</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm mt-2 sm:mt-0 w-full sm:w-auto">
                <span className="text-gray-400">Sử dụng: <span className="text-white font-bold">{hero.usage_count}</span></span>
                <span className="text-green-400">Thắng: {hero.wins}</span>
                <span className="text-red-400">Thua: {hero.losses}</span>
                <span className={`px-2 sm:px-3 py-0.5 rounded-full font-bold text-[10px] sm:text-xs ${
                  winrate >= 60 ? 'bg-green-900/40 text-green-300' :
                  winrate >= 45 ? 'bg-yellow-900/40 text-yellow-300' :
                  'bg-red-900/40 text-red-300'
                }`}>
                  {winrate}% WR
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TierList;