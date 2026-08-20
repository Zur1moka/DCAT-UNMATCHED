import React from 'react';
import { mockUser, mockHistory } from '../data/mockData';
import ProgressBar from '../components/ui/ProgressBar';

const Dashboard = () => {
  const user = mockUser;
  const isMaxLevel = user.level >= 10;
  const winrate = Math.round((user.win / (user.win + user.loss)) * 100);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Card chính - Glassmorphism */}
      <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-3xl font-black text-black shadow-lg shadow-gold/20">
            {user.nickname.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{user.nickname}</h1>
              <span className="bg-blue-600/80 backdrop-blur px-3 py-0.5 rounded-full text-sm font-bold border border-blue-400/30">
                Level {user.level}
              </span>
              <span className="bg-green-600/80 backdrop-blur px-3 py-0.5 rounded-full text-sm border border-green-400/30">
                Winrate {winrate}%
              </span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-3 text-sm">
              <div><span className="text-gray-400">Thắng:</span> <span className="text-green-400 font-bold">{user.win}</span></div>
              <div><span className="text-gray-400">Thua:</span> <span className="text-red-400 font-bold">{user.loss}</span></div>
              <div><span className="text-gray-400">🏅 Honor:</span> <span className="text-neon-green font-bold">{user.honorPoints}</span></div>
            </div>
          </div>

          {isMaxLevel && (
            <div className="bg-purple-900/30 border border-purple-500/50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-300">🎟️ Vé Gacha</p>
              <p className="text-2xl font-bold text-gold">{Math.floor((user.xp - 8500) / 800)}</p>
            </div>
          )}
        </div>

        {/* Thanh XP */}
        <div className="mt-6">
          {!isMaxLevel ? (
            <ProgressBar current={user.xp} max={user.maxXpForLevel} label={`Tiến trình Level ${user.level} → ${user.level + 1}`} />
          ) : (
            <ProgressBar current={user.xp} max={user.xp + 200} label="🏆 Cấp Vô Tận (Overcap)" isOvercap />
          )}
        </div>

        {/* Nhiệm vụ nhanh */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-gray-800/50 border border-green-500/30 rounded-xl p-3 text-center hover:scale-105 transition-transform cursor-default">
            <p className="text-xs text-gray-400">📌 Điểm danh</p>
            <p className="text-green-400 font-bold text-sm">+50XP</p>
          </div>
          <div className="bg-gray-800/50 border border-yellow-500/30 rounded-xl p-3 text-center hover:scale-105 transition-transform cursor-default">
            <p className="text-xs text-gray-400">🌙 Thứ 5</p>
            <p className="text-yellow-400 font-bold text-sm">+50XP</p>
          </div>
          <div className="bg-gray-800/50 border border-red-500/30 rounded-xl p-3 text-center hover:scale-105 transition-transform cursor-default">
            <p className="text-xs text-gray-400">🎯 Thảm Đỏ</p>
            <p className="text-red-400 font-bold text-sm">Đã hoàn thành</p>
          </div>
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-xl p-3 text-center hover:scale-105 transition-transform cursor-default">
            <p className="text-xs text-gray-400">💀 Thợ Săn</p>
            <p className="text-purple-400 font-bold text-sm">+100 ELO</p>
          </div>
        </div>
      </div>

      {/* Lịch sử gần đây */}
      <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">🕒 Hoạt động gần đây</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="text-left py-3 px-2">Thời gian</th>
                <th className="text-left px-2">Tướng</th>
                <th className="text-left px-2">Đối thủ</th>
                <th className="text-left px-2">Kết quả</th>
                <th className="text-right px-2 text-gold">XP</th>
              </tr>
            </thead>
            <tbody>
              {mockHistory.slice(0, 4).map((item) => (
                <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="py-3 px-2 text-gray-400 text-xs">{item.time}</td>
                  <td className="px-2 font-semibold">{item.hero}</td>
                  <td className="px-2 text-gray-300">{item.opponent}</td>
                  <td className="px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.result === 'Win' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {item.result}
                    </span>
                  </td>
                  <td className="text-right px-2 text-gold font-bold">+{item.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;